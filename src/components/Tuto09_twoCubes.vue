<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Tuto09/shader.js'
import {
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray} from "../assets/Shaders/Tuto09/cube_info.js"

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

    const matrixSize = 4 * 16; // 4*4 的矩阵，每个 float 占用4个字节
    const offset = 256; // 这个的具体含义是什么呢？？？按理说也应该是 64 啊？！
    // uniformBindGroup offset must be 256-byte aligned
    // 如上说明：uniformBindGroup的地址偏移必须是256字节对齐的！这是内置规定，故遵循即可
    const uniformBufferSize = matrixSize + offset; // 4x4 matrix

    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformBindGroup1 = device.createBindGroup({
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [
        {
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: 0,
                size: matrixSize,
            },
        },
        ],
    });

    const uniformBindGroup2 = device.createBindGroup({
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [
        {
            binding: 0,
            resource: {
                buffer: uniformBuffer,
                offset: offset,
                size: matrixSize,
            },
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

    const modelMatrix1 = mat4.translation(vec3.create(-2, 0, 0));
    const modelMatrix2 = mat4.translation(vec3.create(2, 0, 0));
    const modelViewProjectionMatrix1 = mat4.create();
    const modelViewProjectionMatrix2 = mat4.create();
    const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -7));

    const tmpMat41 = mat4.create();
    const tmpMat42 = mat4.create();

    function updateTransformationMatrix() {
        const now = Date.now() / 1000;

        mat4.rotate(
            modelMatrix1,
            vec3.fromValues(Math.sin(now), Math.cos(now), 0),
            1,
            tmpMat41
        );
        mat4.rotate(
            modelMatrix2,
            vec3.fromValues(Math.cos(now), Math.sin(now), 0),
            1,
            tmpMat42
        );

        mat4.multiply(viewMatrix, tmpMat41, modelViewProjectionMatrix1);
        mat4.multiply(
            projectionMatrix,
            modelViewProjectionMatrix1,
            modelViewProjectionMatrix1
        );
        mat4.multiply(viewMatrix, tmpMat42, modelViewProjectionMatrix2);
        mat4.multiply(
            projectionMatrix,
            modelViewProjectionMatrix2,
            modelViewProjectionMatrix2
        );
    }


    function renderFrame()
    {
        updateTransformationMatrix();

        /**
         *  相较于前一个 demo，这里仅仅是使用了不同的 MVP 矩阵（其实也只有 Model 矩阵有变化）
         * 来修饰同一个 Cube，绘制两次得到两个旋转立方体而已。
         * */ 

        device.queue.writeBuffer(
            uniformBuffer,
            0,
            modelViewProjectionMatrix1.buffer,
            modelViewProjectionMatrix1.byteOffset,
            modelViewProjectionMatrix1.byteLength
        );
        device.queue.writeBuffer(
            uniformBuffer,
            offset,
            modelViewProjectionMatrix2.buffer,
            modelViewProjectionMatrix2.byteOffset,
            modelViewProjectionMatrix2.byteLength
        );

        renderPassDescriptor.colorAttachments[0].view = context
        .getCurrentTexture()
        .createView();


        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(cellPipeline);
        pass.setVertexBuffer(0, verticesBuffer);
        // 绘制第一个
        pass.setBindGroup(0, uniformBindGroup1);
        pass.draw(cubeVertexCount);
        // 绘制第二个
        pass.setBindGroup(0, uniformBindGroup2);
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
