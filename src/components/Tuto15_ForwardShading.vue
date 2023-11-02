<template>
  <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue'

const store = useStore();

// 必须，恰好为等待 device 响应的时间，之后再去执行 onMounted 可以保证 device 是可靠的
const device = await inject("device");


// onMounted
onMounted(() => {

  const canvas = document.querySelector("canvas");

  store.dispatch("ForwardShading/init_device", canvas);
  store.dispatch("ForwardShading/init_data");
  store.dispatch("ForwardShading/manage_pipeline");


  store.dispatch("ForwardShading/renderLoop");
})


</script>

<style></style>