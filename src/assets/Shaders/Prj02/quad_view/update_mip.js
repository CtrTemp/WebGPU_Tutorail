
/**
 *  用於在每一幀更新粒子的 MipLevel
 * */

var update_mip_compute = /* wgsl */`

/**
 *  2023/01/03
 *  第二天来了之后继续写这些计算函数
 * */ 


// 要注意这里后面两项不能加入，instance要的只有particle的信息，quad信息不要
struct Instance {
    position    : vec4<f32>,
    color       : vec4<f32>,
    lifetime    : f32,        // 所剩余的显示时间，也是整个position数组的长度，也间接代表了粒子的不透明度
    idx         : f32,
    
    uv_offset   : vec2<f32>,
    tex_aspect  : vec2<f32>,
    uv_size     : vec2<f32>,
    uv_offset_d     : vec2<f32>,    // default_uv_offset
    tex_aspect_d    : vec2<f32>,    // default_uv_scale
    uv_size_d       : vec2<f32>,    // default_quad_scale
}
  
  
@binding(0) @group(0) var<storage, read_write> mip_arr : array<f32>;
@binding(1) @group(0) var<storage, read_write> data : array<Instance>;


@binding(0) @group(1) var<uniform> view_mat : mat4x4<f32>; // 相机矩阵
@binding(1) @group(1) var<uniform> proj_mat : mat4x4<f32>; // 投影矩阵


/**
 *  判断是否在视锥内
 * */ 
fn check_in_frustum(ndc_pos : vec4f) -> bool {
    var x = ndc_pos.x;
    var y = ndc_pos.y;
    var z = ndc_pos.z;
    if (x < -1.0 || x > 1.0 || y < -1.0 || y > 1.0 || z < -1.0 || z > 1.0){
        return false;
    }
    return true;
}

/**
 *  计算 MipLevel
 *  
 *  调用时，这里的 unitDistance 我们指定为 1 即相机近表面的距离
 * */ 
fn compute_miplevel(pos : vec4f, unitDistance : f32) -> f32 {
    var v_pos = view_mat * pos;       // 得到相对相机的坐标
    
    var check_z = v_pos.z / v_pos.w;  // 归一化得到实际坐标距离
    var mip_val = sqrt(-check_z / unitDistance);

    return mip_val;
}


@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {

    var idx = global_invocation_id.x;

    var instance_pos = data[idx].position;

    var mip_val = -1.0;

    var ndc_pos = proj_mat * view_mat * instance_pos;
    ndc_pos.x = ndc_pos.x / ndc_pos.w;
    ndc_pos.y = ndc_pos.y / ndc_pos.w; 
    ndc_pos.z = ndc_pos.z / ndc_pos.w; 
    ndc_pos.w = 1.0;

    // mip_val = proj_mat[0][0];
  

    if(check_in_frustum(ndc_pos)){
        mip_val = compute_miplevel(instance_pos, 1.0);
    }


    /**
     *  更新mips
     * */ 
    // mip_arr[idx] = mip_val;
    mip_arr[idx] = 7.0;
}


`

export { update_mip_compute }
