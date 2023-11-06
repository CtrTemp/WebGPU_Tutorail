import { vertex_shader, fragment_shader } from '../../assets/Shaders/ForwardShading/shader.js'

import { mesh } from "../../assets/mesh/stanfordDragon.js"

import { getCameraViewProjMatrix, updateCanvas } from './utils.js';

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

            /* *************************  Vertex Buffer Object ************************* */
            // Vertex Buffer on Device
            const vertexBuffer = device.createBuffer({
                size: mesh.positions.length * 8 * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            // 数据导入，将模型顶点数据从 CPU 导入 GPU
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
            /**
             *  VBO_Layout 可以理解为 vertex buffer 读取方式的解析器。告诉shader在GPU端应该如何
             * 解析顶点缓冲区的数据。
             * */
            const VBO_Layout = {
                // 单个顶点数据包的大小（字节长度），即如何划分整个buffer数组
                arrayStride: Float32Array.BYTES_PER_ELEMENT * 8,
                // 单个顶点数据包内，应该如何划分数据段
                attributes: [
                    {
                        // position 数据段，编号为0，大小为三个float
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x3',
                    },
                    {
                        // normal 数据段，编号为1，大小为三个float
                        shaderLocation: 1,
                        offset: Float32Array.BYTES_PER_ELEMENT * 3,
                        format: 'float32x3',
                    },
                    {
                        // uv 数据段，编号为2，大小为两个float
                        shaderLocation: 2,
                        offset: Float32Array.BYTES_PER_ELEMENT * 6,
                        format: 'float32x2',
                    },
                ],
            };
            context.state.VBO_Layouts["stanford_dragon"] = VBO_Layout;


            /* ************************* Index Buffer Object ************************* */
            /**
             *  IBO 可以理解为三角形面元顶点的序列号数组。每个index指向的是VBO中的一个顶点，每三个index为
             * 一组，表示一个三角形面元。
             * */
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

            /* ************************* Uniform Buffer Object ************************* */
            /**
             *  UBO 可以理解为 CPU 向 GPU 传递的全局变量。可以选择性的暴露给渲染管线中的任意阶段（不同shader）
             * */
            // Uniform Buffer on Device
            const uniformBufferSize = 4 * 16; // 4x4 matrix
            const uniformBuffer = device.createBuffer({
                size: uniformBufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });
            /**
             *  UBO_Layout 指明在某个 shader 阶段，GPU应该如何解析 UBO 数据包
             * */
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

            /**
             *  注意 UBO_bindGroup 和 UBO_Layout 的区别：
             *  以上提到的 UBO_Layout 仅仅指明了某个shader阶段可能用到了几个 UBO，并指明其编号，但
             * 并没有给出这些 UBO 对应的数据源。
             *  而 UBO_bindGroup 就是用来将编号和数据源联系起来的桥梁。
             */
            const modelBindGroup = device.createBindGroup({
                // 指明我们使用哪一个 layout
                layout: UBO_Layout,
                // 指明以上 layout 中 UBO 编号对应的数据源
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer,
                        },
                    },
                ],
            });

            // 此处仅仅进行创建，并不导入数据，UBO对应的MVP矩阵数据将在渲染过程中实时更新
            context.state.UBOs["stanford_dragon"] = uniformBuffer;
            context.state.UBO_Layouts["stanford_dragon"] = UBO_Layout;
            context.state.UBO_bindGroups["stanford_dragon"] = modelBindGroup;
        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(context) {
            const device = context.rootState.device;

            /**
             *  如果我们使能深度测试，需要一个确定的遮挡关系，就必须要创建一张深度图纹理
             * */
            const depthTexture = device.createTexture({
                size: [context.state.canvas.width, context.state.canvas.height],
                format: 'depth24plus', // 一般深度纹理和模板纹理是一张 16位被分配给了深度纹理 8位分配给模板纹理
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            context.state.Textures["depth"] = depthTexture;


            /**
             *  渲染管线布局，从 UBO_Layout 创建得来
             *  （没有遇到多layout案例时，这里先不需要理解）
             * */
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
                primitive: { // 指定面元类型（这里默认是三角形，所以不加也可）并指明剔除模式
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
                depthStencil: { // 使能深度测试，小于深度纹理的fragment将会被保留
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            });
            context.state.renderPipelines["stanford_dragon"] = pipeline;

            /**
             *  渲染流程描述符，用于描述各个附件的数据更新前后的动作，以及描述数据更新的目标位置
             */
            const renderPassDescriptor = {
                colorAttachments: [{
                    // 这个view是默认的，将默认渲染到屏幕（我们没有显式的创建这个纹理，GPU会默认创建）
                    view: context.state.GPU_context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    // clearValue: [0, 0.5, 0.7, 1],
                    clearValue: [0, 0.0, 0.0, 1],
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
                /**
                 *  更新 canvas 大小。附带要更新对应的texture大小。
                 *  函数中将使用新的 canvas 大小分别更新 renderPassDescriptor 中的 colorAttachment 和 depthAttachment
                 * */
                updateCanvas(context);

                // 更新 MVP 矩阵，并以 UBO 的形式传入到 GPU
                const cameraViewProj = getCameraViewProjMatrix(context);

                device.queue.writeBuffer(
                    context.state.UBOs["stanford_dragon"],
                    0,
                    cameraViewProj.buffer,
                    cameraViewProj.byteOffset,
                    cameraViewProj.byteLength
                );

                // 创建渲染命令队列编码器
                const encoder = device.createCommandEncoder();

                // 开启流程，并将其填充到编码器
                const pass = encoder.beginRenderPass(
                    context.state.passDescriptors["stanford_dragon"]
                );

                // 对流程中间过程的填充（实际对应一些GPU指令）
                pass.setPipeline(context.state.renderPipelines["stanford_dragon"]);
                pass.setBindGroup(0, context.state.UBO_bindGroups["stanford_dragon"]);
                pass.setVertexBuffer(0, context.state.VBOs["stanford_dragon"]);
                pass.setIndexBuffer(context.state.IBOs["stanford_dragon"], 'uint16');
                pass.drawIndexed(mesh.triangles.length * 3);
                pass.end();

                // 将指令集合提交到指令队列，发送给GPU运行
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
            passDescriptors: {}
        }
    },
    getters: {}
}
