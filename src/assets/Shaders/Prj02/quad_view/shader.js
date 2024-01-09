// Vertex Shader
const vertex_shader = /* wgsl */`

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
  in : VertexInput
  ) -> VertexOutput {

  var pos_temp = in.quad_pos;
  pos_temp.x = pos_temp.x*in.tex_aspect.x;
  pos_temp.y = pos_temp.y*in.tex_aspect.y;
  var quad_pos = mat2x3<f32>(right, up) * pos_temp;

  var position = in.position.xyz + quad_pos * 1.0; // 不改变quad大小
  // var position = in.position.xyz + quad_pos * (-in.position.z+0.5)*0.05; // 随着z值更改quad大小
  var out : VertexOutput;
  out.position = mvp * vec4<f32>(position, 1.0);
  out.color = in.color;
  out.quad_pos = in.quad_pos;
  out.quad_uv = vec2f(in.quad_uv.x, 1.0-in.quad_uv.y); // 上下翻转，左右不翻转
  out.idx = in.idx;
  out.uv_offset = in.uv_offset;
  out.uv_size = in.uv_size;
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
@group(1) @binding(1) var myTexture_mip0: texture_2d<f32>;
@group(1) @binding(2) var myTexture_mip1: texture_2d<f32>;
@group(1) @binding(3) var myTexture_mip2: texture_2d<f32>;
@group(1) @binding(4) var myTexture_mip3: texture_2d<f32>;
@group(1) @binding(5) var myTexture_mip4: texture_2d<f32>;
@group(1) @binding(6) var myTexture_mip5: texture_2d<f32>;
@group(1) @binding(7) var myTexture_mip6: texture_2d<f32>;
@group(1) @binding(8) var myTexture_mip7: texture_2d<f32>;
@group(1) @binding(9) var myTexture_mip8: texture_2d<f32>;
@group(1) @binding(10) var myTexture_mip9: texture_2d<f32>;
@group(1) @binding(11) var myTexture_mip10: texture_2d<f32>;
@group(1) @binding(12) var myTexture_mip11: texture_2d<f32>;
@group(1) @binding(13) var myTexture_mip12: texture_2d<f32>;


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





@fragment
fn fs_main(in : FragIutput) -> @location(0) vec4<f32> {


  var target_uv = vec2(in.quad_uv.x*in.uv_size.x, in.quad_uv.y*in.uv_size.y);
  target_uv = target_uv+in.uv_offset;

  var void_color = vec4(0.0, 0.0, 0.0, 0.0);
  var mip0_color = textureSample(myTexture_mip0, mySampler, target_uv);
  var mip1_color = textureSample(myTexture_mip1, mySampler, target_uv);
  var mip2_color = textureSample(myTexture_mip2, mySampler, target_uv);
  var mip3_color = textureSample(myTexture_mip3, mySampler, target_uv);
  var mip4_color = textureSample(myTexture_mip4, mySampler, target_uv);
  var mip5_color = textureSample(myTexture_mip5, mySampler, target_uv);
  var mip6_color = textureSample(myTexture_mip6, mySampler, target_uv);
  var mip7_color = textureSample(myTexture_mip7, mySampler, target_uv);
  var mip8_color = textureSample(myTexture_mip8, mySampler, target_uv);
  var mip9_color = textureSample(myTexture_mip9, mySampler, target_uv);
  var mip10_color = textureSample(myTexture_mip10, mySampler, target_uv);
  var mip11_color = textureSample(myTexture_mip11, mySampler, target_uv);
  var mip12_color = textureSample(myTexture_mip12, mySampler, target_uv);
  
  var color = select(void_color, mip0_color, in.miplevel>=0.0);
  color = select(color, mip1_color, in.miplevel>=1.0);
  color = select(color, mip2_color, in.miplevel>=2.0);
  color = select(color, mip3_color, in.miplevel>=3.0);
  color = select(color, mip4_color, in.miplevel>=4.0);
  color = select(color, mip5_color, in.miplevel>=5.0);
  color = select(color, mip6_color, in.miplevel>=6.0);
  color = select(color, mip7_color, in.miplevel>=7.0);
  color = select(color, mip8_color, in.miplevel>=8.0);
  color = select(color, mip9_color, in.miplevel>=9.0);
  color = select(color, mip10_color, in.miplevel>=10.0);
  color = select(color, mip11_color, in.miplevel>=11.0);
  color = select(color, mip12_color, in.miplevel>=12.0);
  
  
  // color = textureSample(myTexture_id1, mySampler, target_uv);
  // color = select(color, vec4(0.0, 1.0, 0.0, 1.0), in.miplevel<0.0);

  
  // // 解除下面这句注释，用于查看当前大纹理中所存放的所有图片
  // color = textureSample(myTexture_mip7, mySampler, in.quad_uv);

  // return vec4(in.miplevel);
  return color;
}
`


export { vertex_shader, fragment_shader }
