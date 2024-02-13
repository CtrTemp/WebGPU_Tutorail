<template>
    <div class="root-container-main">
        <!-- <canvas class="sub-canvas" width="512" height="512"></canvas> -->
        <canvas class="main-canvas" width="512" height="512"></canvas>
        <div class="hover-box">
            <!-- 其他内容 -->
            <!-- <img src="" alt="" width="100" height="100" id="raw-img"> -->
        </div>
        <SiderPannel />
    </div>
</template>
  
<script setup>

import SiderPannel from './SiderPannel/SiderPannel.vue';

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject, provide, watch } from 'vue';

import { mat4, vec3, vec4 } from "wgpu-matrix"

/**
 *  以下语句必须，不可注释
 *  恰好为等待 device 响应的时间，之后再去执行 onMounted 可以保证 device 是可靠的
 * */
const device = await inject("device");
const store = useStore();

const ws = store.state.ws;


// provide("single_img_info", store.state.pic_browser.CPU_storage.single_img_info);




// onMounted
onMounted(() => {


    const window_width = window.innerWidth;
    const window_height = window.innerHeight;


    const main_canvas = document.querySelector(".main-canvas");
    const sub_canvas = document.querySelector(".sub-canvas");

    main_canvas.width = window_width;
    main_canvas.height = window_height;

    store.state.pic_browser.main_canvas.canvas = main_canvas;
    // store.state.pic_browser.sub_canvas.canvas = sub_canvas;

    const device = store.state.device;

    /**
     *  将 rootState 中的 ws 接口赋值给本地的 ws
     * */

    store.state.pic_browser.ws = ws;


    /**
     *  device initialization
     * */
    store.commit("pic_browser/init_device", {
        canvas: { main_canvas, sub_canvas },
        device
    });
    /**
     *  camera initialization
     * */
    store.commit("pic_browser/init_camera", device);

    // /**
    //  *  fetch data set description info once
    //  * */
    // const temp_json_cmd = {
    //     cmd: "void",
    //     pack: []
    // }
    // ws.send(JSON.stringify(temp_json_cmd));


    const fetch_large_texture_cmd = {
        cmd: "sys_startup_prefetch",
        pack: []
    }

    ws.send(JSON.stringify(fetch_large_texture_cmd));
})




/*** ################# Global Watch Camera ################# ***/



// watch(() => {
//     return store.state.pic_browser.camera["prim_camera"];
// }, () => {
//     console.log("camera moving~");
// }, { deep: true });




/*** ################# Sub View Debug Flow Control Watcher Group ################# ***/

watch(() => {
    return store.state.pic_browser.sub_view_flow_debug.fence["DATASET_INFO_READY"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/sub_flow_dataset_info_ready", device);
    }
}, { deep: true });

watch(() => {
    return store.state.pic_browser.sub_view_flow_debug.fence["RENDER_READY"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/sub_canvas_renderLoop", device);
    }
}, { deep: true });



/*** ################# Main View Quad Flow Control Watcher Group ################# ***/

watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["DATASET_INFO_READY"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/main_quad_flow_dataset_info_ready", device);

    }
}, { deep: true });



/**
 *  Sys Startup Info Parse Done
 * */

watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["DATASET_INFO_PARSE_DONE"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/main_quad_flow_dataset_info_parse_done", device);
    }
}, { deep: true })


/**
 *  RENDER Ready
 * */
watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["RENDER_READY"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/main_canvas_quad_renderLoop", device);
    }
}, { deep: true });




/**
 *  Compute MipLevel Pass Submit
 * */
watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["COMPUTE_MIP_SUBMIT"];
}, (flag) => {
    if (flag == true) {
        // console.time("dynamic loop time cost : ");
        store.dispatch("pic_browser/readBackMipLevel_and_FetchQuadPicSetFromServer", device);
    }
}, { deep: true });


/**
 *  BitMap Received
 * */
watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["BITMAP_RECEIVED"];
}, (flag) => {
    if (flag == true) {
        store.dispatch("pic_browser/construct_quad_imgBitMap");
    }
}, { deep: true });



/**
 *  BitMap Ready
 * */
watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["BITMAP_READY"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/main_flow_fetch_bitmap_ready", device);
    }
}, { deep: true });



/**
 *  Get selected img Done
 *  第一次需要被触发执行（选择你的触发位置吧，先去吃饭，回来从选择触发位置开始继续）
 * */

watch(() => {
    return store.state.pic_browser.main_view_flow_quad.fence["GET_SELECTED_IMG"];
}, (flag) => {
    if (flag == true) {
        store.dispatch("pic_browser/get_selected_image_idx", device);
    }
}, { deep: true });



watch(() => {
    return store.state.pic_browser.CPU_storage.selected_img;
}, (val) => {
    if (val.val != -1) {
        /**
         *  根据当前的信息，向服务端取数据
         * */
        const img_idx = val.val;

        const json_cmd = {
            cmd: "fetch_single_img",
            idx: img_idx,
        };

        store.state.pic_browser.ws.send(JSON.stringify(json_cmd));
    }
}, { deep: true });







</script>
  
<style>
.root-container-main {
    position: absolute;
    left: 0px;
    top: 0px;
    /* 内廓border不额外占用空间 */
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: solid 10px black;
    background-color: #d5d5d5;
}

.main-canvas {
    width: 100%;
    height: 100%;
}

.sub-canvas {
    position: absolute;
    /* width: 100%;
    height: 100%; */
    right: 0px;
    bottom: 0px;
}

.hover-box {
    position: absolute;
    left: 0px;
    top: 0px;
    width: 50px;
    height: 50px;
    background-color: aquamarine;
    display: none;
}
</style>
  