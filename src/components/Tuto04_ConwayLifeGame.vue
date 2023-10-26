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

    
    // 三角形顶点定义，CPU端
    const vertices = new Float32Array([
        -0.8, -0.8, // Triangle 1 
        0.8, -0.8,
        0.8,  0.8,

        -0.8, -0.8, // Triangle 2 
        0.8,  0.8,
        -0.8,  0.8,
    ]);

    // 三角形顶点容器，GPU端
    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    // 将三角形顶点数据从 CPU 端拷贝到 GPU 端
    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

    // vertex layout on GPU
    const vertexBufferLayout = {
        arrayStride: 8, // 每个顶点数据包占用8字节，float*2
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
    // GPU 端对应的 UBO
    const uniformArray = new Float32Array([GRID_SIZE, GRID_SIZE]);
    const uniformBuffer = device.createBuffer({
        label: "Grid Uniforms",
        size: uniformArray.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // 同样的这一步是 CPU 将数据拷贝到 GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformArray);





    // CPU端用于指示单元格状态的数组，以期望通过动态更新单元格状态来控制绘制
    const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);

    // GPU上创建两个状态缓冲区，通过切换状态来改变显示效果
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

    // Conway 生命游戏的初始化状态填充，这里我们将一定比例的 单元格/细胞 设置为 激活/存活 状态
    for (let i = 0; i < cellStateArray.length; ++i) {
        cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;
    }
    // 将该状态写入第一个状态缓冲区中
    device.queue.writeBuffer(cellStateStorage[0], 0, cellStateArray);

    // 第二个状态缓冲区不需要进行填充



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


    /**
     *  当我们在 GPU shader 端使用全局变量，类似 uniform buffer 或 storage buffer 时，
     * 需要指定“布局”，也就是说其实你是在GPU端开辟了一些Buffer，并通过通信将CPU数据导入到
     * 了该目标区域。但具体shader如何划分这些数据，也就是从内存的哪个位置开始读这部分数据
     * 是未知的，所以以下的“布局”就用于指定这种顺序关系，并强调这些GPU上的内存区域用于什么，
     * 暴露给哪些 shader 阶段。
     * 
     *  在这个阶段，我们主要对内存区域进行一下划分。并且指定各个区域对各个shader的可见性，
     * 并且指定对应区域的类型。
     */ 
    /**
     *  以上我们一共定义了三个变量：一个uniform buffer，两个storage buffer。所以一共三个
     * entries，书写的binding序号代表了我们在shader中声明的三个变量的顺序。
     * */ 
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

    /**
     *  有了以上的区域划分，那么还需要指定各个划分区域的数据源。将之前我们定义在GPU端的buffer
     * 填写到这里即可。
     * */ 
    /**
     *  对于本案例，我们通过切换 bindGroups 来切换更新状态，所以定义了两个bindGroup。将两个
     * storageBuffer的数据源进行调换。得到这两个不同的bindGroup
     */ 
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

    /**
     *  这里指定渲染流水线中使用的“布局”，就是之前GPU开辟内存区域划分的那个布局。
    */
    const pipelineLayout = device.createPipelineLayout({
        label: "Cell Pipeline Layout",
        bindGroupLayouts: [ bindGroupLayout ],
    });

    // 创建渲染流水线！注意！！！这里是渲染管线（后面还有计算管线）
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


    // 创建计算流水线。这里我们的模拟程序比较简单，计算管线和渲染管线使用的是用一个“布局”
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

        // 第一个 pass 先进行 compute shader
        const computePass = encoder.beginComputePass();
        // 选中对应的 pipeline
        computePass.setPipeline(simulationPipeline),
        // 选中对应的 bindGroup 以确定 shader 端声明变量的读取顺序
        computePass.setBindGroup(0, bindGroups[step % 2]);

        // compute shader 提交任务集群划分，已知并行集群大小，已知总任务量，做除法向上取整得到总提交量
        const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE); // 向上取整，提交多少个任务集群
        // 提交计算任务，主要是修改 storage buffer 中的内容
        computePass.dispatchWorkgroups(workgroupCount, workgroupCount);  
        computePass.end();


        // 步进
        step++; // Increment the step count

        // 第二个 pass 根据以上更新好的 storage buffer 进行渲染
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: "clear",
            clearValue: { r: 0, g: 0, b: 0.4, a: 1.0 },
            storeOp: "store",
            }]
        });

        // 指定渲染管线
        pass.setPipeline(cellPipeline);
        // 选择对应的bindGroup（主要是切换storage buffer）
        pass.setBindGroup(0, bindGroups[step % 2]); 
        // 选择 vertex buffer
        pass.setVertexBuffer(0, vertexBuffer);
        // 绘制指令（如果改成除以4，则可以看到只绘制三角形的结果）
        pass.draw(vertices.length / 4, GRID_SIZE * GRID_SIZE);

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