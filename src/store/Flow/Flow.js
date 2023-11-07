
import { vertex_shader, fragment_shader } from '../../assets/Shaders/Flow/shader';

import { mat4, vec3, vec4 } from "wgpu-matrix"

import { updateCanvas } from "./utils"

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

            const payload = {
                canvas: canvas,
                device: device
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


            /**
             *  VBO
             * */
            const particles_pos_data = new Float32Array([
                0.25, 0.25, 0.0, 0.1, 0.9, 0.9,
                0.25, -0.25, 0.0, 0.1, 0.9, 0.9,
                -0.25, -0.25, 0.0, 0.9, 0.1, 0.9,
                -0.25, 0.25, 0.0, 0.9, 0.1, 0.9,
                0.25, 0.25, 0.0, 0.1, 0.9, 0.9,
                0.25, -0.25, 0.0, 0.1, 0.9, 0.9,
            ]);

            const particlesBuffer = device.createBuffer({
                size: particles_pos_data.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
            })
            device.queue.writeBuffer(particlesBuffer, 0, particles_pos_data);
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
            })
            state.UBOs["mvp"] = MVP_UBO_Buffer;

            /**
             *  VBO Layout
             * */
            const particles_VBO_Layout = {
                arrayStride: 6 * 4, // 这里是否要补全 padding 呢？？？
                // stepMode: "instance", // 这个设置的含义是什么
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        // color
                        shaderLocation: 1,
                        offset: 3 * 4,
                        format: 'float32x3'
                    }
                ]
            };
            state.VBO_Layouts["particles"] = particles_VBO_Layout;
            
            const quad_VBO_Layout = {
                arrayStride: 2 * 4, // 这里是否要补全 padding 呢？？？
                // stepMode: "vertex", // 这个设置的含义是什么（注意可能和 instance 有关）
                // 这个的设置很有可能与 WebGPU 没有 geometry shader 存在互补性
                attributes: [
                    {
                        // vertex position
                        shaderLocation: 2,
                        offset: 0,
                        format: 'float32x2',
                    }
                ]
            };


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
                }]
            });
            state.UBO_Layouts["mvp"] = MVP_UBO_Layout;


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

            const MVP_UBO_BindGroup = device.createBindGroup({
                layout: state.UBO_Layouts["mvp"],
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: state.UBOs["mvp"]
                        }
                    }
                ]
            });
            state.UBO_bindGroups["single_mvp"] = MVP_UBO_BindGroup;

            const particle_Render_Pipeline_Layout = device.createPipelineLayout({
                bindGroupLayouts: [state.UBO_Layouts["mvp"]]
            });
            state.Pipeline_Layouts["render_particles"] = particle_Render_Pipeline_Layout;

            console.log("VBO_Layouts = ", state.VBO_Layouts["particles"].arrayStride)

            const render_particles_pipeline = device.createRenderPipeline({
                layout: particle_Render_Pipeline_Layout,
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader
                    }),
                    entryPoint: "vs_main",
                    buffers: [
                        state.VBO_Layouts["particles"]
                    ]
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader
                    }),
                    entryPoint: "fs_main",
                    targets: [
                        {
                            format: state["canvasFormat"]
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
            mat4.translate(view, vec3.fromValues(0, 0, -3), view);
            mat4.rotateX(view, Math.PI * -0.2, view);
            mat4.multiply(projection, view, mvp);

            device.queue.writeBuffer(
                state.UBOs["mvp"],
                0,
                mvp.buffer,
                mvp.byteOffset,
                mvp.byteLength
            );

            const renderPassDescriptor = state.passDescriptors["render_particles"];

            renderPassDescriptor.colorAttachments[0].view = state.GPU_context
                .getCurrentTexture()
                .createView();

            const encoder = device.createCommandEncoder();
            const pass = encoder.beginRenderPass(renderPassDescriptor);

            pass.setPipeline(state.Pipelines["render_particles"]);
            pass.setBindGroup(0, state.UBO_bindGroups["single_mvp"]);
            pass.setVertexBuffer(0, state.VBOs["particles"]);
            // pass.draw(3, 2, 0, 0); // 四边形里面我只画一个三角形
            pass.draw(6, 4, 0, 0); // 四边形里面我只画一个三角形

            pass.end();

            device.queue.submit([encoder.finish()]);
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
