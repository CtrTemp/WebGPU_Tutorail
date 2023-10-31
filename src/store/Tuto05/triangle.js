import { vertex_shader, fragment_shader, global_shader } from '../../assets/Shaders/Tuto05/shader.js'

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
            // CPU 端数据
            const vertices = new Float32Array([
                0.0, 0.8,
                -0.8, -0.8,
                0.8, -0.8,
            ]);

            context.state.vertices_arr.push(vertices);

            // 顶点缓冲区创建
            const vertexBuffer = device.createBuffer({
                label: "Cell vertices",
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });

            context.state.VBOs.push(vertexBuffer);

            device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);
        },
        manage_pipeline(context) {
            const device = context.rootState.device;

            const vertexBufferLayout = {
                arrayStride: 8, // 一个float类型是4个字节，这表示每一个单一数据寻址需要跨越的字节段（一个二维坐标是两个float组成）
                attributes: [{
                    format: "float32x2", // GPU可以理解的顶点数据类型格式，这里类似于指定其类型为 vec2 
                    offset: 0,  // 指定顶点数据与整体数据开始位置的偏移
                    shaderLocation: 0, // 等到 vertex shader 章节进行介绍
                }],
            };

            // 创建渲染流水线
            const cellPipeline = device.createRenderPipeline({
                label: "Cell pipeline",
                layout: "auto",
                vertex: {
                    module: device.createShaderModule({
                        code: vertex_shader
                    }),
                    entryPoint: "vertexMain",   // 指定 vertex shader 入口函数
                    buffers: [vertexBufferLayout]
                },
                fragment: {
                    module: device.createShaderModule({
                        code: fragment_shader
                    }),
                    entryPoint: "fragmentMain", // 指定 fragment shader 入口函数
                    targets: [{
                        format: context.state.canvasFormat
                    }]
                }
            });

            context.state.renderPipelines.push(cellPipeline);
        },
        renderLoop(context) {
            const device = context.rootState.device;

            const encoder = device.createCommandEncoder();

            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: context.state.GPU_context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: [0, 0.5, 0.7, 1],
                    storeOp: "store",
                }]
            });

            pass.setPipeline(context.state.renderPipelines[0]);
            pass.setVertexBuffer(0, context.state.VBOs[0]);
            pass.draw(context.state.vertices_arr[0].length / 2); // 6 vertices

            pass.end();

            device.queue.submit([encoder.finish()]);
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
            UBOS: [],
            vertices_arr: []
        }
    },
    getters: {}
}
