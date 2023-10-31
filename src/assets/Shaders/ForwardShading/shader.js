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
}

@vertex
fn main(@location(0) position : vec4<f32>, @location(1) normal: vec3<f32>) -> VertexOutput 
{
    var output : VertexOutput;
    output.Position = uniforms.modelViewProjectionMatrix * position;
    output.fragPos = output.Position.xyz;
    output.fragNorm = normal;
    return output;
}
`

// Fragment Shader
const fragment_shader = /* wgsl */`
@fragment
fn main(@location(0) fragPos: vec2<f32>, @location(1) fragNorm: vec4<f32>) -> @location(0) vec4<f32> 
{
  return fragPos;
}
`


export{ vertex_shader, fragment_shader }
