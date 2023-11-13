
import { vertex_shader, fragment_shader } from '../../assets/Shaders/Tuto16/shader';
import { shadow_vert } from '../../assets/Shaders/Tuto16/shadow'

import { mesh } from "../../assets/mesh/stanfordDragon.js"


import { mat4, vec3, vec4 } from "wgpu-matrix"

import { getCameraViewProjMatrix } from './utils.js';


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

            /**
             *  VBOs
             * */
            const vertexBuffer = device.createBuffer({
                size: mesh.positions.length * 3 * 2 * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            {
                const mapping = new Float32Array(vertexBuffer.getMappedRange());
                for (let i = 0; i < mesh.positions.length; ++i) {
                    mapping.set(mesh.positions[i], 6 * i);
                    mapping.set(mesh.normals[i], 6 * i + 3);
                }
                vertexBuffer.unmap();
            }
            state.VBOs["stanford_dragon"] = vertexBuffer;


            /**
             *  IBOs
             * */
            const indexCount = mesh.triangles.length * 3;
            const indexBuffer = device.createBuffer({
                size: indexCount * Uint16Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.INDEX,
                mappedAtCreation: true,
            });
            {
                const mapping = new Uint16Array(indexBuffer.getMappedRange());
                for (let i = 0; i < mesh.triangles.length; ++i) {
                    mapping.set(mesh.triangles[i], 3 * i);
                }
                indexBuffer.unmap();
            }
            state.IBOs["stanford_dragon"] = indexBuffer;
            state.additional_info["indexCount"] = indexCount;

            /**
             *  UBOs
             * */
            const modelUniformBuffer = device.createBuffer({
                size: 4 * 16, // 4x4 matrix
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            state.UBOs["model"] = modelUniformBuffer;

            const sceneUniformBuffer = device.createBuffer({
                // Two 4x4 viewProj matrices,
                // one for the camera and one for the light.
                // Then a vec3 for the light position.
                // Rounded to the nearest multiple of 16.
                size: 2 * 4 * 16 + 4 * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            state.UBOs["scene"] = sceneUniformBuffer;


            /**
             *  Textures
             * */
            // Shadow Depth Map
            const shadowDepthTextureSize = 1024;
            state.additional_info["shadowDepthTextureSize"] = shadowDepthTextureSize;
            const shadowDepthTexture = device.createTexture({
                size: [shadowDepthTextureSize, shadowDepthTextureSize, 1],
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                format: 'depth32float',
            });
            state.Textures["shadow"] = shadowDepthTexture;
            const shadowDepthTextureView = shadowDepthTexture.createView();
            state.Texture_Views["shadow"] = shadowDepthTextureView;


            // Depth for Front and Back
            const depthTexture = device.createTexture({
                size: [canvas.width, canvas.height],
                format: 'depth24plus-stencil8',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            state.Textures["depth"] = depthTexture;
            // const depthTextureView = shadowDepthTexture.createView();
            // state.Texture_Views["depth"] = depthTextureView;


            /**
             *  VBO Layouts
             * */
            const vertexBuffers = {
                arrayStride: Float32Array.BYTES_PER_ELEMENT * 6,
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
                ],
            };
            state.VBO_Layouts["stanford_dragon"] = vertexBuffers;

            /**
             *  UBO Layouts
             * */
            const uniformBufferBindGroupLayout = device.createBindGroupLayout({
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
            // 这个布局是哪里的？？？多group复用
            state.UBO_Layouts["util"] = uniformBufferBindGroupLayout;


            // Create a bind group layout which holds the scene uniforms and
            // the texture+sampler for depth. We create it manually because the WebPU
            // implementation doesn't infer this from the shader (yet).
            const bglForRender = device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        buffer: {
                            type: 'uniform',
                        },
                    },
                    {
                        binding: 1,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        texture: {
                            sampleType: 'depth',
                        },
                    },
                    {
                        binding: 2,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        sampler: {
                            type: 'comparison',
                        },
                    },
                ],
            });
            state.UBO_Layouts["render_frag"] = bglForRender;

            /**
             *  Bind Group
             * */
            const sceneBindGroup = device.createBindGroup({
                layout: uniformBufferBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: sceneUniformBuffer,
                        },
                    },
                ],
            });
            state.BindGroups["shadow"] = sceneBindGroup;


            const modelBindGroup = device.createBindGroup({
                layout: uniformBufferBindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: modelUniformBuffer,
                        },
                    },
                ],
            });
            state.BindGroups["model"] = modelBindGroup;

            const bindGroupForRender = device.createBindGroup({
                layout: bglForRender,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: sceneUniformBuffer,
                        },
                    },
                    {
                        binding: 1,
                        resource: shadowDepthTextureView,
                    },
                    {
                        binding: 2,
                        resource: device.createSampler({
                            compare: 'less',
                        }),
                    },
                ],
            });
            state.BindGroups["render"] = bindGroupForRender;

        },

        manage_pipeline(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;

            /**
             *  Shadow Pass
             * */
            const shadowPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        state.UBO_Layouts["util"],
                        state.UBO_Layouts["util"],
                    ],
                }),
                vertex: {
                    module: device.createShaderModule({
                        code: shadow_vert,
                    }),
                    entryPoint: 'main',
                    buffers: [
                        state.VBO_Layouts["stanford_dragon"]
                    ],
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth32float',
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
            });
            state.Pipelines["shadow"] = shadowPipeline;

            // Render Pass
            const renderPipeline = device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [
                        state.UBO_Layouts["render_frag"],
                        state.UBO_Layouts["util"],
                    ],
                }),
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader,
                    }),
                    entryPoint: 'main',
                    buffers: [
                        state.VBO_Layouts["stanford_dragon"]
                    ],
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader,
                    }),
                    entryPoint: 'main',
                    targets: [
                        {
                            format: state.canvasFormat,
                        },
                    ],
                    constants: {
                        shadowDepthTextureSize: state.additional_info["shadowDepthTextureSize"]
                    },
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus-stencil8',
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
            });
            state.Pipelines["render"] = renderPipeline;


            /**
             *  Pass Descriptor
             * */
            // shadow

            const shadowPassDescriptor = {
                colorAttachments: [],
                depthStencilAttachment: {
                    view: state.Texture_Views["shadow"],
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };
            state.passDescriptors["shadow"] = shadowPassDescriptor;

            // render
            const renderPassDescriptor = {
                colorAttachments: [
                    {
                        // view is acquired and set in render loop.
                        view: undefined,
                        clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment: {
                    // view: state.Texture_Views["depth"],
                    // 注意，这里不能预先建立texture！具体为啥？？？
                    view: state.Textures["depth"].createView(),

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                    stencilClearValue: 0,
                    stencilLoadOp: 'clear',
                    stencilStoreOp: 'store',
                },
            };
            state.passDescriptors["render"] = renderPassDescriptor;

        },


        renderLoop(state, payload) {
            const device = payload.device;
            const canvas = payload.canvas;

            const aspect = canvas.width / canvas.height;


            const eyePosition = vec3.fromValues(0, 50, -100);
            const upVector = vec3.fromValues(0, 1, 0);
            const origin = vec3.fromValues(0, 0, 0);

            const projectionMatrix = mat4.perspective(
                (2 * Math.PI) / 5,
                aspect,
                1,
                2000.0
            );

            const viewMatrix = mat4.lookAt(eyePosition, origin, upVector);

            const lightPosition = vec3.fromValues(50, 100, -100);
            const lightViewMatrix = mat4.lookAt(lightPosition, origin, upVector);
            const lightProjectionMatrix = mat4.create();
            {
                const left = -80;
                const right = 80;
                const bottom = -80;
                const top = 80;
                const near = -200;
                const far = 300;
                mat4.ortho(left, right, bottom, top, near, far, lightProjectionMatrix);
            }

            const lightViewProjMatrix = mat4.multiply(
                lightProjectionMatrix,
                lightViewMatrix
            );

            const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);

            // Move the model so it's centered.
            const modelMatrix = mat4.translation([0, -45, 0]);



            // The camera/light aren't moving, so write them into buffers now.
            {
                const lightMatrixData = lightViewProjMatrix;
                device.queue.writeBuffer(
                    state.UBOs["scene"],
                    0,
                    lightMatrixData.buffer,
                    lightMatrixData.byteOffset,
                    lightMatrixData.byteLength
                );

                const cameraMatrixData = viewProjMatrix;
                device.queue.writeBuffer(
                    state.UBOs["scene"],
                    64,
                    cameraMatrixData.buffer,
                    cameraMatrixData.byteOffset,
                    cameraMatrixData.byteLength
                );

                const lightData = lightPosition;
                device.queue.writeBuffer(
                    state.UBOs["scene"],
                    128,
                    lightData.buffer,
                    lightData.byteOffset,
                    lightData.byteLength
                );

                const modelData = modelMatrix;
                device.queue.writeBuffer(
                    state.UBOs["model"],
                    0,
                    modelData.buffer,
                    modelData.byteOffset,
                    modelData.byteLength
                );
            }



            setTimeout(() => {
                const cameraViewProj = getCameraViewProjMatrix(state, viewProjMatrix);
                device.queue.writeBuffer(
                    state.UBOs["scene"],
                    64,
                    cameraViewProj.buffer,
                    cameraViewProj.byteOffset,
                    cameraViewProj.byteLength
                );

                const renderPassDescriptor = state.passDescriptors["render"];

                renderPassDescriptor.colorAttachments[0].view = state.GPU_context
                    .getCurrentTexture()
                    .createView();

                const commandEncoder = device.createCommandEncoder();
                {
                    const shadowPass = commandEncoder.beginRenderPass(state.passDescriptors["shadow"]);
                    shadowPass.setPipeline(state.Pipelines["shadow"]);
                    shadowPass.setBindGroup(0, state.BindGroups["shadow"]);
                    shadowPass.setBindGroup(1, state.BindGroups["model"]);
                    shadowPass.setVertexBuffer(0, state.VBOs["stanford_dragon"]);
                    shadowPass.setIndexBuffer(state.IBOs["stanford_dragon"], 'uint16');
                    shadowPass.drawIndexed(state.additional_info["indexCount"]);

                    shadowPass.end();
                }
                {
                    const renderPass = commandEncoder.beginRenderPass(state.passDescriptors["render"]);
                    renderPass.setPipeline(state.Pipelines["render"]);
                    renderPass.setBindGroup(0, state.BindGroups["render"]);
                    renderPass.setBindGroup(1, state.BindGroups["model"]);
                    renderPass.setVertexBuffer(0, state.VBOs["stanford_dragon"]);
                    renderPass.setIndexBuffer(state.IBOs["stanford_dragon"], 'uint16');
                    renderPass.drawIndexed(state.additional_info["indexCount"]);

                    renderPass.end();
                }
                device.queue.submit([commandEncoder.finish()]);

            }, 10);


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
