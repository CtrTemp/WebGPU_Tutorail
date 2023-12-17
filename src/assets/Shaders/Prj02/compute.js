
/**
 *  用於在每一幀更新粒子的位置坐標
 * */

/**
 *  Flow 運動更新策略：
 * 
 *  1、在每個可能的位置上每次向下一個位置步進一段距離，需要兩個坐標之間的插值獲取更新後的位置
 *  2、在每個可能的位置上隨機撒種子，設定一個 life time，讓粒子在設定的坐標數組中向後移動，
 * 直到其生命終止（但這樣看起來粒子流是不連續的，你是否要考慮設置一個拖尾的效果呢？？？）。不過
 * 目前看來這種效果應該是最佳的√
 * 
 */

// Vertex Shader
const simulation_compute = /* wgsl */`


struct SimulationParams {
  simu_speed : f32, // 一次不仅的步长，可以为小数
  seed : vec4<f32>,
  particle_nums: f32,
  pause: f32,
}

// 要注意这里后面两项不能加入，instance要的只有particle的信息，quad信息不要
struct Particle {
  position    : vec4<f32>,
  color       : vec4<f32>,
  lifetime    : f32,        // 所剩余的显示时间，也是整个position数组的长度，也间接代表了粒子的不透明度
  idx         : f32,
  
  uv_offset   : vec2<f32>,
  tex_aspect  : vec2<f32>,
  uv_size     : vec2<f32>,
  selected    : f32,        // selected in cone range
  // quad_pos     : vec2<f32>,  // -1..+1
  // quad_uv      : vec2<f32>,  // 0..+1
}

struct Particles {
  particles : array<Particle>,
}

@binding(0) @group(0) var<uniform> sim_params : SimulationParams;
@binding(1) @group(0) var<storage, read_write> data : Particles;


@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {

  if(sim_params.pause != 0.0)
  {
    return;
  }
  let idx = global_invocation_id.x;

  var particle = data.particles[idx];

  /**
   *  模拟运动：绕 y 轴旋转
   * */ 
  let cur_x = particle.position.x;
  let cur_z = particle.position.z;
  var radius = sqrt(cur_x*cur_x+cur_z*cur_z);

  particle.lifetime += sim_params.simu_speed;
  particle.position.z = radius * sin(particle.lifetime);
  particle.position.x = radius * cos(particle.lifetime);

  data.particles[idx] = particle;
}


`

export { simulation_compute }
