
import { vertex_shader, fragment_shader, compute_shader } from '../../assets/Shaders/Tuto17/shader';
import { simulation_compute } from '../../assets/Shaders/Tuto17/compute'

import { mat4, vec3, vec4 } from "wgpu-matrix"

// import { getCameraViewProjMatrix, updateCanvas } from './utils.js';

export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {
        /**
         *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         */
        init_device(context, canvas) {
            const device = context.rootState.device;
            context.state.canvas = canvas;
            context.state.GPU_context = canvas.getContext("webgpu");
            context.state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            context.state.GPU_context.configure({
                device: device,
                format: context.state.canvasFormat,
            });
        },

        /**
         *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
         * 并借助API将CPU读入的数据导入device 
         */
        // 由于要异步读入数据，所以这里使用异步函数 async
        async init_data(context) {
            const device = context.rootState.device;

            //////////////////////////////////////////////////////////////////////////////
            // Texture
            //////////////////////////////////////////////////////////////////////////////
            let texture;
            let textureWidth = 1;
            let textureHeight = 1;
            let numMipLevels = 1;
            {
                // CPU 读取纹理图片并转化为BitMap
                const response = await fetch(
                    new URL('../../assets/img/logo_resized.png', import.meta.url).toString()
                );
                const imageBitmap = await createImageBitmap(await response.blob());

                // Calculate number of mip levels required to generate the probability map
                /**
                 *  这里 MipMap 具体含义未知
                 * */
                while (
                    textureWidth < imageBitmap.width ||
                    textureHeight < imageBitmap.height
                ) {
                    textureWidth *= 2;
                    textureHeight *= 2;
                    numMipLevels++;
                }
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
                context.state.Textures["logo_template"] = {};
                context.state.Textures["logo_template"]["texture"] = texture;
                context.state.Textures["logo_template"]["textureWidth"] = textureWidth;
                context.state.Textures["logo_template"]["textureHeight"] = textureHeight;
                context.state.Textures["logo_template"]["numMipLevels"] = numMipLevels;
            }
            


            context.state.particle_info["numParticles"] = 5000;
            context.state.particle_info["particlePositionOffset"] = 0;
            context.state.particle_info["particleColorOffset"] = 4 * 4;
            context.state.particle_info["particleInstanceByteSize"] =
                3 * 4 + // position
                1 * 4 + // lifetime
                4 * 4 + // color
                3 * 4 + // velocity
                1 * 4 + // padding
                0;


            // 创建 particlesBuffer 目前含义未知
            const particlesBuffer = device.createBuffer({
                size: context.state.particle_info["numParticles"] * context.state.particle_info["particleInstanceByteSize"],
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
            });
            // 这里我们将 particles 数据算作是 Storage Buffer Object
            context.state.VBOs["particles"] = particlesBuffer;



            // 深度纹理
            const depthTexture = device.createTexture({
                size: [context.state.canvas.width, context.state.canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            context.state.Textures["depth"] = {};
            context.state.Textures["depth"]["texture"] = depthTexture;
            context.state.Textures["depth"]["textureWidth"] = context.state.canvas.width;
            context.state.Textures["depth"]["textureHeight"] = context.state.canvas.height;

            /**
             *  Uniform Buffer Object
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


            context.state.UBOs["particles"] = uniformBuffer;
            context.state.UBO_Layouts["particles"] = UBO_Layout;
            context.state.UBO_bindGroups["particles"] = uniformBindGroup;



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
            context.state.VBOs["quad"] = quadVertexBuffer;

        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(context) {
            const device = context.rootState.device;

            console.log("renderPipeline layout = ", context.state.UBO_Layouts["particles"]);

            const renderPipeline = device.createRenderPipeline({
                // layout: context.state.UBO_Layouts["particles"],
                layout: "auto", // 这样写真的好么？？？前后不统一
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader,
                    }),
                    entryPoint: 'vs_main',
                    buffers: [
                        {
                            // instanced particles buffer
                            arrayStride: context.state.particle_info["particleInstanceByteSize"],
                            stepMode: 'instance',
                            attributes: [
                                {
                                    // position
                                    shaderLocation: 0,
                                    offset: context.state.particle_info["particlePositionOffset"],
                                    format: 'float32x3',
                                },
                                {
                                    // color
                                    shaderLocation: 1,
                                    offset: context.state.particle_info["particleColorOffset"],
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
                    targets: [
                        {
                            format: context.state["canvasFormat"],
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
            context.state.renderPipelines["particles"] = renderPipeline;



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
                    view: context.state.Textures["depth"]["texture"].createView(),

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
            context.state.passDescriptors["particles"] = renderPassDescriptor;



            /**
             *  以下这部分开始真正的 Compute Shader
             * */

            //////////////////////////////////////////////////////////////////////////////
            // Probability map generation
            // The 0'th mip level of texture holds the color data and spawn-probability in
            // the alpha channel. The mip levels 1..N are generated to hold spawn
            // probabilities up to the top 1x1 mip level.
            //////////////////////////////////////////////////////////////////////////////
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

                context.state.renderPipelines["probability_inmport"] = probabilityMapImportLevelPipeline;

                const textureWidth = context.state.Textures["logo_template"]["textureWidth"];
                const textureHeight = context.state.Textures["logo_template"]["textureHeight"];

                const probabilityMapUBOBufferSize =
                    1 * 4 + // stride
                    3 * 4 + // padding
                    0;
                const probabilityMapUBOBuffer = device.createBuffer({
                    size: probabilityMapUBOBufferSize,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                const buffer_a = device.createBuffer({
                    size: textureWidth * textureHeight * 4,
                    usage: GPUBufferUsage.STORAGE,
                });
                const buffer_b = device.createBuffer({
                    size: textureWidth * textureHeight * 4,
                    usage: GPUBufferUsage.STORAGE,
                });
                device.queue.writeBuffer(
                    probabilityMapUBOBuffer,
                    0,
                    new Int32Array([textureWidth])
                );
                const commandEncoder = device.createCommandEncoder();
                const numMipLevels = context.state.Textures["logo_template"]["numMipLevels"];
                for (let level = 0; level < numMipLevels; level++) {
                    const levelWidth = textureWidth >> level;
                    const levelHeight = textureHeight >> level;
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
                                binding: 3,
                                resource: context.state.Textures["logo_template"]["texture"].createView({
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
                context.state.simulationParams = {
                    simulate: true,
                    // deltaTime: 0.04, // by default
                    deltaTime: 0.1, // 不添加 GUI 可以手动调整这里控制仿真运行速率
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

                context.state.UBOs["simulation"] = simulationUBOBuffer;

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
                context.state.renderPipelines["compute"] = computePipeline;
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
                                buffer: context.state.VBOs["particles"],
                                offset: 0,
                                size: context.state.particle_info["numParticles"] * context.state.particle_info["particleInstanceByteSize"],
                            },
                        },
                        {
                            binding: 2,
                            resource: context.state.Textures["logo_template"]["texture"].createView(),
                        },
                    ],
                });
                context.state.UBO_bindGroups["compute"] = computeBindGroup;
            }
        },


        renderLoop(context) {
            const device = context.rootState.device;

            const aspect = context.state.canvas.width / context.state.canvas.height;
            const projection = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
            const view = mat4.create();
            const mvp = mat4.create();

            {

                // Sample is no longer the active page.
                // if (!pageState.active) return;

                const simulationParams = context.state.simulationParams;
                device.queue.writeBuffer(
                    context.state.UBOs["simulation"],
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
                    context.state.UBOs["particles"],
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
                const swapChainTexture = context.state.GPU_context.getCurrentTexture();
                // prettier-ignore
                context.state.passDescriptors["particles"].colorAttachments[0].view = swapChainTexture.createView();

                const numParticles = context.state.particle_info["numParticles"];
                const commandEncoder = device.createCommandEncoder();
                {
                    const passEncoder = commandEncoder.beginComputePass();
                    passEncoder.setPipeline(context.state.renderPipelines["compute"]);
                    passEncoder.setBindGroup(0, context.state.UBO_bindGroups["compute"]);
                    passEncoder.dispatchWorkgroups(Math.ceil(numParticles / 64));
                    passEncoder.end();
                }
                {
                    const passEncoder = commandEncoder.beginRenderPass(context.state.passDescriptors["particles"]);
                    passEncoder.setPipeline(context.state.renderPipelines["particles"]);
                    passEncoder.setBindGroup(0, context.state.UBO_bindGroups["particles"]);
                    passEncoder.setVertexBuffer(0, context.state.VBOs["particles"]);
                    passEncoder.setVertexBuffer(1, context.state.VBOs["quad"]);
                    passEncoder.draw(6, numParticles, 0, 0);
                    passEncoder.end();
                }

                device.queue.submit([commandEncoder.finish()]);

                // requestAnimationFrame(frame);
            }

        }
    },
    mutations: {

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
