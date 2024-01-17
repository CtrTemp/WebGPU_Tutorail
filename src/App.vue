<template>
  <Suspense>
    <!-- <WebGPURoot/> -->
    <!-- <Tuto02_RenderGrid/> -->
    <!-- <Tuto03_RenderState /> -->
    <!-- <Tuto04_ConwayLifeGame/> -->
    <!-- <Tuto05_Triangle/> -->
    <!-- <Tuto06_MSAA/> -->
    <!-- <Tuto07_CanvasResize/> -->
    <!-- <Tuto08_RotatingCube_Own/> -->
    <!-- <Tuto09_twoCubes/> -->
    <!-- <Tuto10_TexturedCube/> -->
    <!-- <Tuto11_InstancedCube/> -->
    <!-- <Tuto12_FractalCube/> -->
    <!-- <Tuto13_Camera/> -->
    <!-- <Tuto14_CubeMap/> -->
    <!-- <Tuto15_DeferredShading/> -->
    <!-- <Tuto15_ForwardShading/> -->
    <!-- <Tuto16_ShadowMap/> -->
    <!-- <Tuto17_Particles/> -->
    <!-- <Tuto17_ParticlesOwn/> -->
    <!-- <Tuto18_BoidSimulation/> -->

    <!-- <Flow/> -->


    <!-- <Prj01_InstanceMoving /> -->
    <Prj02_InstanceFlowing />
    <!-- <Temp /> -->
    <!-- <Test01 /> -->


  </Suspense>
  <!-- <WebGPURoot/> -->
</template>

<script setup>
import WebGPURoot from './components/WebGPURoot.vue';
import Tuto02_RenderGrid from './components/Tuto02_RenderGrid.vue';
import Tuto03_RenderState from './components/Tuto03_RenderState.vue';
import Tuto04_ConwayLifeGame from './components/Tuto04_ConwayLifeGame.vue';
import Tuto05_Triangle from './components/Tuto05_Triangle.vue';
import Tuto06_MSAA from './components/Tuto06_MSAA.vue';
import Tuto07_CanvasResize from './components/Tuto07_CanvasResize.vue';
import Tuto08_RotatingCube from './components/Tuto08_RotatingCube.vue';
import Tuto08_RotatingCube_Own from './components/Tuto08_RotatingCube_Own.vue';
import Tuto09_twoCubes from './components/Tuto09_twoCubes.vue';
import Tuto10_TexturedCube from './components/Tuto10_TexturedCube.vue';
import Tuto11_InstancedCube from './components/Tuto11_InstancedCube.vue';
import Tuto12_FractalCube from './components/Tuto12_FractalCube.vue';
// import Tuto13_Camera from './components/Tuto13_Camera.vue';
import Tuto14_CubeMap from './components/Tuto14_CubeMap.vue';
import Tuto15_DeferredShading from './components/Tuto15_DeferedShading.vue'
import Tuto16_ShadowMap from './components/Tuto16_ShadowMap.vue';
import Tuto17_Particles from './components/Tuto17_Particles.vue';
import Tuto17_ParticlesOwn from './components/Tuto17_ParticlesOwn.vue';
import Tuto18_BoidSimulation from './components/Tuto18_BoidSimulation.vue';

import Tuto15_ForwardShading from './components/Tuto15_ForwardShading.vue';

import Test01 from './components/Test01.vue';

// import Prj01_InstanceMoving from './components/Prj01_InstanceMoving.vue';

import Prj02_InstanceFlowing from './components/Prj02_InstanceFlowing.vue';

import Temp from "./components/Temp.vue";


import { useStore } from 'vuex';
import { provide } from "vue"


const store = useStore();


// 查看当前浏览器是否支持 WebGPU
if (!navigator.gpu) {
  throw new Error("WebGPU not supported on this browser");
}
else {
  // console.log("Well done~ your browser can fully support WebGPU");
}

// 应该是通过根节点透传的方式将 device 这类全局变量给到其他节点
// 选中 GPU 设备

const device = new Promise((resolve, reject) => {
  navigator.gpu.requestAdapter().then((adapter) => {

    if (!adapter) {
      throw new Error("No appropriate GPUAdapter found.");
    }

    adapter.requestDevice().then((data) => {
      resolve(data);
      store.state.device = data; // 给全局变量 device 赋值
    });
  })
})
provide("device", device);



// 这里负责接收服务器回传的消息
store.state.ws.onmessage = function (e) {
  const json_pack = JSON.parse(e.data);
  // console.log(json_pack);

  // 这里只负责更新组件状态, 具体业务逻辑在各个组件中, 通过监视组件状态的改变执行对应操作
  // 而源数据的获取, 即与server进行通信获取message的部分, 在server_link.js中
  switch (json_pack.cmd) {
    case "void_ret_pack":
      console.log("【Test】server void test info pack return");
      // store.commit("pic_browser/main_canvas_initialize_stage1", json_pack);
      // 这里不应该直接提交，而应该通过触发标志位，来间接触发后续初始化
      store.state.pic_browser.CPU_storage.server_raw_info["dataset_info_pack"] = json_pack;
      // store.state.pic_browser.main_view_flow_3d.fence["DATASET_INFO_READY"] = true;
      store.state.pic_browser.main_view_flow_quad.fence["DATASET_INFO_READY"] = true;
      store.state.pic_browser.sub_view_flow_debug.fence["DATASET_INFO_READY"] = true;
      break;
    case "instanced_texture_pack":
      // console.log("haha, msg received");
      store.dispatch("pic_browser/construct_imgBitMap", json_pack);
      break;

    case "mip_texture_pack":
      // store.dispatch("pic_browser/construct_mip_imgBitMap", json_pack);
      store.state.pic_browser.CPU_storage.server_raw_info["mip_bitmap_info_pack"] = json_pack;
      // store.state.pic_browser.main_view_flow_3d.fence["BITMAP_RECEIVED"] = true;
      break;
      
    case "quad_texture_pack":
      store.state.pic_browser.CPU_storage.server_raw_info["quad_bitmap_info_pack"] = json_pack;
      store.state.pic_browser.main_view_flow_quad.fence["BITMAP_RECEIVED"] = true;
      break;

    case "large_texture_pack":
      store.state.pic_browser.CPU_storage.server_raw_info["dataset_info_pack"] = json_pack;
      store.state.pic_browser.main_view_flow_quad.fence["DATASET_INFO_READY"] = true;
      store.dispatch("pic_browser/construct_large_imgBitMap", json_pack);
      break;

    default:
      console.log("server source message header invalid");
  }
};


</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
