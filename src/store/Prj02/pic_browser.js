

/**
 *  Main-View Related
 * */
import { init_device_main } from "./main_view/00_init_device";
import { init_Camera } from "./main_view/xx_set_camera.js"
import { parse_dataset_info } from "./main_view/parse_dataset_info";
import {
    mipTexture_creation,
    fill_Mip_Texture,
    manage_Texture,
    manage_Mip_Texture
} from "./main_view/01_manage_Texture";
import {
    manage_VBO,
    VBO_creation,
    fill_Instance_Pos_VBO,
    fill_Atlas_Info_VBO,
    fill_Quad_VBO,
    manage_VBO_stage2,
    manage_VBO_Layout
} from "./main_view/02_manage_VBO"
import { UBO_creation, fill_MVP_UBO } from "./main_view/03_manage_UBO"
import { SBO_creation } from "./main_view/04_manage_SBO";
import { Layout_creation } from "./main_view/11_set_Layout";
import { BindGroup_creation } from "./main_view/12_set_BindGroup";
import { Pipeline_creation } from "./main_view/13_set_Pipeline";

import {
    compute_miplevel_pass,
    read_back_miplevel_pass,
} from "./main_view/21_GPU_Pass";

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

            console.log("bitmaps = ", context.state.main_canvas.mipBitMap);
            context.state.fence["BITMAP_READY"] = true;
        },

        /**
         *  从GPU获取返回结果
         * */
        async readBackMipLevel_and_FetchPicFromServer(context, device) {
            const state = context.state;
            /**
             *  Read Back MipLevel info from GPU
             * */
            await read_back_miplevel_pass(state, device);
            console.log("Mip data read back done");

            /**
             *  Fetch Instance Picture from Server
             * */
            const mip_info = state.main_canvas.mip_info;

            const cmd_json = {
                cmd: "fetch_mip_instance",
                mip_info: mip_info, // mip info 描述信息
            };

            console.log("cmd_json = ", cmd_json);
            state.ws.send(JSON.stringify(cmd_json));
        }

    },
    mutations: {

        /**
         *   Pre01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         * */
        init_device(state, { canvas, device }) {
            init_device_main(state, { canvas: canvas.main_canvas, device });
            init_device_sub(state, { canvas: canvas.sub_canvas, device });
            state.fence["DEVICE_READY"] = true;
        },

        /**
         *  Pre02：camera 相关初始化
         * */
        init_camera(state, device) {
            init_Camera(state, device);
            init_Camera_sub(state, device);
        },


        /**
         *  Stage01 向后台申请数据库（图片集）信息，接受到后台信息后，填充一些必要的全局变量
         * */
        main_canvas_initialize_stage1(state, ret_json_pack) {
            parse_dataset_info(state, ret_json_pack);
            state.fence["DATASET_INFO_READY"] = true;
            console.log("DATASET_INFO_READY");
        },

        /**
         *  Stage02：Device端的缓冲区开辟，仅创建/开辟内存，不进行填充 
         * */
        main_canvas_initialize_stage2(state, device) {
            /**
             *  Create Texture
             * */
            mipTexture_creation(state, device);

            /**
             *  Create VBO
             * */
            VBO_creation(state, device);

            /**
             *  Manage VBO Layout
             * */
            manage_VBO_Layout(state);

            /**
             *  Create UBO
             * */
            UBO_creation(state, device);

            /**
             *  Create SBO
             * */
            SBO_creation(state, device);

            // state.fence["VBO_STAGE1_READY"] = true;
            console.log("Buffer/Texture creation on Device Done~");
        },

        /**
         *  Stage03：Device端的布局、绑定组、管线创建
         * */
        main_canvas_initialize_stage3(state, device) {

            /**
             *  Create Layout
             * */
            Layout_creation(state, device);

            /**
             *  Create BindGroup
             * */
            BindGroup_creation(state, device);

            /**
             *  Create Pipeline
             * */
            Pipeline_creation(state, device);


            console.log("Layout/BindGroup/Pipeline creation Done~");
        },


        /**
         *  Stage04：GPU计算MipLevel
         * */
        main_canvas_initialize_stage4(state, device) {
            /**
             *  Fill MVP Related UBOs
             * */
            fill_MVP_UBO(state, device);

            // 以下读取计算返回结果错误，明天来了讨论进行修改（2024/01/04） 
            // 问题在于忘记了对部分的 VBO 进行填充！

            /**
             *  Fill instances pos Related VBOs/SBOs 
             * */
            fill_Instance_Pos_VBO(state, device);


            /**
             *  Compute MipLevel on GPU
             * */
            compute_miplevel_pass(state, device);

            state.fence["COMPUTE_MIP_SUBMIT"] = true;
            console.log("COMPUTE MIP SUBMIT DONE~");
        },
        
        /**
         *  Stage05：GPU计算MipLevel
         * */
        main_canvas_initialize_stage5(state, device) {

            /**
             *  Fill Texture Memory on GPU
             * */ 
            fill_Mip_Texture(state, device);


            /**
             *  Fill Atlas Info of VBO
             * */ 
            fill_Atlas_Info_VBO(state, device);

            /**
             *  Fill quad VBOs
             * */ 
            fill_Quad_VBO(state, device);

            state.fence["RENDER_READY"] = true;

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
             *  SBO
             * */
            manage_SBO(state, device);

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
                DATASET_INFO_READY: { val: false },
                DEVICE_READY: { val: false },
                COMPUTE_MIP_SUBMIT: { val: false }, // 已经向GPU提交计算MipLevel的申请，等待数据返回
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
                storage_arr: {}, // storage data in CPU for SBOs
                vertices_arr: {},
                indices_arr: {},  // 暂时不需要
                passDescriptors: {},
                simulationParams: {}, // 仿真运行参数

                instance_info: {}, // 描述instance数量等数据集信息，后端读取文件获得
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
                    size: [],       // 用于记录大纹理的长宽尺寸
                    uv_offset: [],  // 用于记录instance对应图片纹理在大纹理中的uv偏移
                    uv_size: [],    // 用于记录instance对应图片纹理在大纹理中的uv归一化宽高尺寸
                    tex_aspect: [], // 用于记录instance对应图片纹理的宽高比系数

                },
                mip_atlas_info: [],
                mip_info: {
                    total_length: 0,// 用于记录miplevel的最大深度（也就是应该创建多少个大纹理）
                    arr: []         // 用于记录当前视场中图片的MipLevel信息
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
