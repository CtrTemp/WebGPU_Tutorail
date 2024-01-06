<template>
    <div class="root-container-main">
        <canvas class="sub-canvas" width="512" height="512"></canvas>
        <canvas class="main-canvas" width="512" height="512"></canvas>
    </div>
</template>
  
<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject, watch } from 'vue';

import { mat4, vec3, vec4 } from "wgpu-matrix"

/**
 *  以下语句必须，不可注释
 *  恰好为等待 device 响应的时间，之后再去执行 onMounted 可以保证 device 是可靠的
 * */
const device = await inject("device");
const store = useStore();

const ws = store.state.ws;

// onMounted
onMounted(() => {


    const window_width = window.innerWidth;
    const window_height = window.innerHeight;


    const main_canvas = document.querySelector(".main-canvas");
    const sub_canvas = document.querySelector(".sub-canvas");

    main_canvas.width = window_width;
    main_canvas.height = window_height;

    store.state.pic_browser.main_canvas.canvas = main_canvas;
    store.state.pic_browser.sub_canvas.canvas = sub_canvas;

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

    /**
     *  fetch data set description info once
     * */
    const temp_json_cmd = {
        cmd: "void",
        pack: []
    }
    ws.send(JSON.stringify(temp_json_cmd));

})

// 需要用一个返回该属性的 getter 函数来完成监听： 


// /**
//  *  Device Ready
//  * */
// watch(() => {
//     return store.state.pic_browser.fence["DEVICE_READY"];
// }, (flag) => {
//     if (flag == true) {
//         console.log("device ready!!!");
//         // store.commit("pic_browser/main_canvas_initialize_stage1", device);
//         // store.commit("pic_browser/main_canvas_initialize_stage1", device);
//     }
// }, { deep: true });



/**
 *  Dataset Info Ready
 * */
watch(() => {
    return store.state.pic_browser.fence["DATASET_INFO_READY"];
}, (flag) => {
    if (flag == true) {
        store.commit("pic_browser/main_canvas_initialize_stage2", device);
        store.commit("pic_browser/main_canvas_initialize_stage3", device);
        store.commit("pic_browser/main_canvas_initialize_stage4", device);
    }
}, { deep: true });



/**
 *  Compute MipLevel Submit
 * */
watch(() => {
    return store.state.pic_browser.fence["COMPUTE_MIP_SUBMIT"];
}, (flag) => {
    if (flag == true) {
        store.dispatch("pic_browser/readBackMipLevel_and_FetchPicFromServer", device);
    }
}, { deep: true });



/**
 *  BitMap Ready
 * */
watch(() => {
    return store.state.pic_browser.fence["BITMAP_READY"];
}, (flag) => {
    if (flag == true) {
        console.log("bitmap ready!!!");
        store.commit("pic_browser/main_canvas_initialize_stage5", device);
    }
}, { deep: true });



/**
 *  RENDER Ready
 * */
watch(() => {
    return store.state.pic_browser.fence["RENDER_READY"];
}, (flag) => {
    if (flag == true) {
        console.log("RENDER MAIN ready!!!");
        store.commit("pic_browser/main_canvas_renderLoop", device);
        store.commit("pic_browser/sub_canvas_renderLoop", device);
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
</style>
  