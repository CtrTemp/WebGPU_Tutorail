

<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue'

const store = useStore();

const device = await inject("device");


onMounted(()=>{

    

    const canvas = document.querySelector("canvas");

    store.dispatch("Tuto08/init_device", canvas);
    store.dispatch("Tuto08/init_data");
    store.dispatch("Tuto08/manage_pipeline");


    store.dispatch("Tuto08/renderLoop");
})



</script>

<style>

</style>