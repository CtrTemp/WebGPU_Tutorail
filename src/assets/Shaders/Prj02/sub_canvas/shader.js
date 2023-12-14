const vertex_shader = /* wgsl */`

struct VertexInput{
    @location(0) position :vec3<f32>
}

struct VertexOutput{
    @builtin(position) position : vec4<f32>, // mvp 变换后的顶点空间坐标
}

@binding(0) @group(0) var<uniform> mvp    : mat4x4<f32>;

@vertex 
fn vertexMain(in : VertexInput) -> VertexOutput {
    var out : VertexOutput;
    out.position = mvp * vec4f(in.position, 1.0); 
    return out;
}
`



const fragment_shader = /* wgsl */`


struct FragIutput {
    @builtin(position) position : vec4<f32>
}


@fragment
fn fragmentMain(in : FragIutput) -> @location(0) vec4f {
    return vec4f(1.0, 0, 0, 0.25);
}
`
export { vertex_shader, fragment_shader }
