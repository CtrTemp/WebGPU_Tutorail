<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';


// 查看当前浏览器是否支持 WebGPU
if(!navigator.gpu){
    throw new Error("WebGPU not supported on this browser");
}
else{
    console.log("Well done~ your browser can fully support WebGPU");
}
// console.log("webGPU = ", navigator.gpu);

// 当前浏览器是否找到合适的适配器
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}
// console.log("adapter = ", adapter);

// 选中 GPU 设备
const device = await adapter.requestDevice();
// console.log("device = ", device);





// onMounted
const mount_func = onMounted(()=>{
    const canvas = document.querySelector("canvas");

    const context = canvas.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
        device: device,
        format: canvasFormat,
    });

    
    // 定义顶点数据，这将是一个正方形的四个顶点数据，被分成了两个三角形分别存放，目前不使用index buffer
    // 在webGPU中canvas正中心是坐标原点(0,0)
    const vertices = new Float32Array([
        //   X,    Y,
        -0.8, -0.8, // Triangle 1 (Blue)
        0.8, -0.8,
        0.8,  0.8,

        -0.8, -0.8, // Triangle 2 (Red)
        0.8,  0.8,
        -0.8,  0.8,
    ]);


    // 顶点缓冲区创建
    // 这一步与一般图形API就很相近了，旨在GPU上开辟一块内存区域，用于接收CPU传入的预定义数据
    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",  // 目前含义未知
        size: vertices.byteLength,  // 预先定义开辟GPU内存的大小为顶点数据所占内存的大小
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        // unsage字段表示这块区域用于什么，以上指定用于存放顶点数据，并且作为一个Copy操作的dst目标地址
        // 另，个人推测指定usage也方便GPU确定开辟内存的位置在哪里，例如是开辟在Global Memory还是Texture Memory
    });

    // 将顶点数据写入顶点缓冲区中
    // 这里使用直接提交一个指令的方式，将一个指令送入队列
    // 这个单独的指令就是 writeBuffer，意思就是将CPU数据导入GPU
    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

    // 创建顶点布局
    // 传入到GPU的数据仅仅是一个字节流，现在这里你需要为其指定如何划分读取这部分数据
    // 我们传入的是float类型数据，并传入了6个顶点
    // 虽然在 JavaScript 中不会显式的在定义时指定数据类型，但我们操作GPU时必须声明
    const vertexBufferLayout = {
        arrayStride: 8, // 一个float类型是4个字节，这表示每一个单一数据寻址需要跨越的字节段（一个二维坐标是两个float组成）
        attributes: [{
            format: "float32x2", // GPU可以理解的顶点数据类型格式，这里类似于指定其类型为 vec2 
            offset: 0,  // 指定顶点数据与整体数据开始位置的偏移
            shaderLocation: 0, // 等到 vertex shader 章节进行介绍
        }],
    };


    // shader code 创建
    // 注意 webGPU 使用自己的 WGSL 着色器语言
    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        code: `
            // Your shader code will go here
            @vertex // 表示将要编写的 vertex shader 代码
            // 指定输入参数，在偏移量为0的位置取 pos 输入为 vec2f 类型
            fn vertexMain(@location(0) pos: vec2f) -> @builtin(position) vec4f { // -> 后指明返回值类型，这里指定为内置的 vec4f 类型
                return vec4f(pos, 0, 1); // 与 OpenGL 的 GLSL 有着相同的写法 
            }

            // fragment shader 和 vertex shader 的函数可以写在一个里面，这很好
            @fragment
            fn fragmentMain() -> @location(0) vec4f {
                return vec4f(1, 0, 0, 1); // 统一返回红色
            }
        `
    });

    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        vertex: {
            module: cellShaderModule,
            entryPoint: "vertexMain",   // 指定 vertex shader 入口函数
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: "fragmentMain", // 指定 fragment shader 入口函数
            targets: [{
                format: canvasFormat
            }]
        }
    });



    
    /**
     *  向 GPU 传递指令的接口 （渲染命令）。
     *  注意，这里仅是将指令进行记录，并不会像GPU发送
     * 这里是使用默认颜色清空画布（默认使用黑色清空画布）
     * */ 
     const encoder = device.createCommandEncoder();

    // 开始记录之后将要通过encoder向GPU传递指令
    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(), // view 提供纹理
            loadOp: "clear",
            // clearValue: { r: 1, g: 0.2, b: 0, a: 1 }, 
            clearValue: [0, 0.5, 0.7, 1], // 传递数组，效果等同，顺序为RGBA
            storeOp: "store",
        }]
    });

    // 将渲染命令插入整个指令队列
    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.draw(vertices.length / 2); // 6 vertices

    // 结束指令
    pass.end();

    // 

    // const commandBuffer = encoder.finish(); // 在指令编码器上调用finish()，将创建一个GPUCommandBuffer()。
    // device.queue.submit([commandBuffer]); // 通过向命令队列提交这个指令集，来进行你预期的操作
    // 会发现以上的操作与 Vulkan 十分相似。这也的确，因为webGPU底层驱动之一就是Vulkan（当然在Windows平台也可能是D3D）
    // 或者简化成以下的写法
    device.queue.submit([encoder.finish()]);

})





</script>

<style>

</style>