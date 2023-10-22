<template>
  <Suspense>
    <!-- <WebGPURoot/> -->
    <!-- <Tuto02_RenderGrid/> -->
    <!-- <Tuto03_RenderState/> -->
    <Tuto04_ConwayLifeGame/>
  </Suspense>
    <!-- <WebGPURoot/> -->
</template>

<script setup>
import WebGPURoot from './components/WebGPURoot.vue';
import Tuto02_RenderGrid from './components/Tuto02_RenderGrid.vue';
import Tuto03_RenderState from './components/Tuto03_RenderState.vue';
import Tuto04_ConwayLifeGame from './components/Tuto04_ConwayLifeGame.vue';


// export default {
//   name: 'App',
//   components: {
//     HelloWorld
//   }
// }
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
