
import { vertex_shader, fragment_shader } from "../../assets/Shaders/Prj01/shader";

// import { mesh } from "../../assets/mesh/stanfordDragon.js"

// import { mat4, vec3, vec4 } from "wgpu-matrix"

// import { getCameraViewProjMatrix } from './utils.js';


export default {
    namespaced: true,
    actions: {
        async init_and_render(context, canvas) {
            const device = context.rootState.device;
            const payload = {
                device: device,
                canvas, canvas,
                img: undefined
            }

            context.commit("init_device", payload);


            // CPU 端读入图片，并创建bitmap
            const response = await fetch(
                new URL('../../assets/img/webgpu.png', import.meta.url).toString()
                // new URL('../../assets/img/eye.jpeg', import.meta.url).toString()
            );
            const imageBitmap = await createImageBitmap(await response.blob());
            let cubeTexture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                format: 'rgba8unorm', // 格式
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap }, // src
                { texture: cubeTexture }, // dst
                [imageBitmap.width, imageBitmap.height] // size
            );
            payload["img"] = imageBitmap;

            context.commit("init_data", payload);

            context.commit("manage_pipeline", payload);

            context.commit("renderLoop", payload);
        }
    },
    mutations: {
        init_device(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;
            state.canvas = canvas;
            state.GPU_context = canvas.getContext("webgpu");
            state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            state.GPU_context.configure({
                device: device,
                format: state.canvasFormat,
                alphaMode: 'premultiplied',
            });
        },

        init_data(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;

            /**
             *  VBOs
             * */
            // init vertices
            const vertices = new Float32Array([
                //   X,    Y,
                -0.8, -0.8, 0.0, 1.0, // Triangle 1
                0.8, -0.8, 1.0, 1.0,
                0.8, 0.8, 1.0, 0.0,

                -0.8, -0.8, 0.0, 1.0, // Triangle 2
                0.8, 0.8, 1.0, 0.0,
                -0.8, 0.8, 0.0, 0.0
            ]);
            state.additional_info["verticesCount"] = vertices.length;

            const vertexBuffer = device.createBuffer({
                size: vertices.byteLength * 2, // 疑惑？？？
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);
            state.VBOs["quad"] = vertexBuffer;

            /**
             *  VBO Layouts
             * */
            const vertexBufferLayout = {
                arrayStride: 2 * 4 + 2 * 4,
                attributes: [
                    // 2d position
                    {
                        shaderLocation: 0,
                        offset: 0,
                        format: "float32x2",
                    },
                    // uv
                    {
                        shaderLocation: 1,
                        offset: 2 * 4,
                        format: "float32x2",
                    }
                ],
            };
            state.VBO_Layouts["quad"] = vertexBufferLayout;


            /**
             * UBOs
             * */
            const GRID_SIZE = 8;
            state.additional_info["GRID_SIZE"] = GRID_SIZE;
            const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
            const uniformBuffer = device.createBuffer({
                size: uniformArray.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(uniformBuffer, 0, uniformArray);
            state.UBOs["grid"] = uniformBuffer;



            /**
             *  SBOs
             * */
            // 创建针对单元格状态的缓冲区，以期望通过动态更新单元格状态来控制绘制
            const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);
            // 我们创建两个 storage buffer 并且使用乒乓模式来更新单元格状态
            const cellStateStorage = [
                device.createBuffer({
                    label: "Cell State A",
                    size: cellStateArray.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                }),
                device.createBuffer({
                    label: "Cell State B",
                    size: cellStateArray.byteLength,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                })
            ];

            // CPU 端初始化填充数据，这里每三个单元格激活一个（其余在定义时，默认为0填充）
            for (let i = 0; i < cellStateArray.length; i += 3) {
                cellStateArray[i] = 1;
            }
            device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

            // Mark every other cell of the second grid as active.
            for (let i = 0; i < cellStateArray.length; i++) {
                cellStateArray[i] = i % 2;
            }
            // 导入数据到GPU
            // 注意这里我们写入的是状态B，之后会使用状态B来更新状态A，如此循环往复
            device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);

            state.SBOs["stateA"] = cellStateStorage[0];
            state.SBOs["stateB"] = cellStateStorage[1];

            /**
             *  Textures
             * */
            const imageBitmap = payload.img;
            const instanceTexture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                format: 'rgba8unorm',
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap }, // src
                { texture: instanceTexture }, // dst
                [imageBitmap.width, imageBitmap.height] // size
            );

            // Create a sampler with linear filtering for smooth interpolation.
            const sampler = device.createSampler({
                magFilter: 'linear',
                minFilter: 'linear',
            });



            /**
             *  Layouts
             * */
            const state_BindGroup_Layout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'read-only-storage',
                        },
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                        // sampler 类型应该如何表达？？？看文档
                        sampler: {
                            type: "filtering"
                        }
                    },
                    {
                        binding: 3,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                        texture: {
                            sampleType: 'float',
                        }
                    }
                ],
            });

            state.Layouts["state"] = state_BindGroup_Layout;


            /**
             *  Bind Groups
             * */
            // 创建一个映射关系，将GPU特定区域指定为 uniform buffer 的读取位置
            // 注意这里与 OpenGL 的Uniform buffer的序号设定是一致的
            const bindGroups = [
                device.createBindGroup({
                    label: "Cell renderer bind group A",
                    layout: state_BindGroup_Layout,
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer: uniformBuffer }
                        },
                        {
                            binding: 1,
                            resource: { buffer: cellStateStorage[0] }
                        },
                        // texture sampler
                        {
                            binding: 2,
                            resource: sampler
                        },
                        // instance sampler
                        {
                            binding: 3,
                            resource: instanceTexture.createView()
                        }
                    ],
                }),
                device.createBindGroup({
                    label: "Cell renderer bind group B",
                    layout: state_BindGroup_Layout,
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer: uniformBuffer }
                        },
                        {
                            binding: 1,
                            resource: { buffer: cellStateStorage[1] }
                        },
                        // texture sampler
                        {
                            binding: 2,
                            resource: sampler
                        },
                        // instance sampler
                        {
                            binding: 3,
                            resource: instanceTexture.createView()
                        }
                    ],
                })
            ];
            state.BindGroups["stateA"] = bindGroups[0];
            state.BindGroups["stateB"] = bindGroups[1];
        },

        manage_pipeline(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;


            /**
             *  Pipelines
             * */
            const cellPipeline = device.createRenderPipeline({
                // 这里不能是 auto 后续要写成显式的模式
                // layout: "auto",
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        state.Layouts["state"]
                    ],
                }),
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader
                    }),
                    entryPoint: "vertexMain",   // 指定 vertex shader 入口函数
                    buffers: [state.VBO_Layouts["quad"]]  // 其中存放输入的顶点数据
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader
                    }),
                    entryPoint: "fragmentMain", // 指定 fragment shader 入口函数
                    targets: [{ // 指定输出对象类型
                        format: state.canvasFormat
                    }]
                }
            });
            state.Pipelines["render"] = cellPipeline;


            /**
             *  Pass Descriptor
             * */
            const defaultDescriptor = {
                colorAttachments: [{
                    view: undefined, // create later
                    loadOp: "clear",
                    clearValue: { r: 0, g: 0, b: 0.0, a: 1.0 },
                    storeOp: "store",
                }]
            };
            state.passDescriptors["render"] = defaultDescriptor;


        },

        renderLoop(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;

            let step = 0; // Track how many simulation steps have been run
            const UPDATE_INTERVAL = 500; // Update every 200ms (5 times/sec)

            setInterval(() => {
                step++; // Increment the step count

                // Start a render pass
                const encoder = device.createCommandEncoder();

                const defaultPassDescriptor = state.passDescriptors["render"];
                defaultPassDescriptor.colorAttachments[0].view = state.GPU_context
                    .getCurrentTexture()
                    .createView();

                const pass = encoder.beginRenderPass(defaultPassDescriptor);

                // Draw the grid.
                pass.setPipeline(state.Pipelines["render"]);
                // 关键点在这里，每次更新将会根据当前的时间步step切换绑定的 storage buffer，从而改变渲染效果
                pass.setBindGroup(0, step % 2 ? state.BindGroups["stateA"] : state.BindGroups["stateB"]);
                pass.setVertexBuffer(0, state.VBOs["quad"]);
                pass.draw(state.additional_info["verticesCount"] / 2, state.additional_info["GRID_SIZE"] * state.additional_info["GRID_SIZE"]);

                // End the render pass and submit the command buffer
                pass.end();
                device.queue.submit([encoder.finish()]);
            }, UPDATE_INTERVAL);

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
            Texture_Views: {},
            Texture_Layouts: {},
            // VBO、UBO這些都可能有多個，所以同樣使用對象來定義
            VBOs: {},
            VBO_Layouts: {},
            IBOs: {},
            UBOs: {},
            Layouts: {},
            BindGroups: {},
            SBOs: {}, // Storage Buffer Object
            vertices_arr: {},
            indices_arr: {},  // 暂时不需要
            passDescriptors: {},
            simulationParams: {}, // 仿真运行参数

            additional_info: {},

        }
    },
    getters: {}
}
