<template>
  <div class="root-container">
    <!-- 设置width height以增加分辨率 -->
    <canvas class="main-canvas" width="1440" height="800"></canvas>
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue'

const store = useStore();

const device = await inject("device");

// onMounted
onMounted(() => {

  const canvas = document.querySelector("canvas");
  store.dispatch("Tuto16/init_and_render", canvas);

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

.main-canvas {
  width: 100%;
  height: 100%;
}
</style>
