<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { useStore } from 'vuex';
import { onMounted } from 'vue';

import {mat4, vec3, vec4} from "wgpu-matrix"

// 必须，恰好为等待 device 响应的时间，之后再去执行 onMounted 可以保证 device 是可靠的
const device = await inject("device");


// // onMounted
// onMounted(() => {

//   const canvas = document.querySelector("canvas");

//   store.dispatch("ForwardShading/init_device", canvas);
//   store.dispatch("ForwardShading/init_data");
//   store.dispatch("ForwardShading/manage_pipeline");


//   store.dispatch("ForwardShading/renderLoop");
// })



const store = useStore();

const numParticles = 50000;
const particlePositionOffset = 0;
const particleColorOffset = 4 * 4;
const particleInstanceByteSize =
  3 * 4 + // position
  1 * 4 + // lifetime
  4 * 4 + // color
  3 * 4 + // velocity
  1 * 4 + // padding
  0;



  
  //////////////////////////////////////////////////////////////////////////////
  // Texture
  //////////////////////////////////////////////////////////////////////////////
  let texture;
  let textureWidth = 1;
  let textureHeight = 1;
  let numMipLevels = 1;
  {
    const response = await fetch(
      // new URL('../assets/img/webgpu.png', import.meta.url).toString()
      // new URL('../assets/img/LGD_logo.jpg', import.meta.url).toString()
      new URL('../assets/img/logo_resized.png', import.meta.url).toString()
    );
    const imageBitmap = await createImageBitmap(await response.blob());

    // Calculate number of mip levels required to generate the probability map
    while (
      textureWidth < imageBitmap.width ||
      textureHeight < imageBitmap.height
    ) {
      textureWidth *= 2;
      textureHeight *= 2;
      numMipLevels++;
    }
    texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      mipLevelCount: numMipLevels,
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: texture },
      [imageBitmap.width, imageBitmap.height]
    );
  }

// onMounted
const mount_func = onMounted(()=>{
  
  




  const aspect = canvas.width / canvas.height;
  const projection = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 100.0);
  const view = mat4.create();
  const mvp = mat4.create();

  function frame() {
    // Sample is no longer the active page.
    // if (!pageState.active) return;

    device.queue.writeBuffer(
      simulationUBOBuffer,
      0,
      new Float32Array([
        simulationParams.simulate ? simulationParams.deltaTime : 0.0,
        0.0,
        0.0,
        0.0, // padding
        Math.random() * 100,
        Math.random() * 100, // seed.xy
        1 + Math.random(),
        1 + Math.random(), // seed.zw
      ])
    );

    mat4.identity(view);
    mat4.translate(view, vec3.fromValues(0, 0, -3), view);
    mat4.rotateX(view, Math.PI * -0.2, view);
    mat4.multiply(projection, view, mvp);

    // prettier-ignore
    device.queue.writeBuffer(
      uniformBuffer,
      0,
      new Float32Array([
        // modelViewProjectionMatrix
        mvp[0], mvp[1], mvp[2], mvp[3],
        mvp[4], mvp[5], mvp[6], mvp[7],
        mvp[8], mvp[9], mvp[10], mvp[11],
        mvp[12], mvp[13], mvp[14], mvp[15],

        view[0], view[4], view[8], // right

        0, // padding

        view[1], view[5], view[9], // up

        0, // padding
      ])
    );
    const swapChainTexture = context.getCurrentTexture();
    // prettier-ignore
    renderPassDescriptor.colorAttachments[0].view = swapChainTexture.createView();

    const commandEncoder = device.createCommandEncoder();
    {
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, computeBindGroup);
      passEncoder.dispatchWorkgroups(Math.ceil(numParticles / 64));
      passEncoder.end();
    }
    {
      const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
      passEncoder.setPipeline(renderPipeline);
      passEncoder.setBindGroup(0, uniformBindGroup);
      passEncoder.setVertexBuffer(0, particlesBuffer);
      passEncoder.setVertexBuffer(1, quadVertexBuffer);
      passEncoder.draw(6, numParticles, 0, 0);
      passEncoder.end();
    }

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  })


</script>

<style>

</style>
