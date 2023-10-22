<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup>

import { onMounted } from 'vue';


// init and check vaild
if(!navigator.gpu){
    throw new Error("WebGPU not supported on this browser");
}

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

const device = await adapter.requestDevice();


// onMounted
const mount_func = onMounted(()=>{
    const canvas = document.querySelector("canvas");

    const context = canvas.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
        device: device,
        format: canvasFormat,
    });

    
    // init vertices
    const vertices = new Float32Array([
        //   X,    Y,
        -0.8, -0.8, // Triangle 1 (Blue)
        0.8, -0.8,
        0.8,  0.8,

        -0.8, -0.8, // Triangle 2 (Red)
        0.8,  0.8,
        -0.8,  0.8,
    ]);


    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

    // vertex layout on GPU
    const vertexBufferLayout = {
        arrayStride: 8, 
        attributes: [{
            format: "float32x2",
            offset: 0, 
            shaderLocation: 0, 
        }],
    };




    
    // 准备开始绘制网格
    const GRID_SIZE = 64;

    // 在 CPU 端创建 uniform buffer 作为全局变量传参，这里我们将定义网格大小.
    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // 同样的这一步是 CPU 将数据拷贝到 GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);


    // shader code 创建
    // 注意 webGPU 使用自己的 WGSL 着色器语言
    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        code: `
            // 我们也可以自定义数据结构使得代码变得更清晰
            // 注意写法：先写变量名，冒号后面是变量的类型
            struct VertexInput {
                @location(0) pos: vec2f,
                @builtin(instance_index) instance: u32,
            };
            struct VertexOutput {
                @builtin(position) pos: vec4f,
                @location(0) cell: vec2f, // 传入到 fragment shader 中的部分
            };

            struct FragInput {
                @location(0) cell: vec2f,
            };


            // 注意，这里引入 uniform buffer 作为从 CPU 引入的全局变量
            // 发现相较于 GLSL 的一个好处就是，它是真的在“全局声明”，即函数外声明，
            // 这样就全局可用了，无论 fragment shader 还是 vertex shader 都可以方便使用
            @group(0) @binding(0) var<uniform> grid: vec2f;

            @vertex 
            // 访问内置变量 instance_index ，这是绘制的第多少个实例，也就是第几次 draw call么
            // fn vertexMain(@location(0) pos: vec2f, @builtin(instance_index) instance: u32) -> @builtin(position) vec4f {
            
            // 可以换成以下写法（自定义数据结构写法）
            fn vertexMain(input: VertexInput) -> VertexOutput  {
                // // Add 1 to the position before dividing by the grid size.
                // let gridPos = (pos + 1) / grid - 1; // WGSL语法与 JavaScript 更加类似

                let i = f32(input.instance); 
                let row = floor(i/grid.x);
                let col = i%grid.x;
                

                let cell = vec2f(col, row); // Cell(1,1) in the image above
                // 注意WebGPU定义的canvas横纵都是跨两个单位长度，所以以下要乘以2
                let cellOffset = 2 * cell / grid; // Compute the offset to cell
                let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
                var output: VertexOutput;
                output.pos = vec4f(gridPos, 0, 1);
                output.cell = vec2f(col, row);
                return output;
            }

            // fragment shader 不知道当前正在渲染那个单元格，这需要从 vertex shader 传入
            @fragment
            fn fragmentMain(input : FragInput) -> @location(0) vec4f {
                let local_cell = input.cell/grid;
                return vec4f(local_cell, 1-local_cell.x, 1);
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



    // 创建一个映射关系，将GPU特定区域指定为 uniform buffer 的读取位置
    const bindGroup = device.createBindGroup({
        label: "Cell renderer bind group",
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [{
            binding: 0, // 与着色器代码中的 binding 值相对应
            resource: { buffer: uniformBuffer } // 绑定的数据源
        }],
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
            // clearValue: [0, 0.5, 0.7, 1], // 传递数组，效果等同，顺序为RGBA
            clearValue: [0, 0.0, 0.0, 1],
            storeOp: "store",
        }]
    });

    // 将渲染命令插入整个指令队列
    pass.setPipeline(cellPipeline);
    pass.setVertexBuffer(0, vertexBuffer);
    pass.setBindGroup(0, bindGroup); // 创建对应的映射关系
    // pass.draw(vertices.length / 2); // 6 vertices
    // 第二个参数告知我们要重复执行绘制多少次
    pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE); // 6 vertices

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