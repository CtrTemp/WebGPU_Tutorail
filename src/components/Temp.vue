<template>
    <div class="root-container">
        <img id="gpu_img" src="../assets/img/webgpu.png" alt="">
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

    const img = document.getElementById("gpu_img");

    console.log('img = ', img);

    // const img_obj = new Image();

    const bitMap = createImageBitmap(img);


    console.log(bitMap);


})



</script>
  
<style>
.root-container {
    position: absolute;
    left: 0px;
    top: 0px;
    /* 内廓border不额外占用空间 */
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: solid 10px black;
    background-color: black;
}

</style>
  