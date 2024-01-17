
/**
 *  用于更新测试射线到场景中的交点，即：光标选中状态
 * */

var update_select_compute = /* wgsl */`

/**
 *  2023/01/03
 *  第二天来了之后继续写这些计算函数
 * */ 


// 要注意这里后面两项不能加入，instance要的只有particle的信息，quad信息不要
struct Instance {
    position    : vec4<f32>,
    pos_offset  : vec4<f32>,
    lifetime    : f32,        // 所剩余的显示时间，也是整个position数组的长度，也间接代表了粒子的不透明度
    idx         : f32,
    
    uv_offset   : vec2<f32>,
    tex_aspect  : vec2<f32>,
    uv_size     : vec2<f32>,
    uv_offset_d     : vec2<f32>,    // default_uv_offset
    tex_aspect_d    : vec2<f32>,    // default_uv_scale
    uv_size_d       : vec2<f32>,    // default_quad_scale
}
 
struct interacPack{
    z_plane_depth   : f32,
}
  
@binding(0) @group(0) var<storage, read_write> mip_arr : array<f32>;
@binding(1) @group(0) var<storage, read_write> data : array<Instance>;


@binding(0) @group(1) var<uniform> lookFrom : vec4<f32>;    // Cursor Ray LookFrom
@binding(1) @group(1) var<uniform> cursorDir : vec4<f32>;     // Cursor Ray Dir
@binding(2) @group(1) var<storage, read_write> nearest_dist : f32; // 只有一个变量会造成写内存冲突？！


@binding(0) @group(2) var<uniform> mvp    : mat4x4<f32>;
@binding(1) @group(2) var<uniform> right  : vec3<f32>;
@binding(2) @group(2) var<uniform> up     : vec3<f32>;

@binding(0) @group(3) var<uniform> interaction  : interacPack;

/**
 *  有误需要检查 2024/01/11
 * */ 
fn compute_hitPoint(pos : vec3f) -> vec3f
{

    var normal = cross(right, up);

    // 使用原平面位置进行判断    
    var pos_ori = vec3f(pos.xy, interaction.z_plane_depth);

    var t = (dot(normal, pos_ori) - dot(normal, lookFrom.xyz)) / (dot(normal, cursorDir.xyz));

    var hitPoint = lookFrom.xyz + t*cursorDir.xyz;

    // // 默认z平面，且当前 z=32

    // var z = 32.0;
    // var t = z/cursorDir.z;
    // var hitPoint = t*cursorDir.xyz;

    return hitPoint;
}


fn check_hit(hitPoint : vec3f, pos : vec3f, aspect : vec2f) -> bool
{

    // var range_t = 1.0 * up * aspect.y + pos;
    // var range_b = -1.0 * up * aspect.y + pos;
    // var range_l = 1.0 * right * aspect.x + pos;
    // var range_r = -1.0 * right * aspect.x + pos;

    // if(hitPoint.x>range_r.x || hitPoint.x<range_l.x || hitPoint.y>range_t.y || hitPoint.y<range_b.y)
    // {
    //     return false;
    // }
    // return true;

    var pos_ori = vec3f(pos.xy, interaction.z_plane_depth); // 使用原平面位置进行判断
    if(distance(hitPoint, pos_ori)<10)
    {
        return true;
    }

    return false;
}


@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {

    /**
     *  索引到点
     * */ 
    var idx = global_invocation_id.x;

    var instance_pos = data[idx].position;
    var aspect = data[idx].tex_aspect;

    var mip_val = -1.0;

    /**
     *  回来这里计算更新mips
     * */ 

    var hitPoint = compute_hitPoint(instance_pos.xyz);


    if(check_hit(hitPoint, instance_pos.xyz, aspect))
    {
        mip_arr[idx] = -1.0;

        // 鱼眼镜头效果
        if(data[idx].pos_offset.z > -30)
        {
            // 首先计算移动方向，应该向着观察点移动
            var dir = 3*normalize(instance_pos.xyz-lookFrom.xyz);
            data[idx].pos_offset.x = data[idx].pos_offset.x-dir.x;
            data[idx].pos_offset.y = data[idx].pos_offset.y-dir.y;
            data[idx].pos_offset.z = data[idx].pos_offset.z-dir.z;
            // data[idx].pos_offset.z = data[idx].pos_offset.z-3;
        }
    }

    // if(cursorDir.x<0)
    // {
    //     mip_arr[idx] = -1.0;
    // }
    else
    {
        mip_arr[idx] = 7.0;
        if(data[idx].pos_offset.z < 0)
        {
            var dir = 3*normalize(instance_pos.xyz-lookFrom.xyz);
            data[idx].pos_offset.x = data[idx].pos_offset.x+dir.x;
            data[idx].pos_offset.y = data[idx].pos_offset.y+dir.y;
            data[idx].pos_offset.z = data[idx].pos_offset.z+dir.z;
            // data[idx].pos_offset.z = data[idx].pos_offset.z+3;
        }
    }
    
    // if(mip_arr[idx]>0)
    // {
    //     mip_arr[idx] = -1.0;
    // }
    // else
    // {
    //     mip_arr[idx] = 7.0;
    // }
    

    
}


`

export { update_select_compute }