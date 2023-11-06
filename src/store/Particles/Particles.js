
import { vertex_shader, fragment_shader, compute_shader } from '../../assets/Shaders/Particles/shader';
import { simulation_compute } from '../../assets/Shaders/Particles/compute'

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


            // CPU 读取纹理图片并转化为BitMap
            const response = await fetch(
                new URL('../../assets/img/webgpu.png', import.meta.url).toString()
            );
            const imageBitmap = await createImageBitmap(await response.blob());

            const data_payload = {
                imageBitmap: imageBitmap,
                device: device
            }

            context.commit("manage_data", data_payload);

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
         *  注意，如果你要从文件异步读取数据，如模型文件、纹理贴图等，需要将init_data函数设置为
         * 异步函数前加 async 修饰符。
         *  但这会造成后面的 manage_pipeline 函数在被提交时非阻塞运行，无法保证 init_data 
         * 函数中所有的文件被读取完，且运行完后面的配置。也就是说，init内部是阻塞的，但在上层
         * Vue组件中，提交这些函数是非阻塞的，会造成错误，这个应该如何解决呢？？？
         *  action 中允许异步，则整体架构就应该是一个action用于控制时序+多个mutation用于具
         * 体执行的形式
         */
        manage_data(state, payload) {

            const imageBitmap = payload.imageBitmap;
            const device = payload.device;

            //////////////////////////////////////////////////////////////////////////////
            // Texture
            //////////////////////////////////////////////////////////////////////////////
            let texture;
            let textureWidth = 1;
            let textureHeight = 1;
            let numMipLevels = 1;

            // Calculate number of mip levels required to generate the probability map
            /**
             *  对读入的图片生成 MipMap
             * */

            // 这里计算 mipmap 的最大层级
            while (
                textureWidth < imageBitmap.width ||
                textureHeight < imageBitmap.height
            ) {
                textureWidth *= 2;
                textureHeight *= 2;
                numMipLevels++;
            }
            /**
             *  在device端开辟缓冲区用于存储读入的图片纹理，并指定最大 MipMap 层级，
             * 最后将CPU端数据传到GPU端。
             *  注意这里是一个重点！！！与之前的示例不同，这里多指定了一个 mipLevelCount 字段，
             * 用于指示我们将额外开辟多少的纹理空间，用于存储当前纹理的“缩略图”。
             *  使用 numMipLevels 表示直接将 MipMap 等级拉到最强，也就是缩略到只有一个像素为止。
             * 这是由于 MipMap 创建的等级越深实际上每个 level 占用的等级越小。所以一般来说，一旦
             * 使用 MipMap 就直接拉到最强。
             * */ 
            texture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                mipLevelCount: numMipLevels,
                format: 'rgba8unorm',
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.STORAGE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap },
                { texture: texture },
                [imageBitmap.width, imageBitmap.height]
            );
            state.Textures["logo_template"] = {};
            state.Textures["logo_template"]["texture"] = texture;
            state.Textures["logo_template"]["textureWidth"] = textureWidth;
            state.Textures["logo_template"]["textureHeight"] = textureHeight;
            state.Textures["logo_template"]["numMipLevels"] = numMipLevels;



            // 指定模拟中的粒子数量
            state.particle_info["numParticles"] = 150000;
            state.particle_info["particlePositionOffset"] = 0;
            state.particle_info["particleColorOffset"] = 4 * 4;
            /**
             *  每个粒子包含的属性如下
             * */ 
            state.particle_info["particleInstanceByteSize"] =
                3 * 4 + // position
                1 * 4 + // lifetime
                4 * 4 + // color
                3 * 4 + // velocity
                1 * 4 + // padding
                0;


            /**
             *  创建 particlesBuffer 用于表示每个粒子的属性，这里我们将其视为 Vertex Buffer Object
             * */ 
            const particlesBuffer = device.createBuffer({
                size: state.particle_info["numParticles"] * state.particle_info["particleInstanceByteSize"],
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
            });
            state.VBOs["particles"] = particlesBuffer;



            // 深度纹理，这里没有搞清楚为什么还需要深度图？？？有明确的遮挡关系吗？？？
            const depthTexture = device.createTexture({
                size: [state.canvas.width, state.canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            state.Textures["depth"] = {};
            state.Textures["depth"]["texture"] = depthTexture;
            state.Textures["depth"]["textureWidth"] = state.canvas.width;
            state.Textures["depth"]["textureHeight"] = state.canvas.height;

            /**
             *  Uniform Buffer Object
             *  这里表示用于描述粒子运动的MVP矩阵
             * */
            const uniformBufferSize =
                4 * 4 * 4 + // modelViewProjectionMatrix : mat4x4<f32>
                3 * 4 + // right : vec3<f32>
                4 + // padding
                3 * 4 + // up : vec3<f32>
                4 + // padding
                0; // 这里没搞懂 padding 的具体含义
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            // 这里要补充一个 layout 的显式定义
            // 这里的UBO包含的信息不止MVP矩阵，但仍被考虑为一个整体数据结构，使用一个binding编号
            const UBO_Layout = device.createBindGroupLayout({
                /**
                 *  entries 字段以一个数组的形式来描述，数组中的每一个 entry 对应一个 UBO 变量。
                 * 可以看到这里我们只有一个UBO需要描述，即MVP矩阵。所以数组中就只有这一个entry。
                 * 编号为0，visibility字段表示这个UBO变量将暴露给哪些shader阶段，此处只暴露给
                 * vertex shader 阶段。
                 *  buffer字段对type的描述表示其性质，可以是uniform也可以是storage，这里还不涉及
                 * 后者，涉及到再进行介绍。
                 * */
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                ],
            });

            const uniformBindGroup = device.createBindGroup({
                // layout: renderPipeline.getBindGroupLayout(0),
                layout: UBO_Layout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer,
                        },
                    },
                ],
            });


            state.UBOs["particles"] = uniformBuffer;
            state.UBO_Layouts["particles"] = UBO_Layout;
            state.UBO_bindGroups["particles"] = uniformBindGroup;



            //////////////////////////////////////////////////////////////////////////////
            // Quad vertex buffer 这里定义一个 quad 四边形平面用于承接整体的 particles
            //////////////////////////////////////////////////////////////////////////////
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

        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(state, device) {

            const renderPipelineLayout = device.createPipelineLayout({
                label: "Cell Pipeline Layout",
                bindGroupLayouts: [state.UBO_Layouts["particles"]],
            });

            const renderPipeline = device.createRenderPipeline({
                layout: renderPipelineLayout,
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader,
                    }),
                    entryPoint: 'vs_main',
                    /**
                     *  Vertex Shader 阶段有两个 Vertex Buffer Object
                     *  一个是用于指示 Particles 属性的缓冲区
                     *  另一个是粒子平铺的承接载体，即一个四边形平面
                     * */ 
                    buffers: [
                        {
                            // instanced particles buffer
                            arrayStride: state.particle_info["particleInstanceByteSize"],
                            stepMode: 'instance',
                            attributes: [
                                {
                                    // position
                                    shaderLocation: 0,
                                    offset: state.particle_info["particlePositionOffset"],
                                    format: 'float32x3',
                                },
                                {
                                    // color
                                    shaderLocation: 1,
                                    offset: state.particle_info["particleColorOffset"],
                                    format: 'float32x4',
                                },
                            ],
                        },
                        {
                            // quad vertex buffer
                            arrayStride: 2 * 4, // vec2<f32>
                            stepMode: 'vertex',
                            attributes: [
                                {
                                    // vertex positions
                                    shaderLocation: 2,
                                    offset: 0,
                                    format: 'float32x2',
                                },
                            ],
                        },
                    ],
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader,
                    }),
                    entryPoint: 'fs_main',
                    /**
                     *  这里可以看出，每个粒子被视为是半透明体，故引入了alpha blend
                     * 这也进一步验证了之前定义的depth texture是有必要的
                     * */ 
                    targets: [
                        {
                            format: state["canvasFormat"],
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
                        },
                    ],
                },
                primitive: {
                    topology: 'triangle-list',
                },

                depthStencil: {
                    depthWriteEnabled: false,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            });
            state.renderPipelines["particles"] = renderPipeline;



            const renderPassDescriptor = {
                colorAttachments: [
                    {
                        view: undefined, // Assigned later
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment: {
                    view: state.Textures["depth"]["texture"].createView(),

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
            state.passDescriptors["particles"] = renderPassDescriptor;



            //////////////////////////////////////////////////////////////////////////////
            // Probability map generation
            // The 0'th mip level of texture holds the color data and spawn-probability in
            // the alpha channel. The mip levels 1..N are generated to hold spawn
            // probabilities up to the top 1x1 mip level.
            //////////////////////////////////////////////////////////////////////////////
            
            /**
             *  以下这部分开始真正的 Compute Shader。
             *  含义解读：
             * */
            {
                const probabilityMapImportLevelPipeline = device.createComputePipeline({
                    layout: 'auto',
                    compute: {
                        module: device.createShaderModule({ code: simulation_compute }),
                        entryPoint: 'import_level',
                    },
                });
                const probabilityMapExportLevelPipeline = device.createComputePipeline({
                    layout: 'auto',
                    compute: {
                        module: device.createShaderModule({ code: simulation_compute }),
                        entryPoint: 'export_level',
                    },
                });

                const textureWidth = state.Textures["logo_template"]["textureWidth"];
                const textureHeight = state.Textures["logo_template"]["textureHeight"];


                /**
                 *  问题？ probabilityMap 的作用是什么？？
                 * */ 
                const probabilityMapUBOBufferSize =
                    1 * 4 + // stride
                    3 * 4 + // padding
                    0;
                const probabilityMapUBOBuffer = device.createBuffer({
                    size: probabilityMapUBOBufferSize,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });

                // 这两个用作 Storage Buffer 的缓冲区的作用是什么？？？
                // 它们才应该是真正的 ProbabilityMap 吧？
                // 不错，这两个才应该是真正的 Probability Map
                const buffer_a = device.createBuffer({
                    size: textureWidth * textureHeight * 4,
                    usage: GPUBufferUsage.STORAGE,
                });
                const buffer_b = device.createBuffer({
                    size: textureWidth * textureHeight * 4,
                    usage: GPUBufferUsage.STORAGE,
                });
                // 其实 UBO 中存的只是一个当前读入图像源文件的texture宽度
                device.queue.writeBuffer(
                    probabilityMapUBOBuffer,
                    0,
                    new Int32Array([textureWidth])
                );
                /**
                 *  仿真流程是在初始化阶段就预先运行了，而非渲染的运行时
                 * 搞清楚这部分到底是在做什么：其实是在生成 MipMap
                 * */ 
                const commandEncoder = device.createCommandEncoder();
                const numMipLevels = state.Textures["logo_template"]["numMipLevels"];
                for (let level = 0; level < numMipLevels; level++) {
                    const levelWidth = textureWidth >> level;
                    const levelHeight = textureHeight >> level;

                    // 只有在 MipLevel=0 的时候，也就是访问源图像的时候使用 ImportLevelPipeline
                    const pipeline =
                        level == 0
                            ? probabilityMapImportLevelPipeline.getBindGroupLayout(0)
                            : probabilityMapExportLevelPipeline.getBindGroupLayout(0);
                    const probabilityMapBindGroup = device.createBindGroup({
                        layout: pipeline,
                        entries: [
                            {
                                // ubo
                                binding: 0,
                                resource: { buffer: probabilityMapUBOBuffer },
                            },
                            // buffer in / buffer out 二者在互相调换位置
                            {
                                // buf_in
                                binding: 1,
                                resource: { buffer: level & 1 ? buffer_a : buffer_b },
                            },
                            {
                                // buf_out
                                binding: 2,
                                resource: { buffer: level & 1 ? buffer_b : buffer_a },
                            },
                            {
                                // tex_in / tex_out
                                /**
                                 *  注意这里的 baseMipLevel 字段。由于之前我们在创建纹理的时候已经
                                 * 将其指定创建 MipMap，故实际上为不同的 MipLevel 已经额外分配了一定
                                 * 的内存空间，故在此循环中，根据不同的 level，会将其指定到不同的纹理
                                 * 作为当前要写入的空间。
                                 * */ 
                                binding: 3,
                                resource: state.Textures["logo_template"]["texture"].createView({
                                    format: 'rgba8unorm',
                                    dimension: '2d',
                                    baseMipLevel: level,
                                    mipLevelCount: 1,
                                }),
                            },
                        ],
                    });
                    if (level == 0) {
                        const passEncoder = commandEncoder.beginComputePass();
                        passEncoder.setPipeline(probabilityMapImportLevelPipeline);
                        passEncoder.setBindGroup(0, probabilityMapBindGroup);
                        passEncoder.dispatchWorkgroups(Math.ceil(levelWidth / 64), levelHeight);
                        passEncoder.end();
                    } else {
                        const passEncoder = commandEncoder.beginComputePass();
                        passEncoder.setPipeline(probabilityMapExportLevelPipeline);
                        passEncoder.setBindGroup(0, probabilityMapBindGroup);
                        passEncoder.dispatchWorkgroups(Math.ceil(levelWidth / 64), levelHeight);
                        passEncoder.end();
                    }
                }
                device.queue.submit([commandEncoder.finish()]);



                //////////////////////////////////////////////////////////////////////////////
                // Simulation compute pipeline
                //////////////////////////////////////////////////////////////////////////////
                state.simulationParams = {
                    simulate: true,
                    deltaTime: 0.04, // by default
                    // deltaTime: 0.1, // 不添加 GUI 可以手动调整这里控制仿真运行速率
                };

                const simulationUBOBufferSize =
                    1 * 4 + // deltaTime
                    3 * 4 + // padding
                    4 * 4 + // seed
                    0;
                const simulationUBOBuffer = device.createBuffer({
                    size: simulationUBOBufferSize,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });

                state.UBOs["simulation"] = simulationUBOBuffer;

                // 暂时不添加 GUI
                // Object.keys(simulationParams).forEach((k) => {
                //   gui.add(simulationParams, k);
                // });

                const computePipeline = device.createComputePipeline({
                    layout: 'auto',
                    compute: {
                        module: device.createShaderModule({
                            code: compute_shader,
                        }),
                        entryPoint: 'simulate',
                    },
                });
                state.renderPipelines["compute"] = computePipeline;
                const computeBindGroup = device.createBindGroup({
                    layout: computePipeline.getBindGroupLayout(0),
                    entries: [
                        {
                            binding: 0,
                            resource: {
                                buffer: simulationUBOBuffer,
                            },
                        },
                        {
                            binding: 1,
                            resource: {
                                // buffer: particlesBuffer,
                                buffer: state.VBOs["particles"],
                                offset: 0,
                                size: state.particle_info["numParticles"] * state.particle_info["particleInstanceByteSize"],
                            },
                        },
                        {
                            binding: 2,
                            resource: state.Textures["logo_template"]["texture"].createView(),
                        },
                    ],
                });
                state.UBO_bindGroups["compute"] = computeBindGroup;
            }
        },

        /**
         *  Stage04：启动渲染循环
         * */
        renderLoop(state, device) {

            const aspect = state.canvas.width / state.canvas.height;
            const projection = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
            const view = mat4.create();
            const mvp = mat4.create();
            setInterval(() => {
                // /**
                //  *  更新 canvas 大小。附带要更新对应的texture大小。
                //  *  函数中将使用新的 canvas 大小分别更新 renderPassDescriptor 中的 colorAttachment 和 depthAttachment
                //  * */
                // // 在 class 中直接设置，后续不再进行修改
                // updateCanvas(state, device);

                const simulationParams = state.simulationParams;
                device.queue.writeBuffer(
                    state.UBOs["simulation"],
                    0,
                    new Float32Array([
                        simulationParams.simulate ? simulationParams.deltaTime : 0.0,
                        0.0,
                        0.0,
                        0.0, // padding
                        Math.random() * 100,
                        Math.random() * 100, // seed.xy
                        1 + Math.random(),
                        1 + Math.random(), // seed.zw
                    ])
                );

                mat4.identity(view);
                mat4.translate(view, vec3.fromValues(0, 0, -3), view);
                mat4.rotateX(view, Math.PI * -0.2, view);
                mat4.multiply(projection, view, mvp);

                // prettier-ignore
                device.queue.writeBuffer(
                    state.UBOs["particles"],
                    0,
                    new Float32Array([
                        // modelViewProjectionMatrix
                        mvp[0], mvp[1], mvp[2], mvp[3],
                        mvp[4], mvp[5], mvp[6], mvp[7],
                        mvp[8], mvp[9], mvp[10], mvp[11],
                        mvp[12], mvp[13], mvp[14], mvp[15],

                        view[0], view[4], view[8], // right

                        0, // padding

                        view[1], view[5], view[9], // up

                        0, // padding
                    ])
                );
                const swapChainTexture = state.GPU_context.getCurrentTexture();
                // prettier-ignore
                state.passDescriptors["particles"].colorAttachments[0].view = swapChainTexture.createView();

                const numParticles = state.particle_info["numParticles"];
                const commandEncoder = device.createCommandEncoder();
                // 先运行 compute shader
                {
                    const passEncoder = commandEncoder.beginComputePass();
                    passEncoder.setPipeline(state.renderPipelines["compute"]);
                    passEncoder.setBindGroup(0, state.UBO_bindGroups["compute"]);
                    passEncoder.dispatchWorkgroups(Math.ceil(numParticles / 64));
                    passEncoder.end();
                }
                // 之后运行 render pass
                {
                    const passEncoder = commandEncoder.beginRenderPass(state.passDescriptors["particles"]);
                    passEncoder.setPipeline(state.renderPipelines["particles"]);
                    passEncoder.setBindGroup(0, state.UBO_bindGroups["particles"]);
                    passEncoder.setVertexBuffer(0, state.VBOs["particles"]);
                    passEncoder.setVertexBuffer(1, state.VBOs["quad"]);
                    passEncoder.draw(6, numParticles, 0, 0);
                    passEncoder.end();
                }

                device.queue.submit([commandEncoder.finish()]);

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
            renderPipelines: {},
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
