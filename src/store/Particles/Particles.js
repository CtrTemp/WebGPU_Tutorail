
import { vertex_shader, fragment_shader, compute_shader } from '../../assets/Shaders/Tuto17/shader';
import { simulation_compute } from '../assets/Shaders/Tuto17/compute'


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
        init_data(context) {
            const device = context.rootState.device;

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


            const particlesBuffer = device.createBuffer({
                size: numParticles * particleInstanceByteSize,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
            });




            const depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            const uniformBufferSize =
                4 * 4 * 4 + // modelViewProjectionMatrix : mat4x4<f32>
                3 * 4 + // right : vec3<f32>
                4 + // padding
                3 * 4 + // up : vec3<f32>
                4 + // padding
                0;
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const uniformBindGroup = device.createBindGroup({
                layout: renderPipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer,
                        },
                    },
                ],
            });



            //////////////////////////////////////////////////////////////////////////////
            // Quad vertex buffer
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



        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(context) {
            const device = context.rootState.device;

            const renderPipeline = device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader,
                    }),
                    entryPoint: 'vs_main',
                    buffers: [
                        {
                            // instanced particles buffer
                            arrayStride: particleInstanceByteSize,
                            stepMode: 'instance',
                            attributes: [
                                {
                                    // position
                                    shaderLocation: 0,
                                    offset: particlePositionOffset,
                                    format: 'float32x3',
                                },
                                {
                                    // color
                                    shaderLocation: 1,
                                    offset: particleColorOffset,
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
                            format: canvasFormat,
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
                    view: depthTexture.createView(),

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };




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
                                resource: texture.createView({
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
                const simulationParams = {
                    simulate: true,
                    // deltaTime: 0.04, // by default
                    deltaTime: 0.1,
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
                                buffer: particlesBuffer,
                                offset: 0,
                                size: numParticles * particleInstanceByteSize,
                            },
                        },
                        {
                            binding: 2,
                            resource: texture.createView(),
                        },
                    ],
                });
            }
        },
        renderLoop(context) {
            const device = context.rootState.device;

            setInterval(() => {
                
            }, 33);

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
            vertices_arr: {},
            indices_arr: {},  // 暂时不需要
            passDescriptors: {},

            particle_info: {}
        }
    },
    getters: {}
}
