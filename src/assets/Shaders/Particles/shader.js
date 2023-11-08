// Vertex Shader
const vertex_shader = /* wgsl */`
////////////////////////////////////////////////////////////////////////////////
// Vertex shader
////////////////////////////////////////////////////////////////////////////////
/**
 *  为 Uniform Buffer 定制的数据结构
 * */ 
struct RenderParams {
  modelViewProjectionMatrix : mat4x4<f32>,
  right : vec3<f32>,
  up : vec3<f32>
}
@binding(0) @group(0) var<uniform> render_params : RenderParams;

struct VertexInput {
  @location(0) position : vec3<f32>, // particle position
  @location(1) color : vec4<f32>, // particle color
  @location(2) quad_pos : vec2<f32>, // -1..+1
}

struct VertexOutput {
  @builtin(position) position : vec4<f32>, // mvp 变换后的粒子空间坐标
  @location(0) color : vec4<f32>, // 不变，原本的粒子颜色直接输出
  @location(1) quad_pos : vec2<f32>, // -1..+1 不变，原样输出
}

@vertex
fn vs_main(in : VertexInput) -> VertexOutput {
  var quad_pos = mat2x3<f32>(render_params.right, render_params.up) * in.quad_pos;
  var position = in.position + quad_pos * 0.005;
  var out : VertexOutput;
  out.position = render_params.modelViewProjectionMatrix * vec4<f32>(position, 1.0);
  out.color = in.color;
  out.quad_pos = in.quad_pos;
  return out;
}
`


////////////////////////////////////////////////////////////////////////////////
// Fragment shader
////////////////////////////////////////////////////////////////////////////////
const fragment_shader = /* wgsl */`

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) quad_pos : vec2<f32>, // -1..+1
}


@fragment
fn fs_main(in : VertexOutput) -> @location(0) vec4<f32> {
  var color = in.color;
  // Apply a circular particle alpha mask
  // 使用粒子原本颜色，直接染色即可（还要应用 alpha test）
  // color.a = color.a * max(1.0 - length(in.quad_pos), 0.0);
  return color;
}
`

