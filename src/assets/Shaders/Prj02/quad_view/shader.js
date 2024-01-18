// Vertex Shader
const vertex_shader = /* wgsl */`

@binding(0) @group(0) var<uniform> mvp    : mat4x4<f32>;
@binding(1) @group(0) var<uniform> right  : vec3<f32>;
@binding(2) @group(0) var<uniform> up     : vec3<f32>;


@binding(0) @group(2) var<storage> mip    : array<f32>; // 只读


struct VertexInput {
  @location(0) position       : vec4<f32>,  // particle position
  @location(1) pos_offset     : vec4<f32>,  // pos_offset
  @location(2) layout1_pos    : vec4<f32>,  // layout1 pos
  @location(3) layout2_pos    : vec4<f32>,  // layout2 pos

  @location(4) lifetime       : f32,        // 弃用保留
  @location(5) idx            : f32,        // 弃用保留
  @location(6) uv_offset      : vec2<f32>,
  @location(7) tex_aspect     : vec2<f32>,
  @location(8) uv_size        : vec2<f32>,
  @location(9) uv_offset_d    : vec2<f32>,  // default_uv_offset
  @location(10) tex_aspect_d  : vec2<f32>,  // default_uv_scale
  @location(11) uv_size_d     : vec2<f32>,  // default_quad_scale
  @location(12) quad_pos      : vec2<f32>,  // -1..+1
  @location(13) quad_uv       : vec2<f32>,  // 0..+1
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>, // mvp 变换后的粒子空间坐标
  @location(0) pos_offset     : vec4<f32>, // 不变，pos_offset
  @location(1) quad_pos       : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv        : vec2<f32>, // 0..+1 不变，原样输出
  @location(3) idx            : f32,       // 不变，原样输出
  @location(4) uv_offset      : vec2<f32>, // 不变，原样输出
  @location(5) uv_size        : vec2<f32>, // 不变，原样输出
  @location(6) uv_offset_d    : vec2<f32>, // 不变，原样输出
  @location(7) uv_size_d      : vec2<f32>, // 不变，原样输出
  @location(8) miplevel       : f32,
}

@vertex
fn vs_main(
  @builtin(instance_index) instance_index : u32, 
  in : VertexInput
  ) -> VertexOutput {

  var pos_temp = in.quad_pos;
  pos_temp.x = pos_temp.x*in.tex_aspect.x;
  pos_temp.y = pos_temp.y*in.tex_aspect.y;
  var quad_pos = mat2x3<f32>(right, up) * pos_temp;

  var position = in.position.xyz + in.pos_offset.xyz + quad_pos * 1.0; // 不改变quad大小
  // var position = in.position.xyz + quad_pos * (-in.position.z+0.5)*0.05; // 随着z值更改quad大小
  var out : VertexOutput;
  out.position = mvp * vec4<f32>(position, 1.0);
  out.pos_offset = in.pos_offset;
  out.quad_pos = in.quad_pos;
  out.quad_uv = vec2f(in.quad_uv.x, 1.0-in.quad_uv.y); // 上下翻转，左右不翻转
  out.idx = in.idx;
  out.uv_offset = in.uv_offset;
  out.uv_size = in.uv_size;
  out.uv_offset_d = in.uv_offset_d;
  out.uv_size_d = in.uv_size_d;

  // out.miplevel = in.miplevel;
  out.miplevel = mip[instance_index];  // 通过内置变量来得到miplevel的索引
  return out;
}
`


////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
const fragment_shader = /* wgsl */`


@group(1) @binding(0) var mySampler: sampler;
@group(1) @binding(1) var largeQuad1 : texture_2d<f32>;
@group(1) @binding(2) var largeQuad2: texture_2d<f32>;
@group(1) @binding(3) var largeQuad3: texture_2d<f32>;
@group(1) @binding(4) var largeQuad4: texture_2d<f32>;
@group(1) @binding(5) var largeQuad5: texture_2d<f32>;
@group(1) @binding(6) var largeQuad6: texture_2d<f32>;


struct FragIutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color          : vec4<f32>,
  @location(1) quad_pos       : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv        : vec2<f32>, // 0..+1 不变，原样输出
  @location(3) idx            : f32,       // 不变，原样输出
  @location(4) uv_offset      : vec2<f32>, // 不变，原样输出
  @location(5) uv_size        : vec2<f32>, // 不变，原样输出
  @location(6) uv_offset_d    : vec2<f32>, // 不变，原样输出
  @location(7) uv_size_d      : vec2<f32>, // 不变，原样输出
  @location(8) miplevel       : f32,
}





@fragment
fn fs_main(in : FragIutput) -> @location(0) vec4<f32> {


  var target_uv = vec2(in.quad_uv.x*in.uv_size_d.x, in.quad_uv.y*in.uv_size_d.y);
  target_uv = target_uv+in.uv_offset_d;

  var void_color = vec4(1.0, 1.0, 0.0, 0.2);
  // var mip0_color = textureSample(myTexture_mip0, mySampler, target_uv);
  
  var color = select(void_color, textureSample(largeQuad1, mySampler, target_uv), in.uv_offset_d.x>0);
  // color = select(color, mip1_color, in.miplevel>=1.0);
  // color = select(color, mip2_color, in.miplevel>=2.0);
  // color = select(color, mip3_color, in.miplevel>=3.0);
  // color = select(color, mip4_color, in.miplevel>=4.0);
  // color = select(color, mip5_color, in.miplevel>=5.0);
  // color = select(color, mip6_color, in.miplevel>=6.0);
  // color = select(color, mip7_color, in.miplevel>=7.0);
  // color = select(color, mip8_color, in.miplevel>=8.0);
  // color = select(color, mip9_color, in.miplevel>=9.0);
  // color = select(color, mip10_color, in.miplevel>=10.0);
  // color = select(color, mip11_color, in.miplevel>=11.0);
  // color = select(color, mip12_color, in.miplevel>=12.0);
  
  
  // color = textureSample(myTexture_id1, mySampler, target_uv);
  // color = select(color, vec4(0.0, 1.0, 0.0, 1.0), in.miplevel<0.0);

  
  // // 解除下面这句注释，用于查看当前大纹理中所存放的所有图片
  // color = textureSample(myTexture_mip7, mySampler, in.quad_uv);

  // return vec4(in.miplevel);
  return color;
}
`


export { vertex_shader, fragment_shader }
