
/**
 *  该文件中的代码用于在预处理阶段生成 MipMap
 * */ 

// Vertex Shader
const simulation_compute = /* wgsl */`
// 其实 UBO 中存的只是一个当前读入图像源文件的texture宽度
struct UBO {
  width : u32,
}

struct Buffer {
  weights : array<f32>,
}

// binding(0) 位置上的就是 ProbabilityMap 对应的 UBO
@binding(0) @group(0) var<uniform> ubo : UBO;
@binding(1) @group(0) var<storage, read> buf_in : Buffer;
@binding(2) @group(0) var<storage, read_write> buf_out : Buffer;
// 以下两个字段，根据不同的 MipLevel 会在循环中索引到不同位置的内存区
// 不同 MipLevel 的内存区已经在纹理被创建时额外创建。
@binding(3) @group(0) var tex_in : texture_2d<f32>;
@binding(3) @group(0) var tex_out : texture_storage_2d<rgba8unorm, write>;


////////////////////////////////////////////////////////////////////////////////
// import_level
//
// Loads the alpha channel from a texel of the source image, and writes it to
// the buf_out.weights.
// 只有在 MipLevel=0 的时候，也就是访问源图像的时候使用 ImportLevelPipeline
////////////////////////////////////////////////////////////////////////////////
/**
 *  global_invocation_id 表示当前线程在计算着色器网格中的全局三维坐标。
 * 在 MipLevel=0 时，也就是访问分辨率最高的原图像时调用这个函数。其作用是将原图像的
 * 第四通道也就是alpha通道原封不动的载入到 buf_out 中
 * */ 
@compute @workgroup_size(64)
fn import_level(@builtin(global_invocation_id) coord : vec3<u32>) {
  _ = &buf_in; // 这句是什么意思没有看懂，但还不能注释掉
  // 从二维坐标索引转化到线性坐标索引
  let offset = coord.x + coord.y * ubo.width;
  // 为当前线程所对应的坐标位置处的 Map 赋值，赋值为读取纹理的 alpha 值（也就是半透明度）
  buf_out.weights[offset] = textureLoad(tex_in, vec2<i32>(coord.xy), 0).w;
}

////////////////////////////////////////////////////////////////////////////////
// export_level
//
// Loads 4 f32 weight values from buf_in.weights, and stores summed value into
// buf_out.weights, along with the calculated 'probabilty' vec4 values into the
// mip level of tex_out. See simulate() in particle.wgsl to understand the
// probability logic.
// 注意这里的64就代表了64个线程作为一个工作组被提交
////////////////////////////////////////////////////////////////////////////////

/**
 *  在MipLevel!=0的时候调用这个函数，其作用是：
 *  1、使用两个 buf 分别为 buf_a 和 buf_b。让他们轮流做 buf_in 和 buf_out，每次使用上
 * 一个阶段的buf_out作为当前阶段的buf_in，并将下一个MipLevel的图像存入buf_out。这里的
 * 关键点在于offset的确定，你能看懂这个index从二维到一维之间的解码么？
 * */ 
@compute @workgroup_size(64)
fn export_level(@builtin(global_invocation_id) coord : vec3<u32>) {
  // all 函数的意思就是coord的xy两个分项都满足小于的条件
  if (all(coord.xy < vec2<u32>(textureDimensions(tex_out)))) {
    let dst_offset = coord.x    + coord.y    * ubo.width;
    let src_offset = coord.x*2u + coord.y*2u * ubo.width;

    // 注意这里的 buf_in 存的都是纹理的半透明度，也就是第四通道 alpha 值
    // weights函数意义没搞懂
    let a = buf_in.weights[src_offset + 0u];
    let b = buf_in.weights[src_offset + 1u];
    let c = buf_in.weights[src_offset + 0u + ubo.width];
    let d = buf_in.weights[src_offset + 1u + ubo.width];
    // let sum = dot(vec4<f32>(a, b, c, d), vec4<f32>(1.0));
    // 上面这句不就等同于四者相加么？！
    // sum 将四个半透明度累加的意义是什么？？？
    let sum = a+b+c+d;

    buf_out.weights[dst_offset] = sum / 4.0;

    /**
     *  由于是不同的 MipLevel，tex_out实际上是不同的内存区，不会出现之前担心的纹理被
     * 重复写覆盖的问题。
    */

    /**
     *  现在来阐述一下 probabilitiesMap 的具体含义：
     *  简单来说，其实这里就是通过不透明度来判定当前粒子所应处的位置，具体请到运行时 shader
     * 的 compute 模拟处进行查看。
     * */ 
    let probabilities = vec4<f32>(a, a+b, a+b+c, a+b+c+d) / max(sum, 0.0001);
    textureStore(tex_out, vec2<i32>(coord.xy), probabilities);
  }
}
`

export{ simulation_compute }