// Compute Shader
const compute_shader = /* wgsl */`
////////////////////////////////////////////////////////////////////////////////
// Utilities
////////////////////////////////////////////////////////////////////////////////
// 这个私有变量 private 是何含义？？？
// 就是 GPU 端临时定义的一个local变量？？应该是定义在local memory上，并在这个 thread 的整个
// 生命周期可见
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



////////////////////////////////////////////////////////////////////////////////
// Simulation Compute shader
////////////////////////////////////////////////////////////////////////////////
struct SimulationParams {
  deltaTime : f32,
  seed : vec4<f32>,
}

struct Particle {
  position : vec3<f32>,
  lifetime : f32,
  color    : vec4<f32>,
  velocity : vec3<f32>,
}

struct Particles {
  particles : array<Particle>,
}

@binding(0) @group(0) var<uniform> sim_params : SimulationParams;
@binding(1) @group(0) var<storage, read_write> data : Particles;
@binding(2) @group(0) var texture : texture_2d<f32>;

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {
  let idx = global_invocation_id.x;

  init_rand(idx, sim_params.seed);

  var particle = data.particles[idx];

  // Apply gravity
  particle.velocity.z = particle.velocity.z - sim_params.deltaTime * 0.5;

  // Basic velocity integration
  particle.position = particle.position + sim_params.deltaTime * particle.velocity;

  // Age each particle. Fade out before vanishing.
  particle.lifetime = particle.lifetime - sim_params.deltaTime;
  particle.color.a = smoothstep(0.0, 0.5, particle.lifetime);

  // If the lifetime has gone negative, then the particle is dead and should be
  // respawned.
  /**
   *  使用不透明度来确定粒子下一次生成的位置。
   *  1、根据当前粒子所在的MipLevel和所处位置，确定当前的 probability
   *  2、probability是一个四维向量，其rgba四个分量，分别代表着上一个MipLevel其对应的四个
   * 像素的alpha值累加归一化后的结果。这样将左上、右上、左下、右下四个alpha值一一累加，并
   * 归一化，得到了这四个分量
   *  3、意义就在于，在当前位置，我可以生成一个任意值，也就是以下的 value，可以根据这个值
   * 在以上probability变量所划分的区间中的位置，来判断当前像素应该落在哪个位置，即左上、
   * 右上、左下、右下四者之一，如下画图已经表示的十分清晰了。
   *  4、于是，从当前的MipLevel直到level=0，也就是分辨率最高的那一层，进行循环，不断更新
   * coord的位置坐标。直到得到源图像中一个确切的位置。就是当前位置处，下一个粒子所生成的
   * 位置坐标。
   * */ 
  if (particle.lifetime < 0.0) {
    // Use the probability map to find where the particle should be spawned.
    // Starting with the 1x1 mip level.
    /**
     *  注意这里初始化 coord=(0,0) 说明从最高的MipLevel开始，这也就意味着，不论当前
     * 的particles在哪里消失，下一个重新生成的particles位置完全随机，与消失位置无关。
     * */ 
    var coord : vec2<i32>;
    for (var level = u32(textureNumLevels(texture) - 1); level > 0; level--) {
      // Load the probability value from the mip-level
      // Generate a random number and using the probabilty values, pick the
      // next texel in the next largest mip level:
      //
      // 0.0    probabilites.r    probabilites.g    probabilites.b   1.0
      //  |              |              |              |              |
      //  |   TOP-LEFT   |  TOP-RIGHT   | BOTTOM-LEFT  | BOTTOM_RIGHT |
      //
      let probabilites = textureLoad(texture, coord, level);
      let value = vec4<f32>(rand());
      // 下面这句话非常巧妙，可以得到当前的rand值在probabilities中的哪个区段中，对应的位置被置为1得到mask
      let mask = (value >= vec4<f32>(0.0, probabilites.xyz)) & (value < probabilites);
      coord = coord * 2; // 对一个向量的运算操作即对其各个分量同时做此操作
      // select 为 WGSL 中特有的表达式，由于其没有三目运算，故以此代替，参数操作如下
      // select(falseExpression, trueExpression, condition);
      // any函数用于表示：向量中的任意一个分量为‘true’则其为true
      /**
       *  有了以上的解释，下面的理解起来就非常巧妙了，即：当mask中yw任意分量为1，则particle下一次生成
       * 的位置x坐标+1；当mask中zw任意分量为1，则particle下一次生成的位置y坐标+1。否则在原位生成。
       *  coord作为新生成的坐标位置。
       * */ 
      coord.x = coord.x + select(0, 1, any(mask.yw)); // x  y
      coord.y = coord.y + select(0, 1, any(mask.zw)); // z  w
    }
    

    let uv = vec2<f32>(coord) / vec2<f32>(textureDimensions(texture)); // UV坐标归一化(0~1)
    /**
     *  生成新的坐标位置，由于平面是确定的，所以Z坐标肯定是0，但xy坐标怎么解释？！为何要乘以这个3.0？
     * 答案找到了：其实这个就是一个比例系数，用于扩大和缩小，可以拟定任意值~
     *  我认为2.0在目前分辨率下效果更好于是就改成了2.0
     * */ 
    // particle.position = vec3<f32>((uv - 0.5) * 3.0 * vec2<f32>(1.0, -1.0), 0.0);
    particle.position = vec3<f32>((uv - 0.5) * 3.5 * vec2<f32>(1.0, -1.0), 0.0);
    // 颜色采样！不必多讲（这个应该是直接采样到了 MipLevel=0 的位置）
    particle.color = textureLoad(texture, coord, 0);
    // 以下为生成的新粒子附加一个随机的初始速度
    particle.velocity.x = (rand() - 0.5) * 0.1;
    particle.velocity.y = (rand() - 0.5) * 0.1;
    particle.velocity.z = rand() * 0.3; // z 轴有一个默认的永远方向向上的初始速度
    // 粒子的的声明长度也是随机的
    particle.lifetime = 0.5 + rand() * 3.0;
  }

  // Store the new particle value
  data.particles[idx] = particle;
}

`


export{ vertex_shader, fragment_shader, compute_shader }
