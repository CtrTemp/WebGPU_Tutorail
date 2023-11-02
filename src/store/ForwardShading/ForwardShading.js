import { vertex_shader, fragment_shader } from '../../assets/Shaders/ForwardShading/shader.js'

import { mesh } from "../../assets/mesh/stanfordDragon.js"

import { getCameraViewProjMatrix } from './utils.js';

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
            });
        },
        init_data(context) {
            const device = context.rootState.device;

            /*  Vertex Buffer Object  */
            // Vertex Buffer on Device
            const vertexBuffer = device.createBuffer({
                size: mesh.positions.length * 8 * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            {
                const mapping = new Float32Array(vertexBuffer.getMappedRange());
                for (let i = 0; i < mesh.positions.length; ++i) {
                    mapping.set(mesh.positions[i], 8 * i);
                    mapping.set(mesh.normals[i], 8 * i + 3);
                    mapping.set(mesh.uvs[i], 8 * i + 6);
                }
                vertexBuffer.unmap();
            }

            context.state.VBOs["stanford_dragon"] = vertexBuffer;

            // Vertex Buffer Layout
            const VBO_Layout = {
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
            context.state.VBO_Layouts["stanford_dragon"] = VBO_Layout;


            /*  Index Buffer Object  */
            // Index Buffer on Device
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
            context.state.IBOs["stanford_dragon"] = indexBuffer;

            /*  Uniform Buffer Object  */
            // Uniform Buffer on Device
            const uniformBufferSize = 4 * 16; // 4x4 matrix
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const UBO_Layout = device.createBindGroupLayout({
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

            const modelBindGroup = device.createBindGroup({
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

            // 此处仅仅进行创建，并不导入数据
            context.state.UBOs["stanford_dragon"] = uniformBuffer;
            context.state.UBO_Layouts["stanford_dragon"] = UBO_Layout;
            context.state.bindGroups["stanford_dragon"] = modelBindGroup;
        },
        manage_pipeline(context) {
            const device = context.rootState.device;



            const depthTexture = device.createTexture({
                size: [context.state.canvas.width, context.state.canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            context.state.Textures["depth"] = depthTexture;



            const renderPipelineLayout = device.createPipelineLayout({
                bindGroupLayouts: [context.state.UBO_Layouts["stanford_dragon"]],
            });

            // 创建渲染流水线
            const pipeline = device.createRenderPipeline({
                layout: renderPipelineLayout,
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader
                    }),
                    entryPoint: "main",   // 指定 vertex shader 入口函数
                    buffers: [
                        context.state.VBO_Layouts["stanford_dragon"]
                    ]
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader
                    }),
                    entryPoint: "main", // 指定 fragment shader 入口函数
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

            context.state.renderPipelines["stanford_dragon"] = pipeline;



            const renderPassDescriptor = {
                colorAttachments: [{
                    view: context.state.GPU_context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: [0, 0.5, 0.7, 1],
                    storeOp: "store",
                }],
                depthStencilAttachment: {
                    view: depthTexture.createView(),

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            };

            context.state.passDescriptors["stanford_dragon"] = renderPassDescriptor;
        },
        renderLoop(context) {
            const device = context.rootState.device;

            setInterval(() => {

            // 这里要开始生成并更新 MVP 矩阵
            const cameraViewProj = getCameraViewProjMatrix(context);

            // console.log("camera Matrix = ", cameraViewProj);

            device.queue.writeBuffer(
                context.state.UBOs["stanford_dragon"],
                0,
                cameraViewProj.buffer,
                cameraViewProj.byteOffset,
                cameraViewProj.byteLength
            );



            const renderPassDescriptor = context.state.passDescriptors["stanford_dragon"];


            renderPassDescriptor.colorAttachments[0].view = context.state.GPU_context
                .getCurrentTexture()
                .createView();

            const encoder = device.createCommandEncoder();

            const pass = encoder.beginRenderPass(
                renderPassDescriptor
            );

            pass.setPipeline(context.state.renderPipelines["stanford_dragon"]);

            pass.setBindGroup(0, context.state.bindGroups["stanford_dragon"]);
            pass.setVertexBuffer(0, context.state.VBOs["stanford_dragon"]);


            pass.setIndexBuffer(context.state.IBOs["stanford_dragon"], 'uint16');

            pass.drawIndexed(mesh.triangles.length * 3);


            pass.end();

            device.queue.submit([encoder.finish()]);
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
            // VBO、UBO這些都可能有多個，所以同樣使用對象來定義
            VBOs: {},
            VBO_Layouts: {},
            IBOs: {},
            UBOs: {},
            UBO_Layouts: {},
            bindGroups: {},
            vertices_arr: {},
            indices_arr: {},  // 暂时不需要
            Textures: {},
            passDescriptors: {}
        }
    },
    getters: {}
}
