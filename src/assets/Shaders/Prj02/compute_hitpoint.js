
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
    pic_idx         : f32,        // instance idx
    position        : vec4<f32>,
    pos_offset      : vec4<f32>,
    default_layout  : vec4<f32>,
    layout2         : vec4<f32>,
    layout3         : vec4<f32>,
    layout_flag     : f32,    
    quad_idx        : f32,
    
    uv_offset_d     : vec2<f32>,    // default_uv_offset
    uv_aspect_d     : vec2<f32>,    // default_uv_scale
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
@binding(3) @group(1) var<storage, read_write> hit_index : f32; // 只有一个变量会造成写内存冲突？！


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


fn check_hit(hitPoint : vec3f, pos : vec3f, aspect : vec2f, max_influence_radius : f32) -> i32
{
    // return 0;
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
    var dist = distance(hitPoint, pos_ori);
    if(dist<1)
    {
        return 1;
    }
    if(dist<15) // 确定鱼眼镜头影响范围
    {
        return 10;
    }

    return 0;
}


@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) global_invocation_id : vec3<u32>) {

    /**
     *  索引到点
     * */ 
    var idx = global_invocation_id.x;

    var instance_pos = data[idx].position;
    var aspect = data[idx].uv_aspect_d;

    var max_influence_radius = 15.0;

    /**
     *  回来这里计算更新mips
     * */ 
    var hitPoint = compute_hitPoint(instance_pos.xyz);
    var check_val = check_hit(hitPoint, instance_pos.xyz, aspect, max_influence_radius);
    // 
    // if(check_val != 0)
    // {
    //     if(check_val == 1)
    //     {
    //         hit_index = data[idx].pic_idx;
    //     }

    //     // 鱼眼镜头效果
    //     if(data[idx].pos_offset.z > -10)
    //     {
    //         // 首先计算移动方向，应该向着观察点移动
    //         var dir = 3*normalize(instance_pos.xyz-lookFrom.xyz);
    //         data[idx].pos_offset.x = data[idx].pos_offset.x-dir.x;
    //         data[idx].pos_offset.y = data[idx].pos_offset.y-dir.y;
    //         data[idx].pos_offset.z = data[idx].pos_offset.z-dir.z;
    //         // data[idx].pos_offset.z = data[idx].pos_offset.z-3;
    //     }
    // }
    // else
    // {
    //     if(data[idx].pos_offset.z < 0)
    //     {
    //         var dir = 3*normalize(instance_pos.xyz-lookFrom.xyz);
    //         data[idx].pos_offset.x = data[idx].pos_offset.x+dir.x;
    //         data[idx].pos_offset.y = data[idx].pos_offset.y+dir.y;
    //         data[idx].pos_offset.z = data[idx].pos_offset.z+dir.z;
    //         // data[idx].pos_offset.z = data[idx].pos_offset.z+3;
    //     }
    // }



    // 鱼眼镜头位移
    if(check_val != 0)
    {
        if(check_val == 1)
        {
            hit_index = data[idx].pic_idx;
        }

        
        /**
         *  根据与光标距离的远近，产生一个修正系数，使得距离光标越近的有最大的放大效果，
         * 以及最大的扩散效果，表现为：z轴平移距离，或xoy平面方向上散开的距离
         *  注意：这里简单取倒数并不能达到较好的效果！！！
         * */ 
        var z_move_para = 1-distance(instance_pos.xyz, hitPoint)/max_influence_radius;
        var xov_move_para = 1-distance(instance_pos.xyz, hitPoint)/max_influence_radius;

        if(z_move_para>1){ // 给一个最大限制
            z_move_para = 1;
        }
        if(xov_move_para>1){ // 给一个最大限制
            xov_move_para = 1;
        }

        // //  暂时停掉鱼眼镜头 2024-03-29
        // //  鱼眼镜头 xoy 平面散开效果
        // if(length(data[idx].pos_offset) < 1*xov_move_para+0.75)
        // {
        //     // 首先计算移动方向，应该向着观察点移动
        //     var dir = 0.05*normalize(instance_pos.xyz-hitPoint);

        //     data[idx].pos_offset.x = data[idx].pos_offset.x+dir.x;
        //     data[idx].pos_offset.y = data[idx].pos_offset.y+dir.y;
        //     data[idx].pos_offset.z = data[idx].pos_offset.z+dir.z;
        // }


        // // 鱼眼镜头 z轴 移动产生的放大效果
        // if(data[idx].pos_offset.z > -10*z_move_para)
        // {
        //     // 首先计算移动方向，应该向着观察点移动
        //     var dir = 1*normalize(instance_pos.xyz-lookFrom.xyz);
        //     data[idx].pos_offset.x = data[idx].pos_offset.x-dir.x;
        //     data[idx].pos_offset.y = data[idx].pos_offset.y-dir.y;
        //     data[idx].pos_offset.z = data[idx].pos_offset.z-dir.z;
        //     // data[idx].pos_offset.z = data[idx].pos_offset.z-3;
        // }
        // // z轴修正
        // if(data[idx].pos_offset.z < -10*z_move_para - 1)
        // {
        //     var dir = 1*normalize(instance_pos.xyz-lookFrom.xyz);
        //     data[idx].pos_offset.x = data[idx].pos_offset.x+dir.x;
        //     data[idx].pos_offset.y = data[idx].pos_offset.y+dir.y;
        //     data[idx].pos_offset.z = data[idx].pos_offset.z+dir.z;
        // }
    }
    else
    {
        // 还是加以限制，否则会无限执行以下语句
        if(length(data[idx].pos_offset) > 0.005)
        {
            // var reset_dir = 0.05*normalize(instance_pos.xyz-hitPoint);

            data[idx].pos_offset.x = data[idx].pos_offset.x/2;
            data[idx].pos_offset.y = data[idx].pos_offset.y/2;
            data[idx].pos_offset.z = data[idx].pos_offset.z/2;
        }

        
    }
    

    
}


`

export { update_select_compute }