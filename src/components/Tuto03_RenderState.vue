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

// 按照时间更新的序号
const UPDATE_INTERVAL = 500; // Update every 200ms (5 times/sec)
let step = 0; // Track how many simulation steps have been run

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
    const GRID_SIZE = 32;

    // 在 CPU 端创建 uniform buffer 作为全局变量传参，这里我们将定义网格大小.
    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // 同样的这一步是 CPU 将数据拷贝到 GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);





    // 创建针对单元格状态的缓冲区，以期望通过动态更新单元格状态来控制绘制
    const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);

    // Create two storage buffers to hold the cell state.
    const cellStateStorage = [
    device.createBuffer({
        label: "Cell State A",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }),
    device.createBuffer({
        label: "Cell State B",
        size: cellStateArray.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    })
    ];

    // CPU 端初始化填充数据，这里每三个单元格激活一个（其余在定义时，默认为0填充）
    // Mark every third cell of the first grid as active.
    for (let i = 0; i < cellStateArray.length; i+=3) {
    cellStateArray[i] = 1;
    }
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    // Mark every other cell of the second grid as active.
    for (let i = 0; i < cellStateArray.length; i++) {
    cellStateArray[i] = i % 2;
    }
    // 导入数据到GPU
    device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);







    // shader code 创建
    // 注意 webGPU 使用自己的 WGSL 着色器语言
    const cellShaderModule = device.createShaderModule({
        label: "Cell shader",
        code: `

            // 自定义 shader 输入输出
            struct VertInput {
                @location(0) pos: vec2f,
                @builtin(instance_index) instance: u32,
            };
            struct VertOutput {
                @builtin(position) pos: vec4f,
                @location(0) cell: vec2f, // 传入到 fragment shader 中的部分
            };

            struct FragInput {
                @location(0) cell: vec2f,
            };

            // uniform buffer 全局变量
            @group(0) @binding(0) var<uniform> grid: vec2f;

            // storage 也可以作为全局变量来看待么？和 uniform 不同点在于啥？
            @group(0) @binding(1) var<storage> cellState: array<u32>;


            @vertex 
            fn vertexMain(input: VertInput) -> VertOutput  {

                let i = f32(input.instance); 
                let row = floor(i/grid.x);
                let col = i%grid.x;

                let state = f32(cellState[input.instance]);
                

                let cell = vec2f(col, row);
                let cellOffset = 2 * cell / grid; // Compute the offset to cell
                let gridPos = (input.pos*state + 1) / grid - 1 + cellOffset;

                var output: VertOutput;
                output.pos = vec4f(gridPos, 0, 1);
                output.cell = vec2f(col, row);

                return output;
            }


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
    const bindGroups = [
        device.createBindGroup({
            label: "Cell renderer bind group A",
            layout: cellPipeline.getBindGroupLayout(0),
            entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
            }, {
            binding: 1,
            resource: { buffer: cellStateStorage[0] }
            }],
        }),
        device.createBindGroup({
            label: "Cell renderer bind group B",
            layout: cellPipeline.getBindGroupLayout(0),
            entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer }
            }, {
            binding: 1,
            resource: { buffer: cellStateStorage[1] }
            }],
        })
    ];

    
    // /**
    //  *  向 GPU 传递指令的接口 （渲染命令）。
    //  *  注意，这里仅是将指令进行记录，并不会像GPU发送
    //  * 这里是使用默认颜色清空画布（默认使用黑色清空画布）
    //  * */ 
    //  const encoder = device.createCommandEncoder();

    // // 开始记录之后将要通过encoder向GPU传递指令
    // const pass = encoder.beginRenderPass({
    //     colorAttachments: [{
    //         view: context.getCurrentTexture().createView(), // view 提供纹理
    //         loadOp: "clear",
    //         clearValue: [0, 0.0, 0.0, 1],
    //         storeOp: "store",
    //     }]
    // });

    // // 将渲染命令插入整个指令队列
    // pass.setPipeline(cellPipeline);
    // pass.setVertexBuffer(0, vertexBuffer);
    // pass.setBindGroup(0, bindGroup); // 创建对应的映射关系
    // // pass.draw(vertices.length / 2); // 6 vertices
    // // 第二个参数告知我们要重复执行绘制多少次
    // pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE); // 6 vertices

    // // 结束指令
    // pass.end();


    // const commandBuffer = encoder.finish(); // 在指令编码器上调用finish()，将创建一个GPUCommandBuffer()。
    // device.queue.submit([commandBuffer]); // 通过向命令队列提交这个指令集，来进行你预期的操作


    // Move all of our rendering code into a function
    function updateGrid() {
        step++; // Increment the step count

        // Start a render pass
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
            storeOp: "store",
            }]
        });

        // Draw the grid.
        pass.setPipeline(cellPipeline);
        pass.setBindGroup(0, bindGroups[step % 2]); // Updated!
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

        // End the render pass and submit the command buffer
        pass.end();
        device.queue.submit([encoder.finish()]);
    }

    // Schedule updateGrid() to run repeatedly
    setInterval(updateGrid, UPDATE_INTERVAL);
})





</script>

<style>

</style>