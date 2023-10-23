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
const UPDATE_INTERVAL = 50; // Update every 200ms (5 times/sec)
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
    const GRID_SIZE = 128;

    // ?? 计算着色器工作组大小？？类似于CUDA中对Grid中Block Size的设置
    // 只不过CUDA中分了两层，即Grid Size，和Block Size，然而这里仅抽象为了一层
    const WORKGROUP_SIZE = 8;

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

    // // CPU 端初始化填充数据，这里每三个单元格激活一个（其余在定义时，默认为0填充）
    // // Mark every third cell of the first grid as active.
    // for (let i = 0; i < cellStateArray.length; i+=3) {
    //     cellStateArray[i] = 1;
    // }

    // Conway 生命游戏将最开始的状态完全随机生成
    // 这里随机填充区域内 40% 的区域
    for (let i = 0; i < cellStateArray.length; ++i) {
        cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
    }
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    // Mark every other cell of the second grid as active.
    for (let i = 0; i < cellStateArray.length; i++) {
        cellStateArray[i] = i % 2;
    }
    // 导入数据到GPU
    device.queue.writeBuffer(cellStateStorage[1], 0, cellStateArray);



    // 创建计算着色器 compute shader
    const simulationShaderModule = device.createShaderModule({
        label: "Game of Life simulation shader",
        code: `

            // 计算着色器中也可以使用 uniform buffer，且只需在此声明即可（之前你已经导入到GPU一次就足够了
            @group(0) @binding(0) var<uniform> grid: vec2f;
            
            // 乒乓模式，用于更新状态缓冲区
            @group(0) @binding(1) var<storage> cellStateIn: array<u32>;  // 只读
            @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>; // 读+写

            // New function
            // 目前没理解啥意思
            fn cellIndex(cell: vec2u) -> u32 {
                // return cell.y * u32(grid.x) + cell.x;
                return (cell.y % u32(grid.y)) * u32(grid.x) + (cell.x % u32(grid.x)); // 支持场景环绕
            }

            // 返回当前cell是否处于激活态
            fn cellActive(x: u32, y: u32) -> u32 {
                return cellStateIn[cellIndex(vec2(x, y))];
            }

            @compute
            // 这里就类似于书写 CUDA 核函数的调用了，这里将一次任务募集的Grid设为8*8*1
            // 一次调集64个并行计算单元提交任务
            // 虽然我们不清楚目前的GPU硬件情况，但对于现代GPU来说 64 是一个不大可能超出任何硬件限制的数值
            @workgroup_size(${WORKGROUP_SIZE}, ${WORKGROUP_SIZE})
            // 传入内置变量 global_invocation_id 你可以将其理解为 CUDA 中使用 gridSize、threadId等内置
            // 变量计算得到的当前线程id
            fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
                // // New lines. Flip the cell state every step.
                // // 当前是激活态则下一次是关闭态，当前是关闭态则下一次是激活态，我们先来做这样一个测试~
                // // 当然这还不是真正的康威生命游戏
                // if (cellStateIn[cellIndex(cell.xy)] == 1) {
                //     cellStateOut[cellIndex(cell.xy)] = 0; // 注意到这里的写法和GLSL中的语法相同
                // } else {
                //     cellStateOut[cellIndex(cell.xy)] = 1;
                // }

                // real Conway Life Game
                // 函数询问周围八个细胞的活跃状态
                let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                        cellActive(cell.x+1, cell.y) +
                        cellActive(cell.x+1, cell.y-1) +
                        cellActive(cell.x, cell.y-1) +
                        cellActive(cell.x-1, cell.y-1) +
                        cellActive(cell.x-1, cell.y) +
                        cellActive(cell.x-1, cell.y+1) +
                        cellActive(cell.x, cell.y+1);

                        let i = cellIndex(cell.xy);

                // 游戏规则
                // 周围有两个存活，则保持原来状态
                // 周围有三个存活，则无论当前是否为激活状态，都变为激活状态
                // 其余情况均变为休眠/死亡状态
                switch activeNeighbors {
                    case 2: { // Active cells with 2 neighbors stay active.
                        cellStateOut[i] = cellStateIn[i];
                    }
                    case 3: { // Cells with 3 neighbors become or stay active.
                        cellStateOut[i] = 1;
                    }
                    default: { // Cells with < 2 or > 3 neighbors become inactive.
                        cellStateOut[i] = 0;
                    }
                }
            }`
    });



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


    // Create the bind group layout and pipeline layout.
    const bindGroupLayout = device.createBindGroupLayout({
        label: "Cell Bind Group Layout",
        entries: [{
            binding: 0,
            // visibility 字段指明哪些着色器阶段可以使用该资源
            // 当然我们也可以让这些资源对 fragment shader 也可见，但这没必要
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: {} // 不填写 type 字段则默认为 uniform buffer
        }, {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
            buffer: { type: "read-only-storage"} // Cell state input buffer
        }, {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: { type: "storage"} // Cell state output buffer
        }]
    });

    // 创建一个映射关系，将GPU特定区域指定为 uniform buffer 的读取位置
    // Create a bind group to pass the grid uniforms into the pipeline
    const bindGroups = [
        device.createBindGroup({
            label: "Cell renderer bind group A",
            layout: bindGroupLayout, // Updated Line 之前我们使用的是auto但现在不行了
            // 这是因为之前仅有一条管线，而现在有两条资源共享的管线，这使得我们必须明确创建布局
            entries: [{
                binding: 0,
                resource: { buffer: uniformBuffer }
            }, {
                binding: 1,
                resource: { buffer: cellStateStorage[0] }
            }, {
                binding: 2, // New Entry
                resource: { buffer: cellStateStorage[1] }
            }],
        }),
        device.createBindGroup({
            label: "Cell renderer bind group B",
            layout: bindGroupLayout, // Updated Line

            entries: [{
                binding: 0,
                resource: { buffer: uniformBuffer }
            }, {
                binding: 1,
                resource: { buffer: cellStateStorage[1] }
            }, {
                binding: 2, // New Entry
                resource: { buffer: cellStateStorage[0] }
            }],
        }),
    ];

    // 从这里起，我们应该是要有两条流水线了？？？
    // 一条是基本的渲染管线，另一条是compute shader？
    const pipelineLayout = device.createPipelineLayout({
        label: "Cell Pipeline Layout",
        bindGroupLayouts: [ bindGroupLayout ],
    });

    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: pipelineLayout,
        vertex: {
            module: cellShaderModule,
            entryPoint: "vertexMain",
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: "fragmentMain",
            targets: [{
            format: canvasFormat
            }]
        }
    });


    // 创建计算流水线
    const simulationPipeline = device.createComputePipeline({
        label: "Simulation pipeline",
        layout: pipelineLayout,
        compute: {
            module: simulationShaderModule,
            entryPoint: "computeMain",
        }
    });


    // Move all of our rendering code into a function
    function updateGrid() {

        // Start a render pass
        const encoder = device.createCommandEncoder();

        // 注意一点！！！这里需要使用同一个 encoder~ 不需要另外为 compute shader 创建新的 encoder
        // const computeEncoder = device.createCommandEncoder();


        const computePass = encoder.beginComputePass();
        // New lines
        computePass.setPipeline(simulationPipeline),
        computePass.setBindGroup(0, bindGroups[step % 2]);

        // New lines
        const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE); // 向上取整，提交多少个任务集群
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);  // 提交计算任务
        computePass.end();



        step++; // Increment the step count


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
        // 关键点在这里，每次更新将会根据当前的时间步step切换绑定的 storage buffer，从而改变渲染效果
        pass.setBindGroup(0, bindGroups[step % 2]); 
        pass.setVertexBuffer(0, vertexBuffer);
        pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

        // End the render pass and submit the command buffer
        pass.end();
        device.queue.submit([encoder.finish()]);
    }

    // 每间隔一定的时间区段就渲染一次
    setInterval(updateGrid, UPDATE_INTERVAL);


})





</script>

<style>

</style>