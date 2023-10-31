<!-- 这个小节的 demo 没太搞明白，，， -->

<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Tuto12/shader.js'
import {
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray} from "../assets/Shaders/Tuto12/cube_info.js"

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

    // We will copy the frame's rendering results into this texture and
    // sample it on the next frame.
    /**
     *  这部分我们使用分形技术来做纹理采样
     * */ 
    const cubeTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: canvasFormat,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });

    // Create a sampler with linear filtering for smooth interpolation.
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


    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0
    );


    const modelViewProjectionMatrix = mat4.create();

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
            transformationMatrix.byteLength);
        
        // 将当前渲染的出图作为被采样的texture
        const swapChainTexture = context.getCurrentTexture();
        // prettier-ignore （更加美丽的无视？）
        renderPassDescriptor.colorAttachments[0].view = swapChainTexture.createView();

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(cellPipeline);
        
        pass.setBindGroup(0, uniformBindGroup);
        pass.setVertexBuffer(0, verticesBuffer);
        pass.draw(cubeVertexCount);

        pass.end();
        
        // Copy the rendering results from the swapchain into |cubeTexture|.
        encoder.copyTextureToTexture(
            {
                texture: swapChainTexture,
            },
            {
                texture: cubeTexture,
            },
            [canvas.width, canvas.height]
        );
        
        device.queue.submit([encoder.finish()]);
    }

    
    setInterval(() => {
        renderFrame();
    }, 15);
})



</script>

<style>

</style>
