// Vertex Shader
const move_vertex_compute = /* wgsl */`

// 要注意这里后面两项不能加入，instance要的只有particle的信息，quad信息不要
struct pos {
    position    :   vec2<f32>,
}
  
struct PosArr {
    particles   :   array<pos>,
}


@binding(0) @group(0) var<storage, read_write> data : PosArr;
  
@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {

  let idx = global_invocation_id.x;

  var vert_unit = data.particles[idx];
  
  vert_unit.position.x -= 0.1;

  data.particles[idx] = vert_unit;

}
`

export{ move_vertex_compute }
