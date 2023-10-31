<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';
import { vertex_shader, fragment_shader } from '../assets/Shaders/Tuto08/shader.js'
import { 
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray } from "../assets/Shaders/Tuto08/cube_info.js"

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
    // 从设备端开辟缓冲区用于接收顶点数据
    const verticesBuffer = device.createBuffer({
        size: cubeVertexArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    // 下面这句话应该是等同于使用指令将CPU端数据拷贝到GPU
    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
    verticesBuffer.unmap(); // 但这里为何要 unmap？



    // // 以下写法与以上等同，对比两种写法
    // const verticesBuffer = device.createBuffer({
    //     size: cubeVertexArray.byteLength,
    //     usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    // });
    // device.queue.writeBuffer(verticesBuffer, 0, cubeVertexArray);

    /**
     *  指定在GPU端，位于开辟缓冲区的数据应该以怎样的方式被解析
     * */ 
    const vertexBufferLayout = {
        arrayStride: cubeVertexSize, // 单一数据包总大小（以字节为单位）
        attributes: [ // 每一个数据包内切分的数据单元
            {
                // position
                // 当前数据单元的序号（相对位置第几个，与shader代码中传入参数的location对应一致）
                shaderLocation: 0,
                // 当前数据单元相对于数据包起始地址的字节偏移
                offset: cubePositionOffset, 
                // 对应 vec4，字符串表示的内置数据类型
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


    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code:vertex_shader
            }),
            entryPoint: "main",
            buffers: [ vertexBufferLayout ]
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
            cullMode: 'back', // 背面剔除，我们不需要知道Cube内部的样子，故每个平面背面不需要渲染
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        /**
         *  这里我们必须使能深度剔除，使得绘制时有正确的遮挡关系。配置depthStencil字段默认使能。
         * 与OpenGL/Vulkan一致，看来这里的深度图和模板图也共用一张贴图（？）
         * */ 
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less', // 值更小（说明离屏幕更近）的保留
            format: 'depth24plus', // 16位深度+8位模板
        },
    });


    // 深度贴图
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        // 作为“渲染附件”被使用
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // 全局变量 uniform buffer 相关
    const uniformBufferSize = 4 * 16; // 4x4 matrix
    // 在device端开辟对应区域的内存
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // 对全局变量 uniform buffer 应该以怎样的形式去解析数据
    const uniformBindGroup = device.createBindGroup({
        layout: cellPipeline.getBindGroupLayout(0), // 默认流水线布局
        // entries字段是一个数组，其中的每一个unit都代表一个 uniform buffer
        entries: [
            // 这里我们只使用了一个 uniform buffer 代表 MVP 矩阵
            {
                binding: 0, // 序号从0开始，这个就是0表示第一个
                resource: { // 对应的内存区域
                    buffer: uniformBuffer,
                },
            },
        ],
    });

    /**
     *  渲染管线“描述符”的定义，在 vulkan 中能够找打大量类似于该“描述符”的概念
     * */ 
    const renderPassDescriptor = {
        /**
         *  colorAttachments 字段表示渲染到屏幕区域的附件描述
         * */ 
        colorAttachments: [
            {
                // 渲染得到的图，在运行时定义并更新（这将对应一个texture）
                view: undefined, // Assigned later
                // 理解为背景色
                clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
                // 更新时进行对整块画布的操作
                loadOp: 'clear',
                // 忘记了，，，
                storeOp: 'store',
            },
        ],
        /**
         *  depthStencilAttachment 字段表示深度/模板测试相关的附件描述
         * */ 
        depthStencilAttachment: {
            // 深度图组件对应的 texture，以上我们已经定义完毕
            view: depthTexture.createView(),
            // 深度图默认填充值
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
        // 获取 MVP 矩阵
        const transformationMatrix = getTransformationMatrix();
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            transformationMatrix.buffer,
            transformationMatrix.byteOffset,
            transformationMatrix.byteLength
        );

        /**
         *  之前 renderPassDescriptor 的 colorAttachments 中 view 字段我们暂定的是 undefined
         * 这里渲染循环中，每一帧我们进行更新创建并赋值。
         *  这里只有一个 color attachment 使用当前默认的 texture（每帧会默认创建一个 color 
         * attachment？）进行赋值，创建 View
         * */ 

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

    // 15ms 一帧
    setInterval(() => {
        renderFrame();
    }, 15);
})



</script>

<style>

</style>
