<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Tuto14/shader.js'
import {
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray} from "../assets/Shaders/Tuto14/cube_info.js"

import {mat4, vec3} from "wgpu-matrix"

// 查看当前浏览器是否支持 WebGPU
if(!navigator.gpu){
    throw new Error("WebGPU not supported on this browser");
}
else{
    console.log("Well done~ your browser can fully support WebGPU");
}

// 当前浏览器是否找到合适的适配器
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

// 选中 GPU 设备
const device = await adapter.requestDevice();


let cubemapTexture;
  {
    // The order of the array layers is [+X, -X, +Y, -Y, +Z, -Z]
    const imgSrcs = [
      new URL(
        `../assets/img/cubemap/posx.jpg`,
        import.meta.url
      ).toString(),
      new URL(
        `../assets/img/cubemap/negx.jpg`,
        import.meta.url
      ).toString(),
      new URL(
        `../assets/img/cubemap/posy.jpg`,
        import.meta.url
      ).toString(),
      new URL(
        `../assets/img/cubemap/negy.jpg`,
        import.meta.url
      ).toString(),
      new URL(
        `../assets/img/cubemap/posz.jpg`,
        import.meta.url
      ).toString(),
      new URL(
        `../assets/img/cubemap/negz.jpg`,
        import.meta.url
      ).toString(),
    ];
    const promises = imgSrcs.map(async (src) => {
      const response = await fetch(src);
      return createImageBitmap(await response.blob());
    });
    const imageBitmaps = await Promise.all(promises);

      // 与一般 texture 创建略有不同，
    cubemapTexture = device.createTexture({
      dimension: '2d', // 这里创建的是 2d texture
      // Create a 2d array texture.
      // Assume each image has the same size.
      // 可以看到这里我们导入了 6 张 texture，且每个 texture 的 size 是相同的
      size: [imageBitmaps[0].width, imageBitmaps[0].height, 6],
      // 下面这些均一致
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // 为每个device端的texture导入CPU端读入的数据
    for (let i = 0; i < imageBitmaps.length; i++) {
      const imageBitmap = imageBitmaps[i];
      device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: cubemapTexture, origin: [0, 0, i] },
        [imageBitmap.width, imageBitmap.height]
      );
    }
  }


// onMounted
const mount_func = onMounted(()=>{
    const canvas = document.querySelector("canvas");

    const context = canvas.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    
    context.configure({
        device: device,
        format: canvasFormat,
        // Specify we want both RENDER_ATTACHMENT and COPY_SRC since we
        // will copy out of the swapchain texture.
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        alphaMode: 'premultiplied',
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
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code:vertex_shader
            }),
            entryPoint: "main",
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
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({
                code:fragment_shader
            }),
            entryPoint: "main",
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: { // 指定面元类型，这里默认是三角形，所以不加也可
            topology: 'triangle-list',
            // Since we are seeing from inside of the cube
            // and we are using the regular cube geomtry data with outward-facing normals,
            // the cullMode should be 'front' or 'none'.
            // 注意这里，我们相当于是在 cube 内部向外看天空盒，故应该剔除的就不能是背面
            // 所以这里选择的应该是不剔除（none）或剔除正面（front）
            cullMode: 'front',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
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


    // Create a sampler with linear filtering for smooth interpolation.
    // 对于 cubeMap 同样使用该方法定义 sampler
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    const uniformBindGroup = device.createBindGroup({
    layout: cellPipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
          offset: 0,
          size: uniformBufferSize,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        // cubeTexture被视为一个整体，这点与OpenGL是基本一致的
        resource: cubemapTexture.createView({
          dimension: 'cube', // 这里声明它是一个 cubeTexture
        }),
      },
    ],
  });

  const renderPassDescriptor = {
    colorAttachments: [
      {
        view: undefined, // Assigned later
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

  

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspect, 1, 3000);

  const modelMatrix = mat4.scaling(vec3.fromValues(1000, 1000, 1000));
  const modelViewProjectionMatrix = mat4.create();
  const viewMatrix = mat4.identity();

  const tmpMat4 = mat4.create();

  // Compute camera movement:
  // It rotates around Y axis with a slight pitch movement.
  function updateTransformationMatrix() {
    const now = Date.now() / 800;

    mat4.rotate(
      viewMatrix,
      vec3.fromValues(1, 0, 0),
      (Math.PI / 10) * Math.sin(now),
      tmpMat4
    );
    mat4.rotate(tmpMat4, vec3.fromValues(0, 1, 0), now * 0.2, tmpMat4);

    mat4.multiply(tmpMat4, modelMatrix, modelViewProjectionMatrix);
    mat4.multiply(
      projectionMatrix,
      modelViewProjectionMatrix,
      modelViewProjectionMatrix
    );
  }


    function renderFrame()
    {
        updateTransformationMatrix();
        device.queue.writeBuffer(
        uniformBuffer,
        0,
        modelViewProjectionMatrix.buffer,
        modelViewProjectionMatrix.byteOffset,
        modelViewProjectionMatrix.byteLength
        );

        renderPassDescriptor.colorAttachments[0].view = context
        .getCurrentTexture()
        .createView();
        

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(cellPipeline);
        
        pass.setBindGroup(0, uniformBindGroup);
        pass.setVertexBuffer(0, verticesBuffer);
        pass.draw(cubeVertexCount);

        pass.end();
        
        
        device.queue.submit([encoder.finish()]);
    }

    
    setInterval(() => {
        renderFrame();
    }, 15);
})



</script>

<style>

</style>
