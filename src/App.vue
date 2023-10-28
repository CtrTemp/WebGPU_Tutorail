<script setup lang="ts">
import DemoCube from './components/00_Demo_Cube.vue'
import DemoInstancedCube from './components/01_Demo_InstancesCube.vue'
</script>

<template>
  <Suspense>
    <DemoCube/>
    <!-- <DemoInstancedCube/> -->
  </Suspense>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
