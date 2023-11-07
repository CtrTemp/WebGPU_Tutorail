// Vertex Shader
const vertex_shader = /* wgsl */`

@binding(0) @group(0) var<uniform> mvp : mat4x4<f32>;

struct VertexInput {
  @location(0) position : vec3<f32>, // particle position
  @location(1) color : vec3<f32>, // particle color
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>, // mvp 变换后的粒子空间坐标
  @location(0) color : vec3<f32>, // 不变，原本的粒子颜色直接输出
}

@vertex
fn vs_main(in : VertexInput) -> VertexOutput {
  // var quad_pos = mat2x3<f32>(render_params.right, render_params.up) * in.quad_pos;
  // var position = in.position + quad_pos * 0.01;
  var position = in.position;
  var out : VertexOutput;
  // out.position = mvp * vec4<f32>(position, 1.0);
  out.position = vec4f(position.x, position.y, 0.0, 1.0);
  out.color = in.color;
  return out;
}
`


////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
const fragment_shader = /* wgsl */`

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec3<f32>,
}


@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  var color = in.color;
  return vec4(color, 1.0);
}
`


export{ vertex_shader, fragment_shader }
