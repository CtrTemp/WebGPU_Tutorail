<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Tuto10/shader.js'
import {
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray} from "../assets/Shaders/Tuto10/cube_info.js"

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

  // Fetch the image and upload it into a GPUTexture.
  let cubeTexture;
    // CPU 端读入图片，并创建bitmap
    const response = await fetch(
      new URL('../assets/logo.png', import.meta.url).toString()
    );
    const imageBitmap = await createImageBitmap(await response.blob());

    // GPU端开辟texture存储区
    cubeTexture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm', // 格式
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT, // 这个字段的真实含义会不会是作为渲染pipeline的附件？
    });
    // 将CPU数据导入到GPU上开辟的texture存储区
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap }, // src
      { texture: cubeTexture }, // dst
      [imageBitmap.width, imageBitmap.height] // size
    );

  // Create a sampler with linear filtering for smooth interpolation.
    //   创建线性插值采样器（MipMap相关？）
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
            // Backface culling since the cube is solid piece of geometry.
            // Faces pointing away from the camera will be occluded by faces
            // pointing toward the camera.
            cullMode: 'back',
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

    /**
     *  这里注意
     * */ 
    const uniformBindGroup = device.createBindGroup({
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [
            // 第一项描述 MVP 矩阵
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            },
            /**
             *   第二项描述采样器？？？这个为何要提前定义并指明呢？在GLSL中是有默认的采样函数的。
             * WGSL中其实也提供对应的采样函数，但需要你定义一个对采样方法的描述。就是这个sampler
             * 
            */
            {
                binding: 1,
                resource: sampler,
            },
            /**
             *  texture 将以 uniform buffer 的形式被传入
             * */
            {
                binding: 2,
                resource: cubeTexture.createView(),
            },
        ],
    });


    const renderPassDescriptor = {
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

    // 宽高比
    const aspect = canvas.width / canvas.height;
    // 投影矩阵P，采用透视投影
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0
    );

    // 模型矩阵M，在这里并不进行修改
    const modelViewProjectionMatrix = mat4.create();

    // 用于生成MVP组合矩阵，看样子这步是放在CPU端做计算
    function getTransformationMatrix() {
        const viewMatrix = mat4.identity();
        mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
        const now = Date.now() / 1000;
        mat4.rotate(
            viewMatrix,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            viewMatrix
        );

        mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

        return modelViewProjectionMatrix;
    }

    function renderFrame()
    {
        const transformationMatrix = getTransformationMatrix();
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            transformationMatrix.buffer,
            transformationMatrix.byteOffset,
            transformationMatrix.byteLength
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
