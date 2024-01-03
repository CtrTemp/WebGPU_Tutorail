// Vertex Shader
const instance_vert = /* wgsl */`

@binding(0) @group(0) var<uniform> mvp    : mat4x4<f32>;
@binding(1) @group(0) var<uniform> right  : vec3<f32>;
@binding(2) @group(0) var<uniform> up     : vec3<f32>;


@binding(0) @group(2) var<storage> mip    : array<f32>; // 只读


struct VertexInput {
  @location(0) position     : vec4<f32>,  // particle position
  @location(1) color        : vec4<f32>,  // particle color
  @location(2) lifetime     : f32,        // particle life time
  @location(3) idx          : f32,        // idx for instanced texture
  @location(4) uv_offset    : vec2<f32>,
  @location(5) tex_aspect   : vec2<f32>,
  @location(6) uv_size      : vec2<f32>,
  // @location(7) miplevel     : f32,        // miplevel
  @location(7) quad_pos     : vec2<f32>,  // -1..+1
  @location(8) quad_uv      : vec2<f32>,  // 0..+1
}


struct VertexOutput {
  @builtin(position) position : vec4<f32>, // mvp 变换后的粒子空间坐标
  @location(0) color          : vec4<f32>, // 不变，原本的粒子颜色直接输出
  @location(1) quad_pos       : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv        : vec2<f32>, // 0..+1 不变，原样输出
  @location(3) idx            : f32,       // 不变，原样输出
  @location(4) uv_offset      : vec2<f32>, // 不变，原样输出
  @location(5) uv_size        : vec2<f32>, // 不变，原样输出
  @location(6) miplevel       : f32,
}

@vertex
fn vs_main(
  @builtin(instance_index) instance_index : u32, 
  in : VertexInput) -> VertexOutput {

  // var pos_temp = in.quad_pos;
  // pos_temp.x = pos_temp.x*in.tex_aspect.x;
  // pos_temp.y = pos_temp.y*in.tex_aspect.y;
  var quad_pos = mat2x3<f32>(right, up) * in.quad_pos;

  var position = in.position.xyz + quad_pos * 0.25; // 不改变quad大小
  // var position = in.position.xyz + quad_pos * (-in.position.z+0.5)*0.05; // 随着z值更改quad大小
  var out : VertexOutput;
  out.position = mvp * vec4<f32>(position, 1.0);
  out.color = in.color;
  out.quad_pos = in.quad_pos;
  out.quad_uv = vec2f(in.quad_uv.x, 1.0-in.quad_uv.y); // 上下翻转，左右不翻转
  out.idx = in.idx;
  out.uv_offset = in.uv_offset;
  out.uv_size = in.uv_size;
  // out.miplevel = in.miplevel;b
  out.miplevel = mip[instance_index];  // 通过内置变量来得到miplevel的索引
  return out;
}
`


////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
const instance_frag = /* wgsl */`

@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var myTexture_id1: texture_2d<f32>;
@group(1) @binding(2) var myTexture_id2: texture_2d<f32>;
// @group(1) @binding(3) var myTexture_id3: texture_2d<f32>;
// @group(1) @binding(4) var myTexture_id4: texture_2d<f32>;
// @group(1) @binding(5) var myTexture_id5: texture_2d<f32>;
// @group(1) @binding(6) var myTexture_id6: texture_2d<f32>;
// @group(1) @binding(7) var myTexture_id7: texture_2d<f32>;
// @group(1) @binding(8) var myTexture_id8: texture_2d<f32>;
// @group(1) @binding(9) var myTexture_id9: texture_2d<f32>;

struct FragIutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color          : vec4<f32>,
  @location(1) quad_pos       : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv        : vec2<f32>, // 0..+1 不变，原样输出
  @location(3) idx            : f32,       // 不变，原样输出
  @location(4) uv_offset      : vec2<f32>,
  @location(5) uv_size        : vec2<f32>,
  @location(6) miplevel       : f32,
}



var<private> rand_seed : vec2<f32>;

fn init_rand(invocation_id : u32, seed : vec4<f32>) {
  rand_seed = seed.xz;
  rand_seed = fract(rand_seed * cos(35.456+f32(invocation_id) * seed.yw));
  rand_seed = fract(rand_seed * cos(41.235+f32(invocation_id) * seed.xw));
}

fn rand() -> f32 {
  rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
  rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
  return rand_seed.y;
}



@fragment
fn fs_main(in : FragIutput) -> @location(0) vec4<f32> {
  var mip0_color = vec4f(0.06, 0.56, 0.18, 1.0);
  var mip1_color = vec4f(0.29, 0.64, 0.21, 1.0);
  var mip2_color = vec4f(0.67, 0.78, 0.19, 1.0);
  var mip3_color = vec4f(0.91, 0.88, 0.21, 1.0);
  var mip4_color = vec4f(0.93, 0.75, 0.09, 1.0);
  var mip5_color = vec4f(0.86, 0.45, 0.11, 1.0);
  var mip6_color = vec4f(0.82, 0.30, 0.10, 1.0);
  var mip7_color = vec4f(0.80, 0.15, 0.17, 1.0);
  var miplevel = in.miplevel;

  var color = select(vec4(0.0, 1.0, 0.0, 0.0), mip0_color, in.miplevel>0.0);

  color = select(color, mip1_color, in.miplevel>1.0);
  color = select(color, mip2_color, in.miplevel>2.0);
  color = select(color, mip3_color, in.miplevel>3.0);
  color = select(color, mip4_color, in.miplevel>4.0);
  color = select(color, mip5_color, in.miplevel>5.0);
  color = select(color, mip6_color, in.miplevel>6.0);
  color = select(color, mip7_color, in.miplevel>7.0);
  

  return color;
}
`


export { instance_vert, instance_frag }
