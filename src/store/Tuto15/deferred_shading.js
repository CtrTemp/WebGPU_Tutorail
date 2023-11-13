

import { mesh } from "../../assets/mesh/stanfordDragon.js"

import { compute_shader } from '../../assets/Shaders/Tuto15/light_refresh_comp';
import { geom_vert } from '../../assets/Shaders/Tuto15/geom_vert';
import { geom_frag } from '../../assets/Shaders/Tuto15/geom_frag';
import { quad_vert } from '../../assets/Shaders/Tuto15/quad_vert';
import { debug_frag } from '../../assets/Shaders/Tuto15/debug_frag';
import { render_frag } from '../../assets/Shaders/Tuto15/render_frag';

import { mat4, vec3, vec4 } from "wgpu-matrix"

import { getCameraViewProjMatrix, updateCanvas } from './utils.js';


export default {
    namespaced: true,
    actions: {
        async init_and_render(context, canvas) {
            const device = context.rootState.device;
            const payload = {
                device: device,
                canvas, canvas
            }

            context.commit("init_device", payload);

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

            // 定义全局参数：最大光源数量、光源分布范围
            const kMaxNumLights = 1024;
            const lightExtentMin = vec3.fromValues(-50, -30, -50);
            const lightExtentMax = vec3.fromValues(50, 50, 50);

            state.additional_info["kMaxNumLights"] = kMaxNumLights;
            state.additional_info["lightExtentMin"] = lightExtentMin;
            state.additional_info["lightExtentMax"] = lightExtentMax;

            // Create the model vertex buffer.

            /**
             *  VBOs
             * */
            const kVertexStride = 3 + 3 + 2; // position: vec3, normal: vec3, uv: vec2
            const vertexBuffer = device.createBuffer({
                size: mesh.positions.length * kVertexStride * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            // 数据导入，将模型顶点数据从 CPU 导入 GPU
            {
                const mapping = new Float32Array(vertexBuffer.getMappedRange());
                for (let i = 0; i < mesh.positions.length; ++i) {
                    mapping.set(mesh.positions[i], kVertexStride * i);
                    mapping.set(mesh.normals[i], kVertexStride * i + 3);
                    mapping.set(mesh.uvs[i], kVertexStride * i + 6);
                }
                vertexBuffer.unmap();
            }
            state.VBOs["stanford_dragon"] = vertexBuffer;

            /**
             *  VBO Layouts
             * */
            const Dragon_VBO_Layout =
            {
                arrayStride: Float32Array.BYTES_PER_ELEMENT * 8,
                attributes: [
                    {
                        // position
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        // normal
                        shaderLocation: 1,
                        offset: Float32Array.BYTES_PER_ELEMENT * 3,
                        format: 'float32x3',
                    },
                    {
                        // uv
                        shaderLocation: 2,
                        offset: Float32Array.BYTES_PER_ELEMENT * 6,
                        format: 'float32x2',
                    },
                ],
            };
            state.VBO_Layouts["stanford_dragon"] = Dragon_VBO_Layout;

            // Create the model index buffer.
            /**
            *  IBOs
            * */
            const indexCount = mesh.triangles.length * 3;
            const indexBuffer = device.createBuffer({
                size: indexCount * Uint16Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true,
            });
            state.additional_info["index_count"] = indexCount;
            {
                const mapping = new Uint16Array(indexBuffer.getMappedRange());
                for (let i = 0; i < mesh.triangles.length; ++i) {
                    mapping.set(mesh.triangles[i], 3 * i);
                }
                indexBuffer.unmap();
            }
            state.IBOs["stanford_dragon"] = indexBuffer;

            /**
             *  Textures
             * */
            // GBuffer texture render targets
            /**
            *  延迟渲染管线需要 G-Buffer 
            * 一般至少需要 normal、position、depth 三个 G-Buffer
            * */
            const gBufferTexture2DFloat16 = device.createTexture({
                size: [canvas.width, canvas.height],
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                format: 'rgba16float',
            });
            const gBufferTextureAlbedo = device.createTexture({
                size: [canvas.width, canvas.height],
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                format: 'bgra8unorm',
            });
            const depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });

            state.Textures["normal"] = gBufferTexture2DFloat16;
            state.Textures["albedo"] = gBufferTextureAlbedo;
            state.Textures["depth"] = depthTexture;

            state.Texture_Views["normal"] = gBufferTexture2DFloat16.createView();
            state.Texture_Views["albedo"] = gBufferTextureAlbedo.createView();
            state.Texture_Views["depth"] = depthTexture.createView();

            // const gBufferTextureViews = [
            //     gBufferTexture2DFloat16.createView(),
            //     gBufferTextureAlbedo.createView(),
            //     depthTexture.createView(),
            // ];

            /**
             *  Texture Layouts
             * */
            const gBufferTexturesBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: {
                            sampleType: 'unfilterable-float',
                        },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: {
                            sampleType: 'unfilterable-float',
                        },
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        texture: {
                            sampleType: 'depth',
                        },
                    },
                ],
            });
            state.Texture_Layouts["geometry"] = gBufferTexturesBindGroupLayout;


            /**
             *  UBOs
             * */

            const modelUniformBuffer = device.createBuffer({
                size: 4 * 16 * 2, // two 4x4 matrix
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            state.UBOs["MVP"] = modelUniformBuffer;

            const cameraUniformBuffer = device.createBuffer({
                size: 4 * 16 * 2, // two 4x4 matrix
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            state.UBOs["camera"] = cameraUniformBuffer;


            const settings = {
                mode: 'rendering',
                numLights: 128,
            };
            const configUniformBuffer = (() => {
                const buffer = device.createBuffer({
                    size: Uint32Array.BYTES_PER_ELEMENT,
                    mappedAtCreation: true,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });
                new Uint32Array(buffer.getMappedRange())[0] = settings.numLights;
                buffer.unmap();
                return buffer;
            })();
            state.UBOs["config"] = configUniformBuffer;



            // Lights data are uploaded in a storage buffer
            // which could be updated/culled/etc. with a compute shader
            const extent = vec3.sub(lightExtentMax, lightExtentMin);
            const lightDataStride = 8;
            const bufferSizeInByte =
                Float32Array.BYTES_PER_ELEMENT * lightDataStride * kMaxNumLights;
            const lightsBuffer = device.createBuffer({
                size: bufferSizeInByte,
                usage: GPUBufferUsage.STORAGE,
                mappedAtCreation: true,
            });
            // We randomaly populate lights randomly in a box range
            // And simply move them along y-axis per frame to show they are
            // dynamic lightings
            const lightData = new Float32Array(lightsBuffer.getMappedRange());
            const tmpVec4 = vec4.create();
            let offset = 0;
            for (let i = 0; i < kMaxNumLights; i++) {
                offset = lightDataStride * i;
                // position
                for (let i = 0; i < 3; i++) {
                    tmpVec4[i] = Math.random() * extent[i] + lightExtentMin[i];
                }
                tmpVec4[3] = 1;
                lightData.set(tmpVec4, offset);
                // color
                tmpVec4[0] = Math.random() * 2;
                tmpVec4[1] = Math.random() * 2;
                tmpVec4[2] = Math.random() * 2;
                // radius
                tmpVec4[3] = 20.0;
                lightData.set(tmpVec4, offset + 4);
            }
            lightsBuffer.unmap();
            state.UBOs["storage_light"] = lightsBuffer;

            // Light extent
            const lightExtentBuffer = device.createBuffer({
                size: 4 * 8,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            const lightExtentData = new Float32Array(8);
            lightExtentData.set(lightExtentMin, 0);
            lightExtentData.set(lightExtentMax, 4);
            device.queue.writeBuffer(
                lightExtentBuffer,
                0,
                lightExtentData.buffer,
                lightExtentData.byteOffset,
                lightExtentData.byteLength
            );
            state.UBOs["light_extent"] = lightsBuffer;

            /**
             *  UBO Layouts
             * */
            const lightsBufferBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                        buffer: {
                            type: 'read-only-storage',
                        },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                ],
            });
            state.UBO_Layouts["light"] = lightsBufferBindGroupLayout;

            /**
             *  布局是一样的，唯一区别是更新灯光值的shader layout需要可以对storage buffer
             * 进行写操作
             * */
            const lightsUpdateBufferBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: {
                            type: 'storage', // storage 默认为可读可写
                        },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.COMPUTE,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                ],
            });
            state.UBO_Layouts["update_light"] = lightsUpdateBufferBindGroupLayout;


            const geometryBufferBindGroupLayout = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.VERTEX,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                ],
            });
            state.UBO_Layouts["geometry"] = geometryBufferBindGroupLayout;

            /**
             *  Bind Groups
             * */
            const sceneUniformBindGroup = device.createBindGroup({
                // 这里有问题需要改???
                layout: state.UBO_Layouts["geometry"],
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: modelUniformBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: cameraUniformBuffer,
                        },
                    },
                ],
            });
            state.BindGroups["geometry"] = sceneUniformBindGroup;

            const gBufferTexturesBindGroup = device.createBindGroup({
                layout: state.Texture_Layouts["geometry"],
                entries: [
                    {
                        binding: 0,
                        resource: state.Texture_Views["normal"],
                    },
                    {
                        binding: 1,
                        resource: state.Texture_Views["albedo"],
                    },
                    {
                        binding: 2,
                        resource: state.Texture_Views["depth"],
                    },
                ],
            });
            state.BindGroups["texture"] = gBufferTexturesBindGroup;


            const lightsBufferBindGroup = device.createBindGroup({
                layout: state.UBO_Layouts["light"],
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: lightsBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: configUniformBuffer,
                        },
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: cameraUniformBuffer,
                        },
                    },
                ],
            });
            state.BindGroups["light"] = lightsBufferBindGroup;


            const lightsBufferComputeBindGroup = device.createBindGroup({
                // 这里有问题，后续要修改
                layout: state.UBO_Layouts["update_light"],
                // layout: lightUpdateComputePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: lightsBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: configUniformBuffer,
                        },
                    },
                    {
                        binding: 2,
                        resource: {
                            buffer: lightExtentBuffer,
                        },
                    },
                ],
            });
            state.BindGroups["update_light"] = lightsBufferComputeBindGroup;


        },
        manage_pipeline(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;
            /**
             *  Geometry Pass
             * */
            // 会有多个 layout 吗？ 后面又相似的例子，的确有多个 layout
            // 感觉这里肯定会出问题
            const G_renderPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [state.UBO_Layouts["geometry"]],
            });
            const G_Pass_Pipeline = device.createRenderPipeline({
                // layout: 'auto', // 这里不能是 auto 后面进行更改
                layout: G_renderPipelineLayout, // 这里不能是 auto 后面进行更改
                vertex: {
                    module: device.createShaderModule({
                        code: geom_vert,
                    }),
                    entryPoint: 'main',
                    // 注意buffers是数组的形式传入参数，已经是第二次写错这里了
                    buffers: [state.VBO_Layouts["stanford_dragon"]],
                },
                fragment: {
                    module: device.createShaderModule({
                        code: geom_frag,
                    }),
                    entryPoint: 'main',

                    // 看来只有两个输出的G-Buffer，分别是normal和albedo（反照率？？颜色？？）
                    targets: [
                        // normal
                        { format: 'rgba16float' },
                        // albedo
                        { format: 'bgra8unorm' },
                    ],
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
            });
            state.Pipelines["geometry"] = G_Pass_Pipeline;



            /**
             *  Debug Pass
             * */
            const gBuffersDebugViewPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [state.Texture_Layouts["geometry"]],
                }),
                vertex: {
                    module: device.createShaderModule({
                        code: quad_vert,
                    }),
                    entryPoint: 'main',
                },
                fragment: {
                    module: device.createShaderModule({
                        code: debug_frag,
                    }),
                    entryPoint: 'main',
                    targets: [
                        {
                            format: state.canvasFormat,
                        },
                    ],
                    constants: {
                        canvasSizeWidth: canvas.width,
                        canvasSizeHeight: canvas.height,
                    },
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
            });
            state.Pipelines["debug"] = gBuffersDebugViewPipeline;


            /**
             *  Light Pass
             * */
            const deferredRenderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    // 如果数组中有两个组件，就说明有两个 binding group
                    bindGroupLayouts: [
                        state.Texture_Layouts["geometry"],
                        state.UBO_Layouts["light"],
                    ],
                }),
                vertex: {
                    module: device.createShaderModule({
                        code: quad_vert,
                    }),
                    entryPoint: 'main',
                },
                fragment: {
                    module: device.createShaderModule({
                        code: render_frag,
                    }),
                    entryPoint: 'main',
                    targets: [
                        {
                            format: state.canvasFormat,
                        },
                    ],
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
            });
            state.Pipelines["light"] = deferredRenderPipeline;


            /**
             *  Update Light (Compute Pass)
             * */
            const lightUpdateComputePipeline = device.createComputePipeline({
                // 要进行修改，不能为默认布局
                // layout: 'auto',
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        state.UBO_Layouts["update_light"],
                    ],
                }),
                compute: {
                    module: device.createShaderModule({
                        code: compute_shader,
                    }),
                    entryPoint: 'main',
                },
            });
            state.Pipelines["update_light"] = lightUpdateComputePipeline;


            /**
             *  Pass Descriptor
             * */
            const writeGBufferPassDescriptor = {
                colorAttachments: [
                    {
                        // 这里有问题，记录的应该是view！！！
                        view: state.Texture_Views["normal"],

                        clearValue: { r: 0.0, g: 0.0, b: 1.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                    {
                        view: state.Texture_Views["albedo"],

                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment: {
                    view: state.Texture_Views["depth"],

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
            state.passDescriptors["geometry"] = writeGBufferPassDescriptor;


            const textureQuadPassDescriptor = {
                colorAttachments: [
                    {
                        // view is acquired and set in render loop.
                        view: undefined,

                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            };
            state.passDescriptors["quad"] = textureQuadPassDescriptor;



        },


        renderLoop(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;


            const aspect = canvas.width / canvas.height;

            // Scene matrices
            const eyePosition = vec3.fromValues(0, 50, -100);
            const upVector = vec3.fromValues(0, 1, 0);
            const origin = vec3.fromValues(0, 0, 0);

            const projectionMatrix = mat4.perspective(
                (2 * Math.PI) / 5,
                aspect,
                1,
                2000.0
            );

            const viewMatrix = mat4.inverse(mat4.lookAt(eyePosition, origin, upVector));

            const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);

            // Move the model so it's centered.
            const modelMatrix = mat4.translation([0, -45, 0]);


            const modelData = modelMatrix;
            device.queue.writeBuffer(
                state.UBOs["MVP"],
                0,
                modelData.buffer,
                modelData.byteOffset,
                modelData.byteLength
            );
            const invertTransposeModelMatrix = mat4.invert(modelMatrix);
            mat4.transpose(invertTransposeModelMatrix, invertTransposeModelMatrix);
            const normalModelData = invertTransposeModelMatrix;
            device.queue.writeBuffer(
                state.UBOs["MVP"],
                64,
                normalModelData.buffer,
                normalModelData.byteOffset,
                normalModelData.byteLength
            );

            setInterval(() => {
                const cameraViewProj = getCameraViewProjMatrix(state, viewProjMatrix);
                device.queue.writeBuffer(
                    state.UBOs["camera"],
                    0,
                    cameraViewProj.buffer,
                    cameraViewProj.byteOffset,
                    cameraViewProj.byteLength
                );
                const cameraInvViewProj = mat4.invert(cameraViewProj);
                device.queue.writeBuffer(
                    state.UBOs["camera"],
                    64,
                    cameraInvViewProj.buffer,
                    cameraInvViewProj.byteOffset,
                    cameraInvViewProj.byteLength
                );

                const commandEncoder = device.createCommandEncoder();
                {
                    // Write position, normal, albedo etc. data to gBuffers
                    const gBufferPass = commandEncoder.beginRenderPass(
                        state.passDescriptors["geometry"]
                    );
                    gBufferPass.setPipeline(state.Pipelines["geometry"]);
                    gBufferPass.setBindGroup(0, state.BindGroups["geometry"]);
                    gBufferPass.setVertexBuffer(0, state.VBOs["stanford_dragon"]);
                    gBufferPass.setIndexBuffer(state.IBOs["stanford_dragon"], 'uint16');
                    gBufferPass.drawIndexed(state.additional_info["index_count"]);
                    gBufferPass.end();
                }
                {
                    // Update lights position
                    const lightUpdatePass = commandEncoder.beginComputePass();
                    lightUpdatePass.setPipeline(state.Pipelines["update_light"]);
                    lightUpdatePass.setBindGroup(0, state.BindGroups["update_light"]);
                    lightUpdatePass.dispatchWorkgroups(Math.ceil(state.additional_info["kMaxNumLights"] / 64));
                    lightUpdatePass.end();
                }



                const settings = {
                    mode: 'rendering',
                    numLights: 128,
                };
                const textureQuadPassDescriptor = state.passDescriptors["quad"];
                {
                    if (settings.mode === 'gBuffers view') {
                        // GBuffers debug view
                        // Left: depth
                        // Middle: normal
                        // Right: albedo (use uv to mimic a checkerboard texture)
                        textureQuadPassDescriptor.colorAttachments[0].view = context
                            .getCurrentTexture()
                            .createView();
                        const debugViewPass = commandEncoder.beginRenderPass(
                            textureQuadPassDescriptor
                        );
                        debugViewPass.setPipeline(state.Pipelines["debug"]);
                        debugViewPass.setBindGroup(0, state.BindGroups["texture"]);
                        debugViewPass.draw(6);
                        debugViewPass.end();
                    }
                    else {
                        // Deferred rendering
                        textureQuadPassDescriptor.colorAttachments[0].view = state.GPU_context
                            .getCurrentTexture()
                            .createView();
                        const deferredRenderingPass = commandEncoder.beginRenderPass(
                            textureQuadPassDescriptor
                        );
                        deferredRenderingPass.setPipeline(state.Pipelines["light"]);
                        deferredRenderingPass.setBindGroup(0, state.BindGroups["texture"]);
                        deferredRenderingPass.setBindGroup(1, state.BindGroups["light"]);
                        deferredRenderingPass.draw(6);
                        deferredRenderingPass.end();
                    }
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
            UBO_Layouts: {},
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
