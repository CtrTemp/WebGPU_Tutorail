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

    store.dispatch("Tuto05/init_device", canvas);
    store.dispatch("Tuto05/init_data");
    store.dispatch("Tuto05/manage_pipeline");


    store.dispatch("Tuto05/renderLoop");
})


</script>

<style></style>