// Vertex Shader
const vertex_shader = /* wgsl */`

@binding(0) @group(0) var<uniform> mvp : mat4x4<f32>;
@binding(1) @group(0) var<uniform> right : vec3<f32>;
@binding(2) @group(0) var<uniform> up : vec3<f32>;



struct VertexInput {
  @location(0) position : vec4<f32>, // particle position
  @location(1) color : vec4<f32>, // particle color
  @location(2) lifetime : vec4<f32>, // particle life time
  @location(3) quad_pos : vec2<f32>, // -1..+1
  @location(4) quad_uv : vec2<f32>, // 0..+1
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>, // mvp 变换后的粒子空间坐标
  @location(0) color : vec4<f32>, // 不变，原本的粒子颜色直接输出
  @location(1) quad_pos : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv : vec2<f32>, // 0..+1 不变，原样输出
}

@vertex
fn vs_main(in : VertexInput) -> VertexOutput {
  var quad_pos = mat2x3<f32>(right, up) * in.quad_pos;
  // var position = in.position.xyz + quad_pos * 0.125; // 不改变quad大小
  var position = in.position.xyz + quad_pos * (-in.position.z+0.5)*0.05; // 随着z值更改quad大小
  var out : VertexOutput;
  out.position = mvp * vec4<f32>(position, 1.0);
  out.color = in.color;
  out.quad_pos = in.quad_pos;
  out.quad_uv = vec2f(in.quad_uv.x, 1.0-in.quad_uv.y); // 上下翻转，左右不翻转
  return out;
}
`


////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
const fragment_shader = /* wgsl */`


@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var myTexture: texture_2d<f32>;

struct FragIutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) quad_pos : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv : vec2<f32>, // 0..+1 不变，原样输出
}


@fragment
fn fs_main(in : FragIutput) -> @location(0) vec4<f32> {
  var color = in.color;
  
  // return color;
  return textureSample(myTexture, mySampler, in.quad_uv);
}
`


export { vertex_shader, fragment_shader }
