// Vertex Shader
const vertex_shader = /* wgsl */`

@binding(0) @group(0) var<uniform> mvp    : mat4x4<f32>;
@binding(1) @group(0) var<uniform> right  : vec3<f32>;
@binding(2) @group(0) var<uniform> up     : vec3<f32>;


@binding(0) @group(2) var<storage> mip    : array<f32>; // 只读


struct atlas_info{
  ready_flag  : f32,
  texture_idx : f32,
  uv_offset   : vec2<f32>,
  uv_aspect   : vec2<f32>,
  uv_size     : vec2<f32>,
};


@binding(0) @group(3) var<storage> atlas : array<atlas_info>;


struct VertexInput {
  @location(0) pic_idx        : f32,        // instance idx
  @location(1) position       : vec4<f32>,  // particle position
  @location(2) pos_offset     : vec4<f32>,  // pos_offset
  @location(3) default_layout : vec4<f32>,  // default layout pos
  @location(4) layout2        : vec4<f32>,
  @location(5) layout3        : vec4<f32>,
  

  @location(6) layout_flag    : f32,        // layout flag
  @location(7) quad_idx       : f32,        // large-quad-idx
  @location(8) uv_offset_d    : vec2<f32>,
  @location(9) uv_aspect_d    : vec2<f32>,
  @location(10) uv_size_d     : vec2<f32>,
  @location(11) quad_pos      : vec2<f32>,  // -1..+1
  @location(12) quad_uv       : vec2<f32>,  // 0..+1
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>, // mvp 变换后的粒子空间坐标
  @location(0) pos_offset     : vec4<f32>, // 不变，pos_offset
  @location(1) quad_pos       : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv        : vec2<f32>, // 0..+1 不变，原样输出
  @location(3) quad_idx       : f32,       // 不变，原样输出
  @location(4) uv_offset      : vec2<f32>, // 不变，原样输出
  @location(5) uv_size        : vec2<f32>, // 不变，原样输出
  @location(6) uv_offset_d    : vec2<f32>, // 不变，原样输出
  @location(7) uv_size_d      : vec2<f32>, // 不变，原样输出
  @location(8) miplevel       : f32,
  @location(9) layout_flag    : f32,
  @location(10) ready_flag    : f32,
  @location(11) texture_idx   : f32,
}

@vertex
fn vs_main(
  @builtin(instance_index) instance_index : u32, 
  in : VertexInput
  ) -> VertexOutput {

  var cur_atlas = atlas[i32(in.pic_idx)];

  var pos_temp = in.quad_pos;
  pos_temp.x = pos_temp.x*in.uv_aspect_d.x;
  pos_temp.y = pos_temp.y*in.uv_aspect_d.y;
  var quad_pos = mat2x3<f32>(right, up) * pos_temp;

  var position = in.position.xyz + in.pos_offset.xyz + quad_pos * 1.0; // 不改变quad大小
  // var position = in.position.xyz + quad_pos * (-in.position.z+0.5)*0.05; // 随着z值更改quad大小
  var out : VertexOutput;
  out.position = mvp * vec4<f32>(position, 1.0);
  out.pos_offset = in.pos_offset;
  out.quad_pos = in.quad_pos;
  out.quad_uv = vec2f(in.quad_uv.x, 1.0-in.quad_uv.y); // 上下翻转，左右不翻转
  out.quad_idx = in.quad_idx;
  out.uv_offset = cur_atlas.uv_offset;
  out.uv_size = cur_atlas.uv_size;
  out.uv_offset_d = in.uv_offset_d;
  out.uv_size_d = in.uv_size_d;
  out.layout_flag = in.layout_flag;

  // out.miplevel = in.miplevel;
  out.miplevel = mip[i32(in.pic_idx)];  // 通过内置变量来得到miplevel的索引
  out.ready_flag = cur_atlas.ready_flag;
  out.texture_idx = cur_atlas.texture_idx;
  return out;
}


@vertex
fn vs_main_quad_frame(
  @builtin(instance_index) instance_index : u32, 
  in : VertexInput
  ) -> VertexOutput {

  var pos_temp = in.quad_pos;
  pos_temp.x = pos_temp.x*in.uv_aspect_d.x;
  pos_temp.y = pos_temp.y*in.uv_aspect_d.y;
  var quad_pos = mat2x3<f32>(right, up) * pos_temp;
  
  // 扩大quad大小，使其变为其外围的一圈
  var position = in.position.xyz + in.pos_offset.xyz + quad_pos * 1.05; 
  // var position = in.position.xyz + quad_pos * (-in.position.z+0.5)*0.05; // 随着z值更改quad大小
  var out : VertexOutput;
  out.position = mvp * vec4<f32>(position, 1.0);
  out.position.z += 0.01; // z 轴后移，防止 z-fighting

  out.pos_offset = in.pos_offset;
  out.quad_pos = in.quad_pos;
  out.quad_uv = vec2f(in.quad_uv.x, 1.0-in.quad_uv.y); // 上下翻转，左右不翻转
  out.quad_idx = in.quad_idx;
  // out.uv_offset = in.uv_offset;
  // out.uv_size = in.uv_size;
  out.uv_offset_d = in.uv_offset_d;
  out.uv_size_d = in.uv_size_d;
  out.layout_flag = in.layout_flag;

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
@group(1) @binding(1) var largeQuad1: texture_2d<f32>;
@group(1) @binding(2) var largeQuad2: texture_2d<f32>;
@group(1) @binding(3) var largeQuad3: texture_2d<f32>;
@group(1) @binding(4) var largeQuad4: texture_2d<f32>;
@group(1) @binding(5) var largeQuad5: texture_2d<f32>;
@group(1) @binding(6) var largeQuad6: texture_2d<f32>;
@group(1) @binding(7) var dynamicFetchQuad_32: texture_2d<f32>;
@group(1) @binding(8) var dynamicFetchQuad_64: texture_2d<f32>;
@group(1) @binding(9) var dynamicFetchQuad_128: texture_2d<f32>;
@group(1) @binding(10) var dynamicFetchQuad_256: texture_2d<f32>;


struct FragIutput {
  @builtin(position) position : vec4<f32>,
  @location(0) pos_offset     : vec4<f32>,
  @location(1) quad_pos       : vec2<f32>, // -1..+1 不变，原样输出
  @location(2) quad_uv        : vec2<f32>, // 0..+1 不变，原样输出
  @location(3) quad_idx       : f32,       // 不变，原样输出
  @location(4) uv_offset      : vec2<f32>, // 不变，原样输出
  @location(5) uv_size        : vec2<f32>, // 不变，原样输出
  @location(6) uv_offset_d    : vec2<f32>, // 不变，原样输出
  @location(7) uv_size_d      : vec2<f32>, // 不变，原样输出
  @location(8) miplevel       : f32,
  @location(9) layout_flag    : f32,
  @location(10) ready_flag    : f32,
  @location(11) texture_idx   : f32,
}





@fragment
fn fs_main(in : FragIutput) -> @location(0) vec4<f32> {


  var target_uv = vec2(in.quad_uv.x*in.uv_size_d.x, in.quad_uv.y*in.uv_size_d.y)+in.uv_offset_d;

  target_uv = select(target_uv, vec2(in.quad_uv.x*in.uv_size.x, in.quad_uv.y*in.uv_size.y)+in.uv_offset, in.ready_flag>0);



  // var void_color_y = vec4(1.0, 1.0, 0.0, 0.2);
  // var void_color_g = vec4(0.0, 1.0, 0.0, 0.2);
  // var void_color_b = vec4(0.0, 0.0, 1.0, 0.2);
  // // var mip0_color = textureSample(myTexture_mip0, mySampler, target_uv);
  // var void_color = select(void_color_y, void_color_g, in.layout_flag>=2.0);
  // void_color = select(void_color, void_color_b, in.layout_flag>=3.0);

  var void_color = in.pos_offset;
  
  var color = select(void_color, textureSample(largeQuad1, mySampler, target_uv), in.uv_offset_d.x>0);
  color = select(color, textureSample(largeQuad2, mySampler, target_uv), in.quad_idx>1);
  color = select(color, textureSample(largeQuad3, mySampler, target_uv), in.quad_idx>2);
  color = select(color, textureSample(largeQuad4, mySampler, target_uv), in.quad_idx>3);
  color = select(color, textureSample(largeQuad5, mySampler, target_uv), in.quad_idx>4);
  color = select(color, textureSample(largeQuad6, mySampler, target_uv), in.quad_idx>5);

  /**
   *  动态更新后的纹理
   * */ 
  color = select(color, textureSample(dynamicFetchQuad_32, mySampler, target_uv), in.ready_flag>0);
  color = select(color, textureSample(dynamicFetchQuad_64, mySampler, target_uv), in.texture_idx>0);
  color = select(color, textureSample(dynamicFetchQuad_128, mySampler, target_uv), in.texture_idx>1);
  color = select(color, textureSample(dynamicFetchQuad_256, mySampler, target_uv), in.texture_idx>2);

  // return vec4(in.miplevel);
  color.w = 1.0; // 完全不透明
  // return vec4(vec3f(in.ready_flag), 1.0);
  return color;
}




@fragment
fn fs_main_quad_frame(in : FragIutput) -> @location(0) vec4<f32> {

  var frame_color = vec4(0.0, 0.0, 0.0, 1.0);

  return frame_color;
}


`


export { vertex_shader, fragment_shader }
