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

    store.commit("Test01/init_device", {canvas, device});
    store.commit("Test01/init_data", device);
    store.commit("Test01/manage_pipeline", device);


    store.commit("Test01/renderLoop", device);
})


</script>

<style></style>