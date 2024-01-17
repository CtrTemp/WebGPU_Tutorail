
function gen_rect_instance_pos(
    z_plane_dist,
    horizontal_range, vertical_range,
    horizontal_cnt, vertical_cnt,
    raw_info_pack
) {

    let ret_arr = [];

    const horizontal_step = horizontal_range / horizontal_cnt;
    const vertical_step = vertical_range / vertical_cnt;

    const horizontal_offset = -horizontal_range / 2;
    const vertical_offset = -vertical_range / 2;

    for (let i = 0; i < vertical_cnt; i++) {
        for (let j = 0; j < horizontal_cnt; j++) {

            const global_cnt = i * horizontal_cnt + j;

            const default_uv_offset_arr = raw_info_pack[global_cnt]["default_atlas_info"]["uv_offset"];
            const default_uv_size_arr = raw_info_pack[global_cnt]["default_atlas_info"]["uv_size"];


            let pos_x = (0.5 + j) * horizontal_step + horizontal_offset;
            let pos_y = (0.5 + i) * vertical_step + vertical_offset;
            let pos_z = z_plane_dist;


            let time = Math.asin(pos_z / Math.sqrt(pos_x * pos_x + pos_z * pos_z)); // rotating
            if (Math.random() > 0.5) {
                time += Math.PI;
            }

            /**
             *  减少使用 contact 数据量越大的时候耗时明显变多！！!
             * */ 
            Array.prototype.push.apply(ret_arr, [pos_x, pos_y, pos_z, 1.0]);
            Array.prototype.push.apply(ret_arr, [0, 0, 0, 0]);
            Array.prototype.push.apply(ret_arr, [time, 1.0]);
            Array.prototype.push.apply(ret_arr, default_uv_offset_arr);
            Array.prototype.push.apply(ret_arr, [1.0, 1.0]);
            Array.prototype.push.apply(ret_arr, default_uv_size_arr);
            Array.prototype.push.apply(ret_arr, default_uv_offset_arr);
            Array.prototype.push.apply(ret_arr, [1.0, 1.0]);
            Array.prototype.push.apply(ret_arr, default_uv_size_arr);
            Array.prototype.push.apply(ret_arr, [0.0, 0.0]);



            // ret_arr = ret_arr.concat([pos_x, pos_y, pos_z, 1.0]);   // pos
            // ret_arr = ret_arr.concat([0, 0, 0, 0]);                 // pos_offset
            // ret_arr = ret_arr.concat([time, 1.0]);                  // liftime + idx
            // // ret_arr = ret_arr.concat([0, 0]);                       // uv-offset padding
            // // ret_arr = ret_arr.concat([0, 0]);                       // uv-scale padding
            // // ret_arr = ret_arr.concat([0, 0]);                       // quad-scale padding
            // ret_arr = ret_arr.concat(default_uv_offset_arr);        // default_uv_offset
            // ret_arr = ret_arr.concat([1.0, 1.0]);                   // default_uv_scale
            // ret_arr = ret_arr.concat(default_uv_size_arr);          // default_uv_size
            // ret_arr = ret_arr.concat(default_uv_offset_arr);        // default_uv_offset
            // ret_arr = ret_arr.concat([1.0, 1.0]);                   // default_uv_scale
            // ret_arr = ret_arr.concat(default_uv_size_arr);          // default_uv_size
            // ret_arr = ret_arr.concat([0, 0]);                       // pure padding
        }
    }


    let flow_info = {};

    flow_info["flow_arr"] = ret_arr;
    flow_info["numParticles"] = horizontal_cnt * vertical_cnt;
    console.log("Done");
    return flow_info;
}



function gen_rect_instance_atlas_info(state, instance_arr, mip_arr) {

    // console.log("instance_arr = ", instance_arr);
    // console.log("mip_arr = ", mip_arr);

    const counts = state.CPU_storage.instance_info["numInstances"];

    const info_pack_stride = state.CPU_storage.instance_info["instanceInfoByteSize"] / 4;
    const atlas_stride = 4 + 4 + 1 + 1;

    // 深拷贝，用于计数
    let mip_counter = JSON.parse(JSON.stringify(state.CPU_storage.mip_info["arr"]));
    // console.log("mip counter = ", mip_counter);

    for (let i = 0; i < counts; i++) {

        const idx = i * info_pack_stride + atlas_stride;
        const mip_level = Math.floor(mip_arr[i]);

        if (mip_level < 0) {
            continue;
        }


        const atlas_info = state.CPU_storage.quad_atlas_info[mip_level];

        let img_idx = --mip_counter[mip_level];

        let uv_offset = atlas_info["uv_offset"][img_idx];
        let tex_aspect = atlas_info["tex_aspect"][img_idx];
        let uv_size = atlas_info["uv_size"][img_idx];


        // console.log("atlas_info = ", atlas_info);
        // console.log("img_idx = ", img_idx);
        // console.log(uv_size);


        instance_arr[idx + 0] = uv_offset[0];      // uv-offset-u
        instance_arr[idx + 1] = uv_offset[1];      // uv-offset-v
        instance_arr[idx + 2] = tex_aspect[0];     // uv-scale-u
        instance_arr[idx + 3] = tex_aspect[1];     // uv-scale-v
        instance_arr[idx + 4] = uv_size[0];        // quad-scale-u
        instance_arr[idx + 5] = uv_size[1];        // quad-scale-v

    }
}







export {
    gen_rect_instance_pos,
    gen_rect_instance_atlas_info,
};

