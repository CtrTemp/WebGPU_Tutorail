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

    console.log("vertex shader = ", vertex_shader);
    

    // 创建渲染流水线
    /**
     *  类似于一个定制化的思想，要预先定义好渲染流程，在渲染过程中一般不允许改变管线配置 
     */ 
    const cellPipeline = device.createRenderPipeline({
        // label: "Cell pipeline", // 这里这个加不加的意义是什么
        layout: "auto", // 暂无
        /**
         *  渲染管线第一阶段的配置：vertex shader
         * 只需要以字符串的形式告诉它 shader 文件的代码即可，并且说明 vertex shader 的入口函数。
         * 注意，由于使用的 WGSL ，它不再像 GLSL 那样默认以 main 函数传参，所以该处需要指定入口函数名
         * */ 
        vertex: {
            module: device.createShaderModule({
                code:vertex_shader
            }),
            entryPoint: "main",
            // buffers: [vertexBufferLayout] // 如果在内部写死顶点，则不必要传入该顶点参数
        },
        /**
         *  fragment shader 虽然不是第二个阶段，但却是第二个需要配置的管线流程。
         * 同样以字符串的形式指定代码、主函数入口。
         * */ 
        fragment: {
            module: device.createShaderModule({
                code:fragment_shader
            }),
            entryPoint: "main",
            /**
             *  这里我们对比一下 vertex shader 的配置。vertex shader可能需要配置的是 buffer 字段
             * 用于指示其输入数据类型。而 fragment shader 则不需要。这是由于默认状态下，vertex shader
             * 的输出就是 fragment shader 的输入。这部分对数据类型的定义我们在 shader 代码中说明。
             * 
             *  然而 fragment shader 的输出类型则必须要在这里指定，因为这基本上就是目前这个阶段我们要
             * 显示在屏幕上的东西了。使用targets字段进行定义。
             * */
            targets: [{
                format: canvasFormat // 设置为 canvasFormat 表示我们将直接输出到屏幕上的 canvas容器进行显示
            }]
        },
        primitive: { // 指定面元类型，这里默认是三角形，所以不加也可
            topology: 'triangle-list',
        },
        multisample: { // 指定 MSAA 采样数
            count: sampleCount,
        },
    });

    /**
     *  在device上开辟一块区域作为MSAA采样后得到的texture
     * 指定尺寸、采样数、格式、作用
     * */ 
    const texture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount,
        format: canvasFormat,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    // 对照一下 vulkan 的渲染管线，看看到底这步是在做什么
    const view = texture.createView();


    
    /**
     *  向 GPU 传递指令的接口 （渲染命令）。
     *  注意，这里仅是将指令进行记录，并不会向GPU发送
     * 这里是使用默认颜色清空画布（默认使用黑色清空画布）
     * */ 
    const encoder = device.createCommandEncoder();

    // 开始记录之后将要通过encoder向GPU传递指令
    const pass = encoder.beginRenderPass({
        // 这里是在指定什么？？？
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

    // 只绘制一次，不会重复提交
    device.queue.submit([encoder.finish()]);

})



</script>

<style>

</style>