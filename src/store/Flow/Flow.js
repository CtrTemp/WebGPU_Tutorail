
import { vertex_shader, fragment_shader } from '../../assets/Shaders/Flow/shader';
import { simulation_compute } from '../../assets/Shaders/Flow/compute';

import { mat4, vec3, vec4 } from "wgpu-matrix"

import { updateCanvas } from "./utils"

import {
    gen_straight_line_arr,
    gen_axis_line_arr,
    gen_sin_func_arr,
    read_data_and_gen_line
} from './gen_curve_line';

// import { getCameraViewProjMatrix, updateCanvas } from './utils.js';




export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {

        // 整体框架，内为异步函数，用于简单操控数据异步读取，阻塞式等待。
        async init_and_render(context, canvas) {
            const device = context.rootState.device;

            // 读取json文件
            // 这里就获取到完整的JSON文件了，下一步就是数据解析
            const response = await fetch(
                new URL('../../assets/flow_data/cell/_cell_31.json', import.meta.url).toString()
            );
            const lines_data = await response.json();

            // const flow_info = read_data_and_gen_line(lines_data, 10, [0.0, 0.5, 1.0, 1.0]);
            const flow_info = read_data_and_gen_line(lines_data, 100, [1.0, 0.5, 0.0, 1.0], 10, 3);

            const payload = {
                canvas: canvas,
                device: device,
                flow_info: flow_info
            }

            context.commit("init_device", payload);

            context.commit("manage_data", payload);

            context.commit("manage_pipeline", device);

            context.commit("renderLoop", device);
        },




    },
    mutations: {

        /**
         *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         */
        init_device(state, { canvas, device }) {
            state.canvas = canvas;
            state.GPU_context = canvas.getContext("webgpu");
            state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            state.GPU_context.configure({
                device: device,
                format: state.canvasFormat,
            });
        },


        /**
         *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
         * 并借助API将CPU读入的数据导入device 
         */
        manage_data(state, payload) {

            const device = payload.device;
            console.log("payload = ", payload);

            // 全局粒子總數
            state.particle_info["numParticles"] = payload.flow_info.numParticles;
            state.particle_info["lifetime"] = payload.flow_info.lifetime;
            state.particle_info["particleInstanceByteSize"] =
                4 * 4 + // pos
                4 * 4 + // color
                1 * 4 + // life time
                3 * 4 + // padding
                0;

            /**
             *  VBO
             * */

            const particles_data = payload.flow_info.flow_arr;
            console.log("particles data = ", particles_data);

            // 應該將以上轉換成 Float32Arr
            const writeBufferArr = new Float32Array(particles_data);


            const particlesBuffer = device.createBuffer({
                size: writeBufferArr.byteLength,
                // 這裡的 STORAGE 的用途是什麼
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            })
            device.queue.writeBuffer(particlesBuffer, 0, writeBufferArr);
            state.VBOs["particles"] = particlesBuffer;



            const quadVertexBuffer = device.createBuffer({
                size: 6 * 2 * 4, // 6x vec2<f32>
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            // prettier-ignore
            const vertexData = [
                -1.0, -1.0, +1.0, -1.0, -1.0, +1.0, -1.0, +1.0, +1.0, -1.0, +1.0, +1.0,
            ];
            new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
            quadVertexBuffer.unmap();
            state.VBOs["quad"] = quadVertexBuffer;


            /**
             *  UBO
             * */
            const MVP_Buffer_size = 4 * 4 * 4;
            const MVP_UBO_Buffer = device.createBuffer({
                size: MVP_Buffer_size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            state.UBOs["mvp"] = MVP_UBO_Buffer;

            const RIGHT_Buffer_size = 3 * 4;
            const RIGHT_UBO_Buffer = device.createBuffer({
                size: RIGHT_Buffer_size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            state.UBOs["right"] = RIGHT_UBO_Buffer;

            const UP_Buffer_size = 3 * 4;
            const UP_UBO_Buffer = device.createBuffer({
                size: UP_Buffer_size,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            state.UBOs["up"] = UP_UBO_Buffer;


            const simu_Control_UBO_BufferSize =
                1 * 4 + // deltaTime
                3 * 4 + // padding
                4 * 4 + // seed
                1 * 4 + // particle_nums
                3 * 4 + // padding
                0;
            const simu_Control_UBO_Buffer = device.createBuffer({
                size: simu_Control_UBO_BufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            state.UBOs["compute"] = simu_Control_UBO_Buffer;

            /**
             *  VBO Layout
             * */
            const particles_VBO_Layout = {
                arrayStride: 12 * 4, // 这里是否要补全 padding 呢？？？
                stepMode: "instance", // 这个设置的含义是什么
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x4',
                    },
                    {
                        // color
                        shaderLocation: 1,
                        offset: 4 * 4,
                        format: 'float32x4'
                    },
                    {
                        // lifetime
                        shaderLocation: 2,
                        offset: 8 * 4,
                        format: 'float32x4'
                    }
                ]
            };
            state.VBO_Layouts["particles"] = particles_VBO_Layout;

            const quad_VBO_Layout = {
                arrayStride: 2 * 4, // 这里是否要补全 padding 呢？？？
                stepMode: "vertex", // 这个设置的含义是什么（注意可能和 instance 有关）（默认是vertex）
                // 这个的设置很有可能与 WebGPU 没有 geometry shader 存在互补性
                attributes: [
                    {
                        // vertex position
                        shaderLocation: 3,
                        offset: 0,
                        format: 'float32x2',
                    }
                ]
            };
            state.VBO_Layouts["quad"] = quad_VBO_Layout;


            /**
             *  UBO Layout
             * */
            const MVP_UBO_Layout = device.createBindGroupLayout({
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                }, {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                }, {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "uniform"
                    }
                }]
            });
            state.UBO_Layouts["mvp"] = MVP_UBO_Layout;

            const compute_UBO_Layout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: {
                            type: "uniform"
                        }
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: {
                            type: "storage"
                        }
                    }
                ]
            });
            state.UBO_Layouts["compute"] = compute_UBO_Layout;


            /**
             *  depth Texture
             * */
            const depthTexture = device.createTexture({
                size: [state.canvas.width, state.canvas.height],
                format: "depth24plus",
                usage: GPUTextureUsage.RENDER_ATTACHMENT
            });
            state.Textures["depth"] = {};
            state.Textures["depth"]["texture"] = depthTexture;
            state.Textures["depth"]["textureWidth"] = state.canvas.width;
            state.Textures["depth"]["textureHeight"] = state.canvas.height;

        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(state, device) {


            /* ########################### Render Pipeline ########################### */
            const MVP_UBO_BindGroup = device.createBindGroup({
                layout: state.UBO_Layouts["mvp"],
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: state.UBOs["mvp"]
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: state.UBOs["right"]
                        }
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: state.UBOs["up"]
                        }
                    },
                ]
            });
            state.UBO_bindGroups["mvp_pack"] = MVP_UBO_BindGroup;

            const particle_Render_Pipeline_Layout = device.createPipelineLayout({
                bindGroupLayouts: [state.UBO_Layouts["mvp"]]
            });
            state.Pipeline_Layouts["render_particles"] = particle_Render_Pipeline_Layout;


            const render_particles_pipeline = device.createRenderPipeline({
                layout: particle_Render_Pipeline_Layout,
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader
                    }),
                    entryPoint: "vs_main",
                    buffers: [
                        state.VBO_Layouts["particles"],
                        state.VBO_Layouts["quad"]
                    ]
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader
                    }),
                    entryPoint: "fs_main",
                    targets: [
                        {
                            format: state["canvasFormat"],
                            // 這一步是設置 半透明度 必須的要素
                            blend: {
                                color: {
                                    srcFactor: 'src-alpha',
                                    dstFactor: 'one',
                                    operation: 'add',
                                },
                                alpha: {
                                    srcFactor: 'zero',
                                    dstFactor: 'one',
                                    operation: 'add',
                                },
                            },
                        }
                    ]
                },
                primitive: {
                    topology: "triangle-list",
                },
                depthStencil: {
                    depthWriteEnabled: false,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            });
            state.Pipelines["render_particles"] = render_particles_pipeline;


            const renderPassDescriptor = {
                colorAttachments: [
                    {
                        view: undefined,
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ],
                depthStencilAttachment: {
                    view: state.Textures["depth"]["texture"].createView(),
                    depthClearValue: 1.0,
                    depthLoadOp: "clear",
                    depthStoreOp: "store"
                }
            };
            state.passDescriptors["render_particles"] = renderPassDescriptor;




            /* ########################### Compute Pipeline ########################### */

            const particle_Compute_Pipeline_Layout = device.createPipelineLayout({
                bindGroupLayouts: [state.UBO_Layouts["compute"]]
            });
            state.Pipeline_Layouts["simu_particles"] = particle_Render_Pipeline_Layout;

            const computePipeline = device.createComputePipeline({
                layout: particle_Compute_Pipeline_Layout,
                compute: {
                    module: device.createShaderModule({
                        code: simulation_compute,
                    }),
                    entryPoint: 'simulate',
                },
            });
            state.Pipelines["simu_particles"] = computePipeline;

            const simu_particles_BindGroup = device.createBindGroup({
                layout: state.UBO_Layouts["compute"],
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: state.UBOs["compute"]
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: state.VBOs["particles"],
                            offset: 0,
                            size: state.particle_info["numParticles"] * state.particle_info["particleInstanceByteSize"]
                        }
                    }
                ]
            });

            state.UBO_bindGroups["compute"] = simu_particles_BindGroup;


        },

        /**
         *  Stage04：启动渲染循环
         * */
        renderLoop(state, device) {
            const aspect = state.canvas.width / state.canvas.height;
            const projection = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
            const view = mat4.create();
            const mvp = mat4.create();


            mat4.identity(view);
            mat4.translate(view, vec3.fromValues(-9.5, -4.5, -2.5), view);
            // mat4.rotateX(view, Math.PI * -0.2, view);
            mat4.multiply(projection, view, mvp);

            device.queue.writeBuffer(
                state.UBOs["mvp"],
                0,
                mvp.buffer,
                mvp.byteOffset,
                mvp.byteLength
            );

            device.queue.writeBuffer(
                state.UBOs["right"],
                0,
                new Float32Array([
                    view[0], view[4], view[8], // right
                ])
            );
            device.queue.writeBuffer(
                state.UBOs["up"],
                0,
                new Float32Array([
                    view[1], view[5], view[9], // up
                ])
            );

            device.queue.writeBuffer(
                state.UBOs["compute"],
                0,
                new Float32Array([
                    1.0,
                    0.0,
                    0.0,
                    0.0,// padding
                    Math.random() * 100,
                    Math.random() * 100, // seed.xy
                    1 + Math.random(),
                    1 + Math.random(), // seed.zw
                    state.particle_info["lifetime"],
                    0.0,
                    0.0,
                    0.0
                ])
            );



            setInterval(() => {

                const renderPassDescriptor = state.passDescriptors["render_particles"];

                renderPassDescriptor.colorAttachments[0].view = state.GPU_context
                    .getCurrentTexture()
                    .createView();

                const encoder = device.createCommandEncoder();

                /**
                 *  Simulation Pass
                 * */
                {
                    const pass = encoder.beginComputePass();
                    pass.setPipeline(state.Pipelines["simu_particles"]);
                    pass.setBindGroup(0, state.UBO_bindGroups["compute"]);
                    pass.dispatchWorkgroups(Math.ceil(state.particle_info["numParticles"] / 64));
                    pass.end();
                }



                /**
                 *  Render Pass
                 * */
                {
                    const pass = encoder.beginRenderPass(renderPassDescriptor);
                    pass.setPipeline(state.Pipelines["render_particles"]);
                    pass.setBindGroup(0, state.UBO_bindGroups["mvp_pack"]);
                    pass.setVertexBuffer(0, state.VBOs["particles"]);
                    pass.setVertexBuffer(1, state.VBOs["quad"]);
                    pass.draw(6, state.particle_info["numParticles"], 0, 0); // 四边形里面我只画一个三角形

                    pass.end();
                }

                device.queue.submit([encoder.finish()]);
            }, 25);
        }
    },
    state() {
        return {
            // 我們假定目前只有一個 canvas
            canvas: null,
            canvasFormat: null,
            // 指向當前GPU上下文，所以只需要一個 
            GPU_context: null,
            // 渲染管線可以有多條，我們使用一個對象來定義
            Pipelines: {},
            Pipeline_Layouts: {},
            // 各类纹理
            Textures: {},
            // VBO、UBO這些都可能有多個，所以同樣使用對象來定義
            VBOs: {},
            VBO_Layouts: {},
            IBOs: {},
            UBOs: {},
            UBO_Layouts: {},
            UBO_bindGroups: {},
            SBOs: {}, // Storage Buffer Object
            vertices_arr: {},
            indices_arr: {},  // 暂时不需要
            passDescriptors: {},
            simulationParams: {}, // 仿真运行参数

            particle_info: {}
        }
    },
    getters: {}
}
