

import { mesh } from "../../assets/mesh/stanfordDragon.js"

import { compute_shader } from '../../assets/Shaders/Tuto15/light_refresh_comp';
import { geom_vert } from '../../assets/Shaders/Tuto15/geom_vert';
import { geom_frag } from '../../assets/Shaders/Tuto15/geom_frag';
import { quad_vert } from '../../assets/Shaders/Tuto15/quad_vert';
import { debug_frag } from '../../assets/Shaders/Tuto15/debug_frag';
import { render_frag } from '../../assets/Shaders/Tuto15/render_frag';

import { mat4, vec3, vec4 } from "wgpu-matrix"



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
        },
        init_data(context) {
            const device = context.rootState.device;
            // Create the model vertex buffer.
            
            const kVertexStride = 8; // 含义是什么
            const vertexBuffer = device.createBuffer({
                // position: vec3, normal: vec3, uv: vec2
                size: mesh.positions.length * kVertexStride * Float32Array.BYTES_PER_ELEMENT,
                usage: GPUBufferUsage.VERTEX,
                mappedAtCreation: true,
            });
            {
                const mapping = new Float32Array(vertexBuffer.getMappedRange());
                for (let i = 0; i < mesh.positions.length; ++i) {
                    mapping.set(mesh.positions[i], kVertexStride * i);
                    mapping.set(mesh.normals[i], kVertexStride * i + 3);
                    mapping.set(mesh.uvs[i], kVertexStride * i + 6);
                }
                vertexBuffer.unmap();
            }

            // Create the model index buffer.
            /**
            *  注意，这里开始使用 index buffer 了
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
