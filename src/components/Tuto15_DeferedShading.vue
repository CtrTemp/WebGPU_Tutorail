<template>
  <div class="root-container">
    <canvas class="main-canvas" width="768" height="512"></canvas>
  </div>
</template>

<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue'


const store = useStore();


// // 定义全局参数：最大光源数量、光源分布范围
// const kMaxNumLights = 1024;
// const lightExtentMin = vec3.fromValues(-50, -30, -50);
// const lightExtentMax = vec3.fromValues(50, 50, 50);

await inject("device");

// onMounted
onMounted(() => {

  const canvas = document.querySelector("canvas");

  store.dispatch("Tuto15/init_and_render", canvas);



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
  border: solid 10px red;
  background-color: black;
}

.main-canvas {
  width: 100%;
  height: 100%;
}
</style>
