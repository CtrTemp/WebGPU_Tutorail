
/**
 *  Utils
 * */

import { dataURL2Blob } from "./utils/bitMap";
import {
    init_device_main,
    init_device_sub
} from "./utils/00_init_device";
import { parse_dataset_info } from "./utils/parse_dataset_info";

import {
    init_prim_Camera,
    init_sub_Camera,
} from "./utils/set_camera";


import { free_storage } from "./utils/storage_free";

import { parse_mipLevelArr } from "./utils/mipLevel";

/**
 *  Main View Quad Related
 * */
import {
    quadTexture_creation,
    fill_Quad_Texture,
    fill_Large_Quad_Texture,
    dynamic_fetch_update_Texture,
} from "./quad_pack_view/01_manage_Texture";

import {
    VBO_creation,
    fill_quad_Instance_Pos_VBO,
    fill_quad_Atlas_Info_VBO,
    fill_Quad_VBO,
    manage_VBO_Layout,
} from "./quad_pack_view/02_manage_VBO";
import { Layout_creation_quad } from "./quad_pack_view/11_set_Layout";
import { BindGroup_creation_quad } from "./quad_pack_view/12_set_BindGroup";
import { Pipeline_creation_quad } from "./quad_pack_view/13_set_Pipeline";

import {
    UBO_creation,
    fill_MVP_UBO_quad,
    fill_Interaction_UBO,
} from "./quad_pack_view/03_manage_UBO";

import { SBO_creation } from "./quad_pack_view/04_manage_SBO";

import {
    compute_miplevel_pass_quad,
    read_back_miplevel_pass_quad,
    read_back_hitIndex_pass,
} from "./quad_pack_view/21_GPU_Pass";

import { renderLoop_quad } from "./renderLoop_quad_view";


import {
    canvasKeyboardInteraction_quad,
    canvasMouseInteraction_quad
} from "./quad_pack_view/xx_interaction";


/**
 *  Sub-View Related
 * */
import { subViewTexture_creation } from "./sub_view/01_manage_Texture";
import {
    VBO_creation_sub,
    IBO_creation_sub,
    Update_and_Fill_Cone_VBO,
    Fill_cone_IBO,
    manage_VBO_Layout_sub,
} from "./sub_view/02_manage_VBO"
import { UBO_creation_sub, fill_MVP_UBO_sub } from "./sub_view/03_manage_UBO"
import { Layout_creation_sub } from "./sub_view/11_set_Layout";
import { BindGroup_creation_sub } from "./sub_view/12_set_BindGroup";
import { Pipeline_creation_sub } from "./sub_view/13_set_Pipeline";
import { subCanvasMouseInteraction } from "./sub_view/xx_interaction";


import { renderLoop_sub } from "./renderLoop_sub_view";





