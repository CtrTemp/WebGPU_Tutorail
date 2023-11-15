const vertex_shader = /* wgsl */`

// 自定义 shader 输入输出
struct VertInput {
    @location(0) pos: vec2f,
    @builtin(instance_index) instance: u32,
};
struct VertOutput {
    @builtin(position) pos: vec4f,
    @location(0) cell: vec2f, // 传入到 fragment shader 中的部分
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

`

const fragment_shader = /* wgsl */`

// uniform buffer 全局变量
@group(0) @binding(0) var<uniform> grid: vec2f;

// storage 也可以作为全局变量来看待么？和 uniform 不同点在于啥？
@group(0) @binding(1) var<storage> cellState: array<u32>;

struct FragInput {
    @location(0) cell: vec2f,
};


@fragment
fn fragmentMain(input : FragInput) -> @location(0) vec4f {
    let local_cell = input.cell/grid;
    return vec4f(local_cell, 1-local_cell.x, 1);
}
`


export{ vertex_shader, fragment_shader }
