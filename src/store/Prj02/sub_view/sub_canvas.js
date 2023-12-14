
// GUI
import * as dat from "dat.gui"

import { manage_Texture } from "./01_manage_Texture";
import { manage_VBO, manage_VBO_Layout, manage_IBO } from "./02_manage_VBO"
import { manage_UBO } from "./03_manage_UBO"
import { set_Layout } from "./11_set_Layout";
import { set_BindGroup } from "./12_set_BindGroup";
import { set_Pipeline } from "./13_set_Pipeline";
import {
    init_Camera,
    // moveCamera,
    // defocusCamera,
    // focusCamera,
    // focusOnRandomPic
} from "./xx_set_camera.js"


export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {

        // 整体框架，内为异步函数，用于简单操控数据异步读取，阻塞式等待。
        async init_and_render(context, canvas) {
            const device = context.rootState.device;

            // 创建 GUI
            const gui = new dat.GUI();
            const payload = {
                canvas: canvas,
                device: device,
                gui: gui
            }

            context.commit("init_device", payload);

            context.commit("manage_data", payload);

            context.commit("manage_pipeline", device);

            context.commit("renderLoop", payload);
        },

    },
    mutations: {

        /**
         *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         */
        init_device(state, { canvas, device }) {
            state.canvas = canvas;
            state.GPU_context = canvas.getContext("webgpu");
            state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            state.GPU_context.configure({
                device: device,
                format: state.canvasFormat,
            });
        },


        /**
         *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
         * 并借助API将CPU读入的数据导入device 
         */
        manage_data(state, payload) {

            /**
             *  Depth Texture
             * */
            manage_Texture(state, payload);

            /**
             *  VBO
             * */ 
            manage_VBO(state, payload);

            /**
             *  VBO Layout
             * */ 
            manage_VBO_Layout(state, payload);

            /**
             *  IBO
             * */
            manage_IBO(state, payload);

            /**
             *  UBO
             * */ 
            manage_UBO(state, payload);

        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(state, device) {

            /**
             *  UBO Layout
             * */
            set_Layout(state, device);

            /**
             *  BindGroups
             * */
            set_BindGroup(state, device);

            /**
             *  Pipelines
             * */
            set_Pipeline(state, device);
        },

        /**  
         *  Stage04：启动渲染循环
         * */
        renderLoop(state, payload) {

            const device = payload.device;

            const encoder = device.createCommandEncoder();

            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: state.GPU_context.getCurrentTexture().createView(),
                    loadOp: "clear",
                    clearValue: [0.0, 0.0, 0.0, 1.0],
                    storeOp: "store",
                }],
                depthStencilAttachment: {
                    view: state.Textures["depth"].createView(),

                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                },
            });


            /**
             *  Update MVP Matrix
             * */ 
            const gui = payload.gui;
            init_Camera(state, device, gui);

            console.log("prim camera = ", state.prim_camera);

            const view = state.prim_camera["view"];
            const projection = state.prim_camera["projection"];
            const viewProjectionMatrix = state.prim_camera["matrix"];
            // GPU 端更新相机参数
            device.queue.writeBuffer(
                state.UBOs["mvp"],
                0,
                viewProjectionMatrix.buffer,
                viewProjectionMatrix.byteOffset,
                viewProjectionMatrix.byteLength
            );

            pass.setPipeline(state.Pipelines["rect"]);
            pass.setBindGroup(0, state.BindGroups["mvp"]);
            pass.setVertexBuffer(0, state.VBOs["rect"]);
            pass.setIndexBuffer(state.IBOs["rect"], 'uint16');
            pass.drawIndexed(state.indices_arr["rect"].length); // rect

            pass.end();

            device.queue.submit([encoder.finish()]);
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
            Textures: {
                instance: []
            },
            // VBO、UBO這些都可能有多個，所以同樣使用對象來定義
            VBOs: {},
            VBO_Layouts: {},
            IBOs: {},
            UBOs: {},
            Layouts: {},
            BindGroups: {},
            SBOs: {}, // Storage Buffer Object
            vertices_arr: {}, // Float32Array
            indices_arr: {},  // Int16Array
            passDescriptors: {},
            simulationParams: {}, // 仿真运行参数

            particle_info: {},
            additional_info: {},
            prim_camera: {},
            mouse_info: {},
            keyboard_info: {},
            instancedBitMap: [],
            simu_info: {
                simu_pause: 0.0,
                simu_time: 0.0,
                simu_speed: 0.0,
            },
            // simu_pause: 0.0,
            // simu_time: 0.0,
            // simu_speed: 0.0,
            atlas_info: {
                size: [],
                uv_offset: [],  // 用于记录instance对应图片纹理在大纹理中的uv偏移
                uv_size: [],    // 用于记录instance对应图片纹理在大纹理中的uv归一化宽高尺寸
                tex_aspect: [], // 用于记录instance对应图片纹理的宽高比系数
            },
        }
    },
    getters: {}
}
