
function gen_sphere_instance_pos(radius, counts, state) {

    let ret_arr = [];

    const default_color = [0.1, 0.8, 0.95, 1.0];
    for (let i = 0; i < counts; i++) {
        const r1 = radius;
        let pos_x = (Math.random() * 2 - 1) * r1;
        const r2 = Math.sqrt(radius * radius - pos_x * pos_x);
        let pos_y = (Math.random() * 2 - 1) * r2;
        const r3 = Math.sqrt(radius * radius - pos_x * pos_x - pos_y * pos_y);
        let pos_z = (Math.random() * 2 - 1) * r3;
        let time = Math.asin(pos_z / Math.sqrt(pos_x * pos_x + pos_z * pos_z)); // rotating
        // 这里是均衡 arcsin 只能取值 [-PI/2, PI/2] 的问题
        if (Math.random() > 0.5) {
            time += Math.PI;
        }

        ret_arr = ret_arr.concat([pos_x, pos_y, pos_z, 1.0]);   // pos
        ret_arr = ret_arr.concat(default_color);                // color
        ret_arr = ret_arr.concat([time, 1.0]);                  // liftime + idx
        ret_arr = ret_arr.concat([0, 0]);                       // uv-offset padding
        ret_arr = ret_arr.concat([0, 0]);                       // uv-scale padding
        ret_arr = ret_arr.concat([0, 0]);                       // quad-scale padding

    }


    let flow_info = {};

    flow_info["flow_arr"] = ret_arr;
    flow_info["numParticles"] = counts;
    flow_info["lifetime"] = 10.0; // not used

    return flow_info;
}



function gen_sphere_instance_atlas_info(state, instance_arr, mip_arr) {

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

        const atlas_info = state.CPU_storage.mip_atlas_info[mip_level];

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





/**
 *  给出特定的坐标序列，生成这些图像
 * */
function gen_customized_instance_pos(pos_arr, state) {

    const counts = pos_arr.length;
    let ret_arr = [];
    // const default_color = [0.8, 0.6, 0.0, 1.0];
    const default_color = [0.1, 0.8, 0.95, 1.0];
    for (let i = 0; i < counts; i++) {
        let pos_x = pos_arr[i][0];
        let pos_y = pos_arr[i][1];
        let pos_z = pos_arr[i][2];


        ret_arr = ret_arr.concat([pos_x, pos_y, pos_z, 0.0]);   // pos
        ret_arr = ret_arr.concat(default_color);                // color
        ret_arr = ret_arr.concat([0.0, 1.0]);                   // liftime + idx


        let uv_offset = state.CPU_storage.atlas_info["uv_offset"][i % 5];
        let tex_aspect = state.CPU_storage.atlas_info["tex_aspect"][i % 5];
        let uv_size = state.CPU_storage.atlas_info["uv_size"][i % 5];

        ret_arr = ret_arr.concat(uv_offset);                    // uv-offset
        ret_arr = ret_arr.concat(tex_aspect);                   // uv-scale
        ret_arr = ret_arr.concat(uv_size);                      // quad-scale

    }

    let flow_info = {};

    flow_info["flow_arr"] = ret_arr;
    flow_info["numParticles"] = counts;
    flow_info["lifetime"] = 10.0; // not used

    return flow_info;
}




export {
    gen_customized_instance_pos,
    gen_sphere_instance_pos,
    gen_sphere_instance_atlas_info,
};

