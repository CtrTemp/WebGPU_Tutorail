// Vertex Shader
const vertex_shader = /* wgsl */`
struct Uniforms {
  modelViewProjectionMatrix : mat4x4<f32>,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
  @location(0) fragPos: vec3<f32>,
  @location(1) fragNorm: vec3<f32>,
  @location(2) fragUV: vec2<f32>,
  @location(3) vert_pos: vec3<f32>,
}

@vertex
fn main(
  @location(0) position : vec4<f32>, 
  @location(1) normal: vec3<f32>,
  @location(2) uv : vec2<f32>
  ) -> VertexOutput 
{
    var output : VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * position;
    output.fragPos = output.Position.xyz;
    output.fragNorm = normal;
    output.fragUV = uv;
    output.vert_pos = position.xyz;
    return output;
}
`

// Fragment Shader
const fragment_shader = /* wgsl */`
@fragment
fn main(
  @builtin(position) Position : vec4<f32>,
  @location(0) fragPos: vec3<f32>, 
  @location(1) fragNorm: vec3<f32>,
  @location(2) fragUV: vec2<f32>,
  @location(3) vert_pos: vec3<f32>) -> @location(0) vec4<f32> 
{
  if(vert_pos.y<21)
  {
    let uv = floor(10.0 * fragUV);
    let c = 0.2 + 0.5 * ((uv.x + uv.y) - 2.0 * floor((uv.x + uv.y) / 2.0));
    return vec4(vec3(c), 1.0);
  }

  let uv = floor(50.0 * fragUV);
  let c = 0.2 + 0.5 * ((uv.x + uv.y) - 2.0 * floor((uv.x + uv.y) / 2.0));

  return vec4(vec3(c), 1.0);
}
`


export{ vertex_shader, fragment_shader }
