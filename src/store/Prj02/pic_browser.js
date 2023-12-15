
// GUI
import * as dat from "dat.gui"


import {
    init_device_main,
    manage_data_main,
    manage_pipeline_main,
    renderLoop_main
} from "./instanceFlow";

import { read_files_from_dir, dataURL2Blob } from "./main_view/util";

import {
    init_device_sub,
    manage_data_sub,
    manage_pipeline_sub,
    renderLoop_sub
} from "./sub_canvas";


export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {

        // 整体框架，内为异步函数，用于简单操控数据异步读取，阻塞式等待。
        async init_and_render(context, canvas) {
            console.log(context);

            const device = context.rootState.device;

            // 创建 GUI
            const gui = new dat.GUI();

            const payload = {
                canvas: canvas,
                device: device,
                flow_info: undefined,
                gui: gui
            }

            context.commit("init_device", payload);

            context.commit("manage_data", payload);

            context.commit("manage_pipeline", device);

            context.commit("renderLoop", payload);
        },

        async construct_imgBitMap(context, ret_json_pack) {
            // console.log("json pack received = ", ret_json_pack);

            // 开始创建 img bit map
            for (let i = 0; i < ret_json_pack.arr.length; i++) {

                let file = ret_json_pack.arr[i];
                let url = "data:image/png;base64," + file;

                const blob = dataURL2Blob(url);

                // console.log("blob = ", blob);

                const img_bitMap = await createImageBitmap(blob);

                context.state.main_canvas.instancedBitMap.push(img_bitMap);
            }

            // console.log("bitmaps = ", context.state.main_canvas.instancedBitMap);
        }
    },
    mutations: {

        /**
         *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         */
        init_device(state, { canvas, device }) {
            init_device_main(state, { canvas: canvas.main_canvas, device });
            init_device_sub(state, { canvas: canvas.sub_canvas, device });
        },


        /**
         *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
         * 并借助API将CPU读入的数据导入device 
         */
        manage_data(state, payload) {
            manage_data_main(state, payload);
            manage_data_sub(state, payload);
        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(state, device) {
            manage_pipeline_main(state, device);
            manage_pipeline_sub(state, device);
        },

        /**  
         *  Stage04：启动渲染循环
         * */
        renderLoop(state, payload) {
            renderLoop_main(state, payload);
            renderLoop_sub(state, payload);
        }
    },
    state() {
        return {
            main_canvas: {

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
                vertices_arr: {},
                indices_arr: {},  // 暂时不需要
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
            },
            sub_canvas: {
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
                additional_info: {},
                prim_camera: {},
                mouse_info: {},
                keyboard_info: {},
            }
        }
    },
    getters: {}
}
