<!-- 说明：TS 是 JS 的超集，JS代码基本可以不做修改直接移植到TS中 -->
<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup lang="ts">

import { onMounted } from 'vue';
import { vertex_shader, fragment_shader } from '../assets/Shaders/Tuto_12/shader'
import {
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray} from "../assets/Shaders/Tuto_12/cube_info"

import {mat4, vec3} from "wgpu-matrix"

import { ArcballCamera, WASDCamera, cameraSourceInfo } from '../assets/Shaders/Tuto_12/camera';
import { createInputHandler, inputSourceInfo } from '../assets/Shaders/Tuto_12/input';

// 查看当前浏览器是否支持 WebGPU
if(!navigator.gpu){
    throw new Error("WebGPU not supported on this browser");
}
else{
    console.log("Well done~ your browser can fully support WebGPU");
}



  // The input handler
  const inputHandler = createInputHandler(window);

  // The camera types
  const initialCameraPosition = vec3.create(3, 2, 5);
  const cameras = {
    arcball: new ArcballCamera({ position: initialCameraPosition }),
    WASD: new WASDCamera({ position: initialCameraPosition }),
  };

  // GUI parameters（如果没有GUI就在这里进行demo时的手动切换）
  const params: { type: 'arcball' | 'WASD' } = {
    type: 'arcball',
    // type: 'WASD',
  };

//   // Callback handler for camera mode
//   let oldCameraType = params.type;
//   gui.add(params, 'type', ['arcball', 'WASD']).onChange(() => {
//     // Copy the camera matrix from old to new
//     const newCameraType = params.type;
//     cameras[newCameraType].matrix = cameras[oldCameraType].matrix;
//     oldCameraType = newCameraType;
//   });



// 当前浏览器是否找到合适的适配器
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

// 选中 GPU 设备
const device = await adapter.requestDevice();




  // Fetch the image and upload it into a GPUTexture.
  let cubeTexture;
  {
    const response = await fetch(
      new URL('../assets/img/eye.jpeg', import.meta.url).toString()
    );
    const imageBitmap = await createImageBitmap(await response.blob());

    cubeTexture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: cubeTexture },
      [imageBitmap.width, imageBitmap.height]
    );
  }

  // Create a sampler with linear filtering for smooth interpolation.
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });


// onMounted
const mount_func = onMounted(()=>{
    const canvas = document.querySelector("canvas");

    const context = canvas.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    
    context.configure({
        device: device,
        format: canvasFormat,
        alphaMode: 'premultiplied', // 未知
    });

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    // Create a vertex buffer from the cube data.
    const verticesBuffer = device.createBuffer({
        size: cubeVertexArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
    verticesBuffer.unmap();

    
    

    // 创建渲染流水线
    const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: vertex_shader,
      }),
      entryPoint: 'vertex_main',
      buffers: [
        {
          arrayStride: cubeVertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: cubePositionOffset,
              format: 'float32x4',
            },
            {
              // uv
              shaderLocation: 1,
              offset: cubeUVOffset,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: fragment_shader,
      }),
      entryPoint: 'fragment_main',
      targets: [
        {
          format: canvasFormat,
        },
      ],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'back',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    },
  });




    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });


    const uniformBufferSize = 4 * 16; // 4x4 matrix
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });



    const uniformBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: cubeTexture.createView(),
      },
    ],
  });


    
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0
    );


  const modelViewProjectionMatrix = mat4.create();

  function getModelViewProjectionMatrix(deltaTime: number) {
    const camera = cameras[params.type];
    // console.log("current camera type = ", camera);
    const viewMatrix = camera.update(deltaTime, inputHandler());
    mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);
    return modelViewProjectionMatrix as Float32Array;
  }

  let lastFrameMS = Date.now();

  const renderPassDescriptor: GPURenderPassDescriptor = {
    colorAttachments: [
      {
        view: undefined, // Assigned later

        clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
    depthStencilAttachment: {
      view: depthTexture.createView(),

      depthClearValue: 1.0,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    },
  };

    function renderFrame()
    {

        const now = Date.now();
        const deltaTime = (now - lastFrameMS) / 1000;
        lastFrameMS = now;

        const modelViewProjection = getModelViewProjectionMatrix(deltaTime);
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            modelViewProjection.buffer,
            modelViewProjection.byteOffset,
            modelViewProjection.byteLength
        );
        renderPassDescriptor.colorAttachments[0].view = context
        .getCurrentTexture()
        .createView();


        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(pipeline);
        
        pass.setBindGroup(0, uniformBindGroup);
        pass.setVertexBuffer(0, verticesBuffer);
        pass.draw(cubeVertexCount);
        
        pass.end();

        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(renderFrame);
    }
    requestAnimationFrame(renderFrame);

    
    // setInterval(() => {
    //     renderFrame();
    // }, 25);
})



</script>

<style>

</style>
