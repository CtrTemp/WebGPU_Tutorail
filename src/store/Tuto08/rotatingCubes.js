
import { vertex_shader, fragment_shader } from '../../assets/Shaders/Tuto08/shader.js'
import { getTransformationMatrix } from './utils.js'
import {
    cubeVertexSize,
    cubePositionOffset,
    cubeColorOffset,
    cubeUVOffset,
    cubeVertexCount,
    cubeVertexArray
} from "../../assets/Shaders/Tuto08/cube_info.js"

import { mat4, vec3 } from "wgpu-matrix"

export default {
    namespaced: true,
    actions: {
        init_device(context, canvas) {
            const device = context.rootState.device;
            context.state.canvas = canvas;
            context.state.GPU_context = canvas.getContext("webgpu");
            context.state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            context.state.GPU_context.configure({
                device: device,
                format: context.state.canvasFormat,
                alphaMode: 'premultiplied',
            });


            const devicePixelRatio = window.devicePixelRatio || 1;
            canvas.width = canvas.clientWidth * devicePixelRatio;
            canvas.height = canvas.clientHeight * devicePixelRatio;
        },
        init_data(context) {
            const device = context.rootState.device;

            // VBOs
            // Create a vertex buffer from the cube data.
            const verticesBuffer = device.createBuffer({
                size: cubeVertexArray.byteLength,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
            verticesBuffer.unmap();

            context.state.VBOs.push(verticesBuffer);


            // UBOs
            const uniformBufferSize = 4 * 16; // 4x4 matrix
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            context.state.UBOs.push(uniformBuffer);

        },

        manage_pipeline(context) {
            const device = context.rootState.device;

            const depthTexture = device.createTexture({
                size: [context.state.canvas.width, context.state.canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            // Create the bind group layout and pipeline layout.
            const bindGroupLayout = device.createBindGroupLayout({
                label: "Cell Bind Group Layout",
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {} // 不填写 type 字段则默认为 uniform buffer
                }]
            });

            context.state.pipelineBindGroup.push(
                device.createBindGroup({
                    layout: bindGroupLayout, // Updated Line 之前我们使用的是auto但现在不行了
                    entries: [{
                        binding: 0,
                        resource: { buffer: context.state.UBOs[0] }
                    }],
                })
            );

            const pipelineLayout = device.createPipelineLayout({
                label: "Cell Pipeline Layout",
                bindGroupLayouts: [bindGroupLayout],
            });

            // 创建渲染流水线
            const cellPipeline = device.createRenderPipeline({
                layout: pipelineLayout,
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader
                    }),
                    entryPoint: "main",
                    buffers: [
                        {
                            arrayStride: cubeVertexSize,
                            attributes: [
                                {
                                    // position
                                    shaderLocation: 0,
                                    offset: cubePositionOffset,
                                    format: 'float32x4',
                                },
                                {
                                    // uv
                                    shaderLocation: 1,
                                    offset: cubeUVOffset,
                                    format: 'float32x2',
                                },
                            ],
                        }
                    ]
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader
                    }),
                    entryPoint: "main",
                    targets: [{
                        format: context.state.canvasFormat
                    }]
                },
                primitive: { // 指定面元类型，这里默认是三角形，所以不加也可
                    topology: 'triangle-list',
                    // Backface culling since the cube is solid piece of geometry.
                    // Faces pointing away from the camera will be occluded by faces
                    // pointing toward the camera.
                    cullMode: 'back',
                },
                // Enable depth testing so that the fragment closest to the camera
                // is rendered in front.
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            });

            context.state.renderPipelines.push(cellPipeline);

            const renderPassDescriptor = {
                colorAttachments: [
                    {
                        view: undefined, // Assigned later

                        clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
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

            context.state.renderPassDescriptor.push(renderPassDescriptor);


            // 模型矩阵M，在这里并不进行修改

        },

        renderLoop(context) {
            const device = context.rootState.device;

            setInterval(() => {
                const transformationMatrix = getTransformationMatrix(context);
                device.queue.writeBuffer(
                    context.state.UBOs[0],
                    0,
                    transformationMatrix.buffer,
                    transformationMatrix.byteOffset,
                    transformationMatrix.byteLength
                );

                const renderPassDescriptor = context.state.renderPassDescriptor[0];

                renderPassDescriptor.colorAttachments[0].view = context.state.GPU_context
                    .getCurrentTexture()
                    .createView();


                const encoder = device.createCommandEncoder();
                const pass = encoder.beginRenderPass(renderPassDescriptor);

                pass.setPipeline(context.state.renderPipelines[0]);

                pass.setBindGroup(0, context.state.pipelineBindGroup[0]);
                pass.setVertexBuffer(0, context.state.VBOs[0]);
                pass.draw(cubeVertexCount);

                pass.end();

                device.queue.submit([encoder.finish()]);
            }, 25);
        }
    },
    mutations: {

    },
    state() {
        return {
            void_info: "info: deferred shading",
            canvas: null,
            canvasFormat: null,
            GPU_context: null,
            renderPipelines: [],
            VBOs: [],
            UBOs: [],
            vertices_arr: [],
            renderPassDescriptor: [],
            pipelineBindGroup: []
        }
    },
    getters: {}
}
