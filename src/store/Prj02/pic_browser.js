

/**
 *  Main-View Related
 * */
import { init_device_main } from "./main_view/00_init_device";
import { init_Camera } from "./main_view/xx_set_camera.js"
import { manage_Texture, manage_Mip_Texture } from "./main_view/01_manage_Texture";
import {
    manage_VBO,
    manage_VBO_stage1,
    manage_VBO_stage2,
    manage_VBO_Layout
} from "./main_view/02_manage_VBO"
import { manage_UBO } from "./main_view/03_manage_UBO"
import { set_Layout } from "./main_view/11_set_Layout";
import { set_BindGroup } from "./main_view/12_set_BindGroup";
import { set_Pipeline } from "./main_view/13_set_Pipeline";

import {
    canvasMouseInteraction,
    canvasKeyboardInteraction
} from "./main_view/xx_interaction";

import {
    renderLoop_main
} from "./renderLoop_main_view";

/**
 *  Sub-View Related
 * */
import { init_device_sub } from "./sub_view/00_init_device";
import { manage_Texture_sub } from "./sub_view/01_manage_Texture";
import {
    manage_VBO_sub,
    manage_VBO_Layout_sub,
    manage_IBO_sub
} from "./sub_view/02_manage_VBO"
import { manage_UBO_sub } from "./sub_view/03_manage_UBO"
import { set_Layout_sub } from "./sub_view/11_set_Layout";
import { set_BindGroup_sub } from "./sub_view/12_set_BindGroup";
import { set_Pipeline_sub } from "./sub_view/13_set_Pipeline";
import {
    init_Camera_sub,
} from "./sub_view/xx_set_camera.js"


import {
    renderLoop_sub
} from "./renderLoop_sub_view";


import { read_files_from_dir, dataURL2Blob } from "./main_view/util";



export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {

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

            context.state.fence["BITMAP_READY"] = true;
            // console.log("bitmaps = ", context.state.main_canvas.instancedBitMap);
        },

        async construct_mip_imgBitMap(context, ret_json_pack) {
            console.log("json pack received = ", ret_json_pack);

            let flag = false;
            if (context.state.main_canvas.mipBitMap.length == 13) {
                flag = true;
            }

            const bitMapArr = ret_json_pack["mipBitMaps"];

            // 开始创建 img bit map
            for (let i = 0; i < bitMapArr.length; i++) {

                let current_level_mapArr = [];

                for (let j = 0; j < bitMapArr[i].length; j++) {

                    let file = bitMapArr[i][j];
                    let url = "data:image/png;base64," + file;

                    const blob = dataURL2Blob(url);

                    const img_bitMap = await createImageBitmap(blob);

                    current_level_mapArr.push(img_bitMap);

                }
                if (flag) {
                    context.state.main_canvas.mipBitMap[i] = current_level_mapArr;
                }
                else {
                    context.state.main_canvas.mipBitMap.push(current_level_mapArr);
                }
            }

            // console.log("bitmaps = ", context.state.main_canvas.mipBitMap);
            context.state.fence["BITMAP_READY"] = true;
        },

    },
    mutations: {

        /**
         *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         */
        init_device(state, { canvas, device }) {
            init_device_main(state, { canvas: canvas.main_canvas, device });
            init_device_sub(state, { canvas: canvas.sub_canvas, device });
            state.fence["DEVICE_READY"] = true;
        },


        /**
         *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
         * 并借助API将CPU读入的数据导入device 
         */

        main_canvas_VBO_stage1(state, device) {
            // console.log("MANAGE_VBO_STAGE_01");
            init_Camera(state, device);
            manage_VBO_stage1(state, device);
            state.fence["VBO_STAGE1_READY"] = true;
        },


        main_canvas_VBO_stage2(state, device) {
            // console.log("MANAGE_VBO_STAGE_02");

            // manage_Texture(state, device);
            manage_Mip_Texture(state, device);

            manage_VBO_stage2(state, device);

            state.fence["VBO_STAGE2_READY"] = true;
            console.log("VBO_STAGE2_READY");
        },

        // main_canvas_UBOs_Layouts_Pipelines_and_Interaction(state, device) {
        main_canvas_manage_rest_of_all(state, device) {
            // console.log("UBOs_LAYOUTs_PIPELINEs_STAGE");
            /**
             *  VBO Layout
             * */
            manage_VBO_Layout(state);
            /**
             *  UBO
             * */
            manage_UBO(state, device);
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

            /**
             *  Interactions
             * */
            // Keyboard
            canvasKeyboardInteraction(state, device);
            // Mouse
            canvasMouseInteraction(state, device);

            state.fence["RENDER_READY"] = true;
        },

        main_canvas_renderLoop(state, device) {
            renderLoop_main(state, device);
        },


        /**
         *  sub canvas 相关渲染配置
         *  由于 sub canvas 辅助视图中的所有需要延迟加载的资源都在主视图中加载完毕
         * 故，当主视图渲染flag被置位后，即可提交 sub canvas 的所有配置并渲染
         * */

        sub_canvas_management(state, device) {

            /**
             *  Sub Camera
             * */
            init_Camera_sub(state, device);

            /**
             *  Depth Texture
             * */
            manage_Texture_sub(state, device);
            /**
             *  VBO
             * */
            manage_VBO_sub(state, device);

            /**
             *  VBO Layout
             * */
            manage_VBO_Layout_sub(state);

            /**
             *  IBO
             * */
            manage_IBO_sub(state, device);

            /**
             *  UBO
             * */
            manage_UBO_sub(state, device);

            /**
             *  UBO Layout
             * */
            set_Layout_sub(state, device);

            /**
             *  BindGroups
             * */
            set_BindGroup_sub(state, device);

            /**
             *  Pipelines
             * */
            set_Pipeline_sub(state, device);

            state.fence["RENDER_READY_SUB"] = true;
        },



        sub_canvas_renderLoop(state, device) {
            renderLoop_sub(state, device);
        },


    },
    state() {
        return {
            ws: undefined,
            GUI: {},
            /**
             *  全局时序控制器，设置一些flag，并通过监控它们来获取正确的程序执行
             * */
            fence: {
                DEVICE_READY: { val: false },
                BITMAP_READY: { val: false },
                // VBO_READY: { val: false },
                VBO_STAGE1_READY: { val: false },
                VBO_STAGE2_READY: { val: false },
                RENDER_READY: { val: false },
            },
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
                    instance: [],
                    mip_instance: [],
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
                mipBitMap: [],
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
                mip_atlas_info: [],
                mip_info: {
                    arr: []          // 用于记录当前视场中图片的MipLevel信息
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
