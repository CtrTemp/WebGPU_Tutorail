<template>
  <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';
import { inject } from 'vue'


import { mesh } from "../assets/mesh/stanfordDragon.js"

import { compute_shader } from '../assets/Shaders/Tuto15/light_refresh_comp';
import { geom_vert } from '../assets/Shaders/Tuto15/geom_vert';
import { geom_frag } from '../assets/Shaders/Tuto15/geom_frag';
import { quad_vert } from '../assets/Shaders/Tuto15/quad_vert';
// import fragmentGBuffersDebugView from '../assets/Shaders/Tuto15';
import { debug_frag } from '../assets/Shaders/Tuto15/debug_frag';
import { render_frag } from '../assets/Shaders/Tuto15/render_frag';

import { mat4, vec3, vec4 } from "wgpu-matrix"

const store = useStore();


// 定义全局参数：最大光源数量、光源分布范围
const kMaxNumLights = 1024;
const lightExtentMin = vec3.fromValues(-50, -30, -50);
const lightExtentMax = vec3.fromValues(50, 50, 50);

await inject("device");

// onMounted
onMounted(() => {

  // 选中 GPU 设备
  const device = store.state.device;

  const canvas = document.querySelector("canvas");

  store.dispatch("Tuto15/init_and_render", canvas);


  
  // //--------------------

  // // Scene matrices
  // const eyePosition = vec3.fromValues(0, 50, -100);
  // const upVector = vec3.fromValues(0, 1, 0);
  // const origin = vec3.fromValues(0, 0, 0);

  // const projectionMatrix = mat4.perspective(
  //   (2 * Math.PI) / 5,
  //   aspect,
  //   1,
  //   2000.0
  // );

  // const viewMatrix = mat4.inverse(mat4.lookAt(eyePosition, origin, upVector));

  // const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);

  // // // Move the model so it's centered.
  // // const modelMatrix = mat4.translation([0, -45, 0]);

  // // const modelData = modelMatrix;
  // // device.queue.writeBuffer(
  // //   modelUniformBuffer,
  // //   0,
  // //   modelData.buffer,
  // //   modelData.byteOffset,
  // //   modelData.byteLength
  // // );
  // // const invertTransposeModelMatrix = mat4.invert(modelMatrix);
  // // mat4.transpose(invertTransposeModelMatrix, invertTransposeModelMatrix);
  // // const normalModelData = invertTransposeModelMatrix;
  // // device.queue.writeBuffer(
  // //   modelUniformBuffer,
  // //   64,
  // //   normalModelData.buffer,
  // //   normalModelData.byteOffset,
  // //   normalModelData.byteLength
  // // );


  function frame() {
    // Sample is no longer the active page.
    // if (!pageState.active) return;

    const cameraViewProj = getCameraViewProjMatrix();
    device.queue.writeBuffer(
      cameraUniformBuffer,
      0,
      cameraViewProj.buffer,
      cameraViewProj.byteOffset,
      cameraViewProj.byteLength
    );
    const cameraInvViewProj = mat4.invert(cameraViewProj);
    device.queue.writeBuffer(
      cameraUniformBuffer,
      64,
      cameraInvViewProj.buffer,
      cameraInvViewProj.byteOffset,
      cameraInvViewProj.byteLength
    );

    const commandEncoder = device.createCommandEncoder();
    {
      // Write position, normal, albedo etc. data to gBuffers
      const gBufferPass = commandEncoder.beginRenderPass(
        writeGBufferPassDescriptor
      );
      gBufferPass.setPipeline(writeGBuffersPipeline);
      gBufferPass.setBindGroup(0, sceneUniformBindGroup);
      gBufferPass.setVertexBuffer(0, vertexBuffer);
      gBufferPass.setIndexBuffer(indexBuffer, 'uint16');
      gBufferPass.drawIndexed(indexCount);
      gBufferPass.end();
    }
    {
      // Update lights position
      const lightPass = commandEncoder.beginComputePass();
      lightPass.setPipeline(lightUpdateComputePipeline);
      lightPass.setBindGroup(0, lightsBufferComputeBindGroup);
      lightPass.dispatchWorkgroups(Math.ceil(kMaxNumLights / 64));
      lightPass.end();
    }
    {
      if (settings.mode === 'gBuffers view') {
        // GBuffers debug view
        // Left: depth
        // Middle: normal
        // Right: albedo (use uv to mimic a checkerboard texture)
        textureQuadPassDescriptor.colorAttachments[0].view = context
          .getCurrentTexture()
          .createView();
        const debugViewPass = commandEncoder.beginRenderPass(
          textureQuadPassDescriptor
        );
        debugViewPass.setPipeline(gBuffersDebugViewPipeline);
        debugViewPass.setBindGroup(0, gBufferTexturesBindGroup);
        debugViewPass.draw(6);
        debugViewPass.end();
      } else {
        // Deferred rendering
        textureQuadPassDescriptor.colorAttachments[0].view = context
          .getCurrentTexture()
          .createView();
        const deferredRenderingPass = commandEncoder.beginRenderPass(
          textureQuadPassDescriptor
        );
        deferredRenderingPass.setPipeline(deferredRenderPipeline);
        deferredRenderingPass.setBindGroup(0, gBufferTexturesBindGroup);
        deferredRenderingPass.setBindGroup(1, lightsBufferBindGroup);
        deferredRenderingPass.draw(6);
        deferredRenderingPass.end();
      }
    }
    device.queue.submit([commandEncoder.finish()]);

  }
})


</script>

<style></style>
