<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Tuto06/shader.js'




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

    console.log("devicePixelRatio = ", devicePixelRatio);


    // MSAA 采样数
    const sampleCount = 4;
    

    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        // label: "Cell pipeline", // 这里这个加不加的意义是什么
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code:vertex_shader
            }),
            entryPoint: "main",
            // buffers: [vertexBufferLayout] // 如果在内部写死顶点，则不必要传入该顶点参数
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
        },
        multisample: { // 指定 MSAA 采样数
            count: sampleCount,
        },
    });


    const texture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount,
        format: canvasFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const view = texture.createView();


    
    /**
     *  向 GPU 传递指令的接口 （渲染命令）。
     *  注意，这里仅是将指令进行记录，并不会像GPU发送
     * 这里是使用默认颜色清空画布（默认使用黑色清空画布）
     * */ 
    const encoder = device.createCommandEncoder();

    // 开始记录之后将要通过encoder向GPU传递指令
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: view,
            resolveTarget: context.getCurrentTexture().createView(),
            // view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: [0, 0.0, 0.0, 1],
            storeOp: "store",
        }]
    });

    // 将渲染命令插入整个指令队列
    pass.setPipeline(cellPipeline);
    // pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(3); // 3 vertices

    // 结束指令
    pass.end();

    device.queue.submit([encoder.finish()]);

})



</script>

<style>

</style>