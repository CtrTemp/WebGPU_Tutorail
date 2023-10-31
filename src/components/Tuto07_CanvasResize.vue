<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Tuto07/shader.js'



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



    let renderTarget = undefined;
    let renderTargetView;

    // canvas.classList.add(styles.animatedCanvasSize);


    let step = 0.001;
    const step_range = 200.0;

    const currentWidth = canvas.clientWidth;
    const currentHeight = canvas.clientHeight;

    // 注意看，这里我们是通过修改 canvas 大小的方式来改变渲染的，并没有涉及
    // vulkan 中类似交换链的概念
    function renderFrame()
    {

        if(step>=1.0)
        {
            step = 0.01;
        }

        // The canvas size is animating
        {
            if (renderTarget !== undefined) {
                // Destroy the previous render target
                renderTarget.destroy();
            }

            canvas.width = currentWidth * Math.sin(step*Math.PI);
            canvas.height = currentHeight;

            // console.log("canvas width = ", canvas.width);

            // Resize the multisampled render target to match the new canvas size.
            renderTarget = device.createTexture({
                size: [canvas.width, canvas.height],
                sampleCount,
                format: canvasFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            renderTargetView = renderTarget.createView();
        }
        
        const encoder = device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: renderTargetView,
                resolveTarget: context.getCurrentTexture().createView(),
                loadOp: "clear",
                clearValue: [0, 0.0, 0.0, 1],
                storeOp: "store",
            }]
        });

        pass.setPipeline(cellPipeline);
        pass.draw(3); // 3 vertices
        pass.end();

        device.queue.submit([encoder.finish()]);

        step+=0.01;
    }

    setInterval(renderFrame, 20);
})



</script>

<style>

</style>