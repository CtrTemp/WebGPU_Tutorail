
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

// /**
//  *  隨機數初始化
//  * */ 
// fn init_rand(invocation_id : u32, seed : vec4<f32>) {
//   rand_seed = seed.xz;
//   rand_seed = fract(rand_seed * cos(35.456+f32(invocation_id) * seed.yw));
//   rand_seed = fract(rand_seed * cos(41.235+f32(invocation_id) * seed.xw));
// }

// fn rand() -> f32 {
//   rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
//   rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
//   return rand_seed.y;
// }


struct SimulationParams {
  simu_speed : f32, // 一次不仅的步长，可以为小数
  seed : vec4<f32>,
  particle_nums: f32
}

struct Particle {
  position : vec4<f32>,
  color    : vec4<f32>,
  lifetime : f32, // 所剩余的显示时间，也是整个position数组的长度，也间接代表了粒子的不透明度
}

struct Particles {
  particles : array<Particle>,
}

@binding(0) @group(0) var<uniform> sim_params : SimulationParams;
@binding(1) @group(0) var<storage, read_write> data : Particles;


@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {
  let idx = global_invocation_id.x;

  // init_rand(idx, sim_params.seed);

  var particle = data.particles[idx];


  // // 這句比較關鍵，可以根據其LifeTime自動發揮出漸變效果
  // particle.color.a = smoothstep(0.0, 0.5, particle.lifetime);
  particle.color.a = particle.lifetime / sim_params.particle_nums / 3 + 0.15;

  particle.lifetime = particle.lifetime - sim_params.simu_speed;

  if(particle.lifetime < 0)
  {
    particle.lifetime = sim_params.particle_nums;
  }

  // // Store the new particle value
  data.particles[idx] = particle;
}


`

export { simulation_compute }
