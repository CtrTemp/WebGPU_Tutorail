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

// 必须，恰好为等待 device 响应的时间，之后再去执行 onMounted 可以保证 device 是可靠的
const device = await inject("device");
const store = useStore();

const ws = store.state.ws;

// onMounted
onMounted(() => {

    const cmd_json = {
        cmd: "fetch_instanced_texture",
        count: 100, // 索取图片数量 
    }

    // 这将初始化读入texture
    setTimeout(() => {
        ws.send(JSON.stringify(cmd_json));
    }, 10);



    const window_width = window.innerWidth;
    const window_height = window.innerHeight;


    const main_canvas = document.querySelector(".main-canvas");
    const sub_canvas = document.querySelector(".sub-canvas");

    main_canvas.width = window_width;
    main_canvas.height = window_height;

    store.state.pic_browser.main_canvas.canvas = main_canvas;
    store.state.pic_browser.sub_canvas.canvas = sub_canvas;

    const device = store.state.device;

    store.commit("pic_browser/init_device", {
        canvas: { main_canvas, sub_canvas },
        device
    });


    // // 时序把控正确，后面再进行绘制

    // setTimeout(() => {


    //     const canvas_pack = {
    //         main_canvas, sub_canvas
    //     };

    //     // store.dispatch("InstanceFlow/init_and_render", main_canvas);
    //     // store.dispatch("sub_canvas/init_and_render", sub_canvas);
    //     store.dispatch("pic_browser/init_and_render", canvas_pack);
    // }, 1000);


    /**
     *  重写时序逻辑
     * */





})

// 需要用一个返回该属性的 getter 函数来完成监听： 


/**
 *  Device Ready
 * */
watch(() => {
    return store.state.pic_browser.main_canvas.fence["DEVICE_READY"];
}, (flag) => {
    if (flag == true) {
        // console.log("device ready!!!");
        const device = store.state.device;
        store.commit("pic_browser/main_canvas_VBO_stage1", device);
    }
}, { deep: true });



/**
 *  BitMap Ready
 * */
watch(() => {
    return store.state.pic_browser.main_canvas.fence["BITMAP_READY"];
}, (flag) => {
    if (flag == true) {
        // console.log("bitmap ready!!!");
        const device = store.state.device;
        store.commit("pic_browser/main_canvas_VBO_stage2", device);
    }
}, { deep: true });



/**
 *  VBO Ready
 * */
watch(() => {
    return store.state.pic_browser.main_canvas.fence["VBO_READY"];
}, (flag) => {
    if (flag == true) {
        // console.log("VBO ready!!!");
        const device = store.state.device;
        store.commit("pic_browser/main_canvas_manage_rest_of_all", device);
    }
}, { deep: true });


/**
 *  main canvas RENDER Ready
 * */
watch(() => {
    return store.state.pic_browser.main_canvas.fence["RENDER_READY_MAIN"];
}, (flag) => {
    if (flag == true) {
        // console.log("RENDER MAIN ready!!!");
        const device = store.state.device;
        store.commit("pic_browser/main_canvas_renderLoop", device);
        /**
         *  同样提交对辅助视图的全体配置
         * */
        store.commit("pic_browser/sub_canvas_management", device);
    }
}, { deep: true });



/**
 *  sub canvas RENDER Ready
 * */
 watch(() => {
    return store.state.pic_browser.main_canvas.fence["RENDER_READY_SUB"];
}, (flag) => {
    if (flag == true) {
        // console.log("RENDER SUB ready!!!");
        const device = store.state.device;
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
  