<template>
  <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue';

import { mat4, vec3, vec4 } from "wgpu-matrix"

// 必须，恰好为等待 device 响应的时间，之后再去执行 onMounted 可以保证 device 是可靠的
const device = await inject("device");
const store = useStore();

// onMounted
onMounted(() => {

  const canvas = document.querySelector("canvas");

  store.dispatch("Particles/init_device", canvas);
  store.dispatch("Particles/init_data");

  setTimeout(()=>{
    store.dispatch("Particles/manage_pipeline");
  }, 1000);  
  
  setTimeout(()=>{
    store.dispatch("Particles/renderLoop");
  }, 1000);  


  // store.dispatch("Particles/renderLoop");
})



</script>

<style></style>