export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {

        async construct_large_imgBitMap(context, ret_json_pack) {
            console.log("json pack = ", ret_json_pack);
            const img_url_arr = ret_json_pack.largeBitMaps;

            for (let i = 0; i < img_url_arr.length; i++) {

                let file = img_url_arr[i];
                let url = "data:image/png;base64," + file;

                const blob = dataURL2Blob(url);

                const img_bitMap = await createImageBitmap(blob);

                context.state.CPU_storage.largeBitMap.push(img_bitMap);
            }

            console.log("【Quad-Init】Large BitMaps construct Done~ ");
            context.state.main_view_flow_quad.fence["DATASET_INFO_PARSE_DONE"] = true;
        },

        async construct_mip_imgBitMap(context) {
            // console.log("json pack received = ", ret_json_pack);

            const ret_json_pack = context.state.CPU_storage.server_raw_info["mip_bitmap_info_pack"];

            let flag = false;
            if (context.state.CPU_storage.mipBitMap.length == 13) {
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
                    context.state.CPU_storage.mipBitMap[i] = current_level_mapArr;
                }
                else {
                    context.state.CPU_storage.mipBitMap.push(current_level_mapArr);
                }
            }

            // console.log("bitmaps = ", context.state.CPU_storage.mipBitMap);
            // console.log("【Global】BitMaps Parse Done~");
            context.state.main_view_flow_3d.fence["BITMAP_READY"] = true;
        },

        /**
         *  从GPU获取返回结果
         * */
        async readBackMipLevel_and_FetchPicFromServer(context, device) {
            const state = context.state;
            /**
             *  Read Back MipLevel info from GPU
             * */
            // await read_back_miplevel_pass(state, device);
            await read_back_miplevel_pass_quad(state, device);
            // sub debug view 到这一步就可以进行绘制了
            state.sub_view_flow_debug.fence["RENDER_READY"] = true;
            // console.log("【Global】Mip data read back Done~");
            // console.log("【Sub】Ready to render sub view Debug~");

            /**
             *  Fetch Instance Picture from Server
             * */
            const mip_info = state.CPU_storage.mip_info;

            const cmd_json = {
                cmd: "fetch_mip_instance",
                mip_info: mip_info, // mip info 描述信息
            };

            // console.log("cmd_json = ", cmd_json);
            state.ws.send(JSON.stringify(cmd_json));
        },

        async readBackMipLevel_and_FetchQuadPicSetFromServer(context, device) {
            const state = context.state;
            await read_back_miplevel_pass_quad(state, device);
            // console.log("【Global】Mip data read back Done~");
            // console.log("【Sub】Ready to render sub view Debug~");
            // state.sub_view_flow_debug.fence["RENDER_READY"] = true;


            parse_mipLevelArr(state); // 时间占用怪物找到了，，，这个在300k的时候耗时很久！


            const cmd_json = {
                cmd: "fetch_quad_instance",
                mip_info: state.CPU_storage.mip_info.index_arr, // mip info 描述信息
            }


            // const cmd_json = {
            //     cmd: "fetch_quad_instance",
            //     mip_info: mip_info, // mip info 描述信息
            // };

            // const mip_info = state.CPU_storage.mip_info;
            // console.log("mip_info = ", mip_info);

            state.ws.send(JSON.stringify(cmd_json));

        },


        async construct_quad_imgBitMap(context) {

            const ret_json_pack = context.state.CPU_storage.server_raw_info["quad_bitmap_info_pack"];
            // console.log("json pack received = ", ret_json_pack);

            let flag = false;
            if (context.state.CPU_storage.quadBitMap.length == 13) {
                flag = true;
            }

            const bitMapInfo = ret_json_pack["quadBitMaps"];

            // 开始创建 img bit map
            for (let i = 0; i < bitMapInfo.length; i++) {

                let current_level_mapArr = [];

                for (let j = 0; j < bitMapInfo[i].length; j++) {

                    let file = bitMapInfo[i][j]["file_url"];
                    let file_idx = bitMapInfo[i][j]["pic_idx"];
                    let url = "data:image/png;base64," + file;

                    const blob = dataURL2Blob(url);

                    const img_bitMap = await createImageBitmap(blob);

                    current_level_mapArr.push({
                        file_idx: file_idx,
                        bitMap: img_bitMap,
                    });

                }
                if (flag) {
                    context.state.CPU_storage.quadBitMap[i] = current_level_mapArr;
                }
                else {
                    context.state.CPU_storage.quadBitMap.push(current_level_mapArr);
                }
            }

            // console.log("bitmaps = ", context.state.CPU_storage.quadBitMap);
            console.log("【Quad-Fetch】BitMaps Parse Done~");
            context.state.main_view_flow_quad.fence["BITMAP_READY"] = true;
        },

        async get_selected_image_idx(context, device) {
            // console.log("triggered");
            await read_back_hitIndex_pass(context.state, device);

        },



        async main_quad_update_detail_img(context, json_pack) {

            const url = "data:image/png;base64," + json_pack.img_url;
            const img_info = json_pack.img_info;

            context.state.CPU_storage.single_img_url = url;
            context.state.CPU_storage.single_img_info = img_info;

            const blob = dataURL2Blob(url);

            const img_bitMap = await createImageBitmap(blob);



            // const img_root_div = document.getElementsByClassName("hover-box")[0];
            // // 老元素删除
            // const ori_img = document.getElementById("raw-img");
            // if (ori_img != null) {
            //     img_root_div.removeChild(ori_img);
            // }

            // // 新元素创建并添加
            // const img = new Image(100, 100);
            // img.src = context.state.CPU_storage.single_img_url;
            // img.id = "raw-img";
            // img_root_div.appendChild(img);


            const img_root_div = document.getElementsByClassName("img_container")[0];
            // 老元素删除
            const ori_img = document.getElementById("detail-img");
            if (ori_img != null) {
                img_root_div.removeChild(ori_img);
            }

            // 新元素创建并添加
            const img = new Image();
            img.src = context.state.CPU_storage.single_img_url;
            img.id = "detail-img";

            // console.log("img = ", img);

            if (img_bitMap.width > img_bitMap.height) {
                img.style.width = "100%";
            }
            else {
                img.style.height = "100%";
            }

            img_root_div.appendChild(img);

        },


    },
    mutations: {

        /**
         *   Pre01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         * */
        init_device(state, { canvas, device }) {
            init_device_main(state, { canvas: canvas.main_canvas, device });
            // init_device_sub(state, { canvas: canvas.sub_canvas, device });
        },

        /**
         *  Pre02：camera 相关初始化
         * */
        init_camera(state, device) {
            init_prim_Camera(state, device);
            // init_sub_Camera(state, device);
            // console.log("main camera = ", state.camera.prim_camera);
        },




        /**############################# Main View Flow Quad #############################**/
        main_quad_flow_dataset_info_ready(state, device) {
            /**
             *  parse dataset info
             * */
            parse_dataset_info(state);

            console.log("【Global】Dataset info parse Done~");

            /**
             *  Create Texture
             * */
            quadTexture_creation(state, device);

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

            console.log("【Quad-Init】Buffer/Texture creation on Device Done~");



            /**
             *  Create Layout
             * */
            Layout_creation_quad(state, device);

            /**
             *  Create BindGroup
             * */
            BindGroup_creation_quad(state, device);

            /**
             *  Create Pipeline
             * */
            Pipeline_creation_quad(state, device);


            console.log("【Quad-Init】Layout/BindGroup/Pipeline creation Done~");



            /**
             *  Fill MVP Related UBOs
             * */
            fill_MVP_UBO_quad(state, device);


            /**
             *  Fill instances pos Related VBOs/SBOs 
             * */
            fill_quad_Instance_Pos_VBO(state, device);


            // /**
            //  *  Compute MipLevel on GPU
            //  * */
            // compute_miplevel_pass_quad(state, device);

            // console.log("【Main】Compute mipLevel submit Done~");

            // /**
            //  *  Fill layout SBO
            //  * */

            // fill_layout2d_layout3d_SBO(state, device);


            /**
             *  Register Interaction Events
             * */
            // Main-Canvas
            canvasMouseInteraction_quad(state, device);
            canvasKeyboardInteraction_quad(state, device);
            console.log("【Main】Interaction register for Main Canvas Done~");
        },

        main_quad_flow_dataset_info_parse_done(state, device) {

            /**
             *  Fill Texture Memory on GPU
             * */
            fill_Large_Quad_Texture(state, device);

            /**
             *  Fill Interaction Info UBO
             * */
            fill_Interaction_UBO(state, device);

            // /**
            //  *  Fill Atlas Info of VBO
            //  * */
            // fill_quad_Atlas_Info_VBO(state, device);

            /**
             *  Fill quad VBOs
             * */
            fill_Quad_VBO(state, device);

            state.main_view_flow_quad.fence["RENDER_READY"] = true;
            console.log("【Quad-Init】Ready to render main view 3D~");

            free_storage(state);
            console.log("【Quad-Init】Redundant CPU Storage Free Done~");

            // 

            /**
             *  Compute MipLevel
             * */
            compute_miplevel_pass_quad(state, device);

            state.main_view_flow_quad.fence["GET_SELECTED_IMG"] = true;

        },

        main_flow_fetch_bitmap_ready(state, device) {

            // console.log("【Quad】Ready to reload High-Res Pic");

            dynamic_fetch_update_Texture(state, device);


            /**
             *  打开这里从而获得动态预取
             * */
            // 复位所有相关标志位
            state.main_view_flow_quad.fence["COMPUTE_MIP_SUBMIT"] = false;
            state.main_view_flow_quad.fence["MIP_COMPUTE_DONE"] = false;
            state.main_view_flow_quad.fence["BITMAP_RECEIVED"] = false;
            state.main_view_flow_quad.fence["BITMAP_READY"] = false;
            // 开启下一轮循环
            // compute_miplevel_pass_quad(state, device);

            // console.timeEnd("dynamic loop time cost : ");
        },



        /**############################# Sub View Flow Debug #############################**/
        sub_flow_dataset_info_ready(state, device) {
            /**
             *  Create Texture
             * */
            subViewTexture_creation(state, device);

            /**
             *  Create VBO
             * */
            VBO_creation_sub(state, device);

            /**
             *  Creat IBO
             * */
            IBO_creation_sub(state, device);


            /**
             *  Manage VBO Layout
             * */
            manage_VBO_Layout_sub(state);

            /**
             *  Create UBO
             * */
            UBO_creation_sub(state, device);

            console.log("【Sub】Buffer/Texture creation on Device Done~");

            /**
             *  Create Layout
             * */
            Layout_creation_sub(state, device);

            /**
             *  Create BindGroup
             * */
            BindGroup_creation_sub(state, device);

            /**
             *  Create Pipeline
             * */
            Pipeline_creation_sub(state, device);


            console.log("【Sub】Layout/BindGroup/Pipeline creation Done~");

            /**
             *  Fill cone VBOs
             * */
            Update_and_Fill_Cone_VBO(state, device);

            /**
             *  Fill cone IBOs
             * */
            Fill_cone_IBO(state, device);


            /**
             *  Fill MVP Related UBOs
             * */
            fill_MVP_UBO_sub(state, device);

            /**
             *  Register Interaction Events
             * */
            // Sub-Canvas
            subCanvasMouseInteraction(state, device);

            console.log("【Sub】Interaction register for sub canvas Done~");
        },



        /**
         *  Main View Quad Render Loop
         * */
        main_canvas_quad_renderLoop(state, device) {
            renderLoop_quad(state, device);
        },

        /**
         *  Sub View Debug Render Loop
         * */
        sub_canvas_renderLoop(state, device) {
            // renderLoop_sub(state, device);
        },

    },
    state() {
        return {
            ws: undefined,
            // timer: undefined,
            GUI: {},
            camera: {
                prim_camera: {},
                sub_camera: {},
            },
            /**
             *  全局时序控制器，设置一些flag，并通过监控它们来获取正确的程序执行
             * */
            GPU_memory: {

                VBOs: {},
                IBOs: {},
                UBOs: {},
                SBOs: {},
                Textures: {
                    instance: [],
                    mip_instance: [],
                    quad_instance: [],
                    large_quad_prefetch: [],    // 32*32贴片块组成的预取数据纹理，预设一共有6张
                    dynamic_prefetch: [],       // 动态预取纹理 32 64 128 尺寸各两张？？
                },
            },
            CPU_storage: {
                server_raw_info: {
                    dataset_info_pack: {},
                    mip_bitmap_info_pack: {},
                },
                storage_arr: {}, // storage data in CPU for SBOs
                vertices_arr: {},
                indices_arr: {},  // 暂时不需要

                VBO_Layouts: {},

                instancedBitMap: [],
                mipBitMap: [],
                quadBitMap: [],
                largeBitMap: [], // 32*32 预计算的大纹理

                atlas_info: {
                    size: [],       // 用于记录大纹理的长宽尺寸
                    // uv_offset: [],  // 用于记录instance对应图片纹理在大纹理中的uv偏移
                    // uv_aspect: [], // 用于记录instance对应图片纹理的宽高比系数
                    // uv_size: [],    // 用于记录instance对应图片纹理在大纹理中的uv归一化宽高尺寸

                    /**
                     *  arr[x+0]: pre-fetch large textrue idx
                     *  arr[x+1:x+2]: uv_offset
                     *  arr[x+3:x+4]: uv_aspect
                     *  arr[x+5:x+6]: uv_size
                     * */
                    stride: 0,
                    arr: [],

                    /**
                     *  为分批次动态数据加载所提供的计数标志，由局部变量提升为全局标志，当前批次所有的数据包
                     * 都加载完毕后再清零
                     * */
                    tex_width_offset: 0,
                    tex_height_offset: 0,


                },
                mip_atlas_info: [],
                quad_atlas_info: [],
                mip_info: {
                    total_length: 0,// 用于记录miplevel的最大深度（也就是应该创建多少个大纹理）
                    arr: [],        // 用于记录当前视场中图片的MipLevel信息
                    index_arr: [],  // 更为详细的描述
                },

                instance_info: {}, // 描述instance数量等数据集信息，后端读取文件获得
                additional_info: {},
                interaction_info: {}, // 描述交互相关的 info

                /**
                 *  单一图片选取浏览
                 * */
                selected_img: { val: -1 },
                single_img_url: "",
                single_img_info: {},

                /**
                 *  高分辨率视图
                 * */ 
                show_highres: false,

            },
            // main_view_flow_3d: {
            //     fence: {
            //         // DEVICE_READY: { val: false },    // 暂时没用到
            //         DATASET_INFO_READY: { val: false }, 
            //         COMPUTE_MIP_SUBMIT: { val: false }, 
            //         BITMAP_RECEIVED: { val: false },    
            //         BITMAP_READY: { val: false },      
            //         RENDER_READY: { val: false },       // 
            //     },
            //     Layouts: {},
            //     BindGroups: {},
            //     Pipelines: {},
            //     passDescriptors: {},
            //     Pipeline_Layouts: {},
            // },
            sub_view_flow_debug: {
                fence: {
                    DATASET_INFO_READY: { val: false },
                    COMPUTE_MIP_SUBMIT: { val: false },
                    RENDER_READY: { val: false },
                },
                Layouts: {},
                BindGroups: {},
                Pipelines: {},
                passDescriptors: {},
                Pipeline_Layouts: {},
            },
            main_view_flow_quad: {

                fence: {
                    // init and render loop
                    DATASET_INFO_READY: { val: false }, // 初始化阶段向后台申请数据库信息
                    DATASET_INFO_PARSE_DONE: { val: false },
                    RENDER_READY: { val: false },

                    // dynamic pre-fetch loop
                    COMPUTE_MIP_SUBMIT: { val: false }, // 已经向GPU提交计算MipLevel的申请，等待数据返回
                    MIP_COMPUTE_DONE: { val: false },
                    BITMAP_RECEIVED: { val: false },    // 收到后台发来的BitMap字符串，准备构建
                    BITMAP_READY: { val: false },       // BitMap构建完成，可以填充Texture Memory
                    /**
                     *  我们使用数据包的形式，对数据进行分批次的更新，当最后一批数据更新完毕之前不会触发下一个取数据轮次，
                     * 以下 LAST_DATA_PACK_FLAG 被置位后，才会触发下一轮次的更新
                     * */
                    LAST_DATA_PACK_FLAG: { val: false },

                    /**
                     *  Single Image Fetch
                     * */
                    GET_SELECTED_IMG: { val: false },

                },
                Layouts: {},
                BindGroups: {},
                Pipelines: {},
                passDescriptors: {},
                Pipeline_Layouts: {},
            },
            main_canvas: {

                canvas: null,
                canvasFormat: null,
                // 指向當前GPU上下文，所以只需要一個 
                GPU_context: null,


                simulationParams: {}, // 仿真运行参数

                prim_camera: {},
                mouse_info: {
                    dragging: false,
                    drag_func: 0, // 0: 平移 1: dragBall
                    firstMouse: false,
                    lastX: 0,   // 弃用保留
                    lastY: 0,   // 弃用保留
                    wheel_speed: 0.05,
                    dragball_speed: 0.005,
                    drag_speed: 0.08,
                    db_click_flag: { val: false },

                },
                keyboard_info: {
                    speed: 1.0
                },
                simu_info: {
                    cur_layout: 1.0,
                    last_layout: 1.0,
                    simu_speed: 1.0,
                    simu_pause: 0.0,    // 初始为允许状态
                },
            },
            sub_canvas: {
                // 我們假定目前只有一個 canvas
                canvas: null,
                canvasFormat: null,
                // 指向當前GPU上下文，所以只需要一個 
                GPU_context: null,
                mouse_info: {},
                keyboard_info: {},
            }
        }
    },
    getters: {}
}
