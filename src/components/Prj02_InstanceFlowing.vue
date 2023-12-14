<template>
    <div class="root-container-main">
        <!-- <canvas class="main-canvas" width="512" height="512"></canvas> -->
        <canvas class="sub-canvas" width="512" height="512"></canvas>
    </div>
</template>
  
<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue';

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


    // 时序把控正确，后面再进行绘制

    setTimeout(() => {

        const canvas = document.querySelector("canvas");
        const sub_canvas = document.querySelector(".sub-canvas")

        // store.dispatch("InstanceFlow/init_and_render", canvas);
        store.dispatch("sub_canvas/init_and_render", sub_canvas);
    }, 1000);



})



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
    border: solid 10px red;
    background-color: #d5d5d5;
}

.main-canvas {
    width: 512px;
    height: 512px;
}
</style>
  