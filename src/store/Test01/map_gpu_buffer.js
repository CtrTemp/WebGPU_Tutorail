
import { init_device_main } from './00_init_device.js';
import { manage_VBO, manage_VBO_Layout } from './02_manage_VBO.js';
import { set_Layout } from './11_set_Layout.js';
import { set_BindGroup } from './12_set_BindGroup.js';
import { set_Render_Pipeline, set_Compute_Pipeline } from './13_set_Pipeline.js';

export default {
    namespaced: true,
    actions: {

    },
    mutations: {

        init_device(state, { canvas, device }) {
            init_device_main(state, { canvas, device });
        },
        init_data(state, device) {
            manage_VBO(state, device);
            manage_VBO_Layout(state);
        },
        manage_pipeline(state, device) {
            set_Layout(state, device);
            set_BindGroup(state, device);
            set_Render_Pipeline(state, device);
            set_Compute_Pipeline(state, device);
        },
        renderLoop(state, device) {

            const encoder = device.createCommandEncoder();


            /**
             *  compute pass
             * */
            {
                const pass = encoder.beginComputePass();
                pass.setPipeline(state.Pipelines["move_vertex"]);
                pass.setBindGroup(0, state.BindGroups["move_vertex"]);
                pass.dispatchWorkgroups(1);
                pass.end();
            }
            /**
             *  render pass
             * */
            {
                const pass = encoder.beginRenderPass({
                    colorAttachments: [{
                        view: state.GPU_context.getCurrentTexture().createView(),
                        loadOp: "clear",
                        clearValue: [0, 0.5, 0.7, 1],
                        storeOp: "store",
                    }]
                });

                pass.setPipeline(state.Pipelines["render_triangle"]);
                pass.setBindGroup(0, state.BindGroups["void"]);
                pass.setVertexBuffer(0, state.VBOs["triangle"]);
                pass.draw(state.vertices_arr["triangle"].length / 2); // 6 vertices
                pass.end();
            }


            // setTimeout(async () => {

            //     await readBuffer.mapAsync(GPUMapMode.READ, 0, 4);
            //     console.log("read Buffer = ");
            // }, 1000);



            device.queue.submit([encoder.finish()]);


            /**
             *  read something back from current vertex buffer
             * */


            const readBack_encoder = device.createCommandEncoder();

            /**
             *  读取的信息将被存储到以下这个 buffer
             * */
            const readBuffer = device.createBuffer({
                size: state.vertices_arr["triangle"].byteLength,
                usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
                // mappedAtCreation: true,
            });

            readBack_encoder.copyBufferToBuffer(
                state.VBOs["triangle"],
                0,
                readBuffer,
                0,
                state.vertices_arr["triangle"].byteLength,
            );

            device.queue.submit([readBack_encoder.finish()]);


            setTimeout(async () => {
                await readBuffer.mapAsync(GPUMapMode.READ);
                const arrBuffer = new Float32Array(readBuffer.getMappedRange());
                console.log("hello~ readBuffer = ", arrBuffer);
            }, 1000);
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
            // VBO、UBO這些都可能有多個，所以同樣使用對象來定義
            VBOs: {},
            VBO_Layouts: {},
            IBOs: {},
            UBOs: {},
            Layouts: {},
            BindGroups: {},
            SBOs: {}, // Storage Buffer Object
            vertices_arr: {},
            indices_arr: {},  // 暂时不需要
            passDescriptors: {},
        }
    },
    getters: {}
}
