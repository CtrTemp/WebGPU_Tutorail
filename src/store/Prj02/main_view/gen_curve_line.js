
import { mat4, vec3, vec4 } from "wgpu-matrix"



function check_in_frustum(ndc_pos) {
    const x = ndc_pos[0];
    const y = ndc_pos[1];
    const z = ndc_pos[2];
    // console.log("ndc_pos = ", ndc_pos);
    if (x < -1 || x > 1 || y < -1 || y > 1 || z < -1 || z > 1) //
    {
        // console.log("false~~~~~~~~~~~~~~~");
        return false;
    }
    // console.log("true~~~~~~~~~~~~~~~");
    return true;
}

function gen_sphere_instance(radius, counts, state) {

    let ret_arr = [];
    // const default_color = [0.8, 0.6, 0.0, 1.0];
    const default_color = [0.1, 0.8, 0.95, 1.0];
    for (let i = 0; i < counts; i++) {
        const r1 = radius;
        let pos_x = (Math.random() * 2 - 1) * r1;
        const r2 = Math.sqrt(radius * radius - pos_x * pos_x);
        let pos_y = (Math.random() * 2 - 1) * r2;
        const r3 = Math.sqrt(radius * radius - pos_x * pos_x - pos_y * pos_y);
        let pos_z = (Math.random() * 2 - 1) * r3;
        let time = Math.asin(pos_z / Math.sqrt(pos_x * pos_x + pos_z * pos_z)); // rotating
        // console.log("time = ", time);
        // 这里是均衡 arcsin 只能取值 [-PI/2, PI/2] 的问题
        if (Math.random() > 0.5) {
            time += Math.PI;
        }
        // const idx = Math.random() * 9;

        ret_arr = ret_arr.concat([pos_x, pos_y, pos_z, 0.0]);   // pos
        ret_arr = ret_arr.concat(default_color);                // color
        ret_arr = ret_arr.concat([time, 1.0]);                  // liftime + idx


        let uv_offset = state.main_canvas.atlas_info["uv_offset"][i % 5];
        let tex_aspect = state.main_canvas.atlas_info["tex_aspect"][i % 5];
        let uv_size = state.main_canvas.atlas_info["uv_size"][i % 5];

        ret_arr = ret_arr.concat(uv_offset);                    // uv-offset
        ret_arr = ret_arr.concat(tex_aspect);                   // uv-scale
        ret_arr = ret_arr.concat(uv_size);                      // quad-scale

        /**
         *  结合相机参数，对 instace 是否在视锥内进行判断
         * */
        const viewProjectMatrix = state.main_canvas.prim_camera["matrix"];
        const viewMatrix = state.main_canvas.prim_camera["view"];
        const projectMatrix = state.main_canvas.prim_camera["projection"];
        const pos = vec4.fromValues(pos_x, pos_y, pos_z, 1.0);
        let projected_pos = vec4.create(0.0, 0.0, 0.0, 0.0);

        vec4.transformMat4(pos, mat4.transpose(viewProjectMatrix), projected_pos);


        // for (let i = 0; i < 4; i++) {
        //     for (let j = 0; j < 4; j++) {
        //         let matrix_val = viewProjectMatrix[i * 4 + j];
        //         let pos_val = pos[j];
        //         projected_pos[i] += matrix_val * pos_val;
        //     }
        // }


        // 归一化到标准向量空间 NDC
        for (let i = 0; i < 4; i++) {
            projected_pos[i] /= projected_pos[3];
        }

        let mip_val = -1.0;
        if (check_in_frustum(projected_pos)) {
            mip_val = 1.0;
        }

        ret_arr = ret_arr.concat(mip_val);                          // miplevel
        ret_arr = ret_arr.concat([0, 0, 0]);                    // padding
    }


    let flow_info = {};

    flow_info["flow_arr"] = ret_arr;
    flow_info["numParticles"] = counts;
    flow_info["lifetime"] = 10.0; // not used

    return flow_info;
}

/**
 *  为每个 instance 更新 miplevel
 * */
function updateMipLevel(state, device) {
    const arr_stride = state.main_canvas.particle_info["particleInstanceByteSize"] / 4;
    const counts = state.main_canvas.particle_info["numParticles"];
    let arr = state.main_canvas.vertices_arr["instance"];
    const arr_len = arr.length;

    const miplevel_offset = 16;

    for (let i = 0; i < arr_len; i += arr_stride) {
        const pos_x = arr[i + 0];
        const pos_y = arr[i + 1];
        const pos_z = arr[i + 2];
        const viewProjectMatrix = state.main_canvas.prim_camera["matrix"];
        const pos = vec4.fromValues(pos_x, pos_y, pos_z, 1.0);
        let projected_pos = vec4.create(0.0, 0.0, 0.0, 0.0);

        vec4.transformMat4(pos, mat4.transpose(viewProjectMatrix), projected_pos);


        // 归一化到标准向量空间 NDC
        for (let i = 0; i < 4; i++) {
            projected_pos[i] /= projected_pos[3];
        }
        let mip_val = -1.0;
        if (check_in_frustum(projected_pos)) {
            mip_val = 1.0;
        }
        arr[i + miplevel_offset] = mip_val;

        // arr[i + 8] = 0.0;
    }


    /**
     *  将更新好的数据写入 GPU VBO 内存区
     * */
    const writeBufferArr = new Float32Array(arr);

    const targetBuffer = state.main_canvas.VBOs["particles"];

    device.queue.writeBuffer(targetBuffer, 0, writeBufferArr);

}




/**
 *  给出特定的坐标序列，生成这些图像
 * */
function gen_customized_instance(pos_arr, state) {

    const counts = pos_arr.length;
    let ret_arr = [];
    // const default_color = [0.8, 0.6, 0.0, 1.0];
    const default_color = [0.1, 0.8, 0.95, 1.0];
    for (let i = 0; i < counts; i++) {
        let pos_x = pos_arr[i][0];
        let pos_y = pos_arr[i][1];
        let pos_z = pos_arr[i][2];
        let time = Math.asin(pos_z / Math.sqrt(pos_x * pos_x + pos_z * pos_z)); // rotating
        // 这里是均衡 arcsin 只能取值 [-PI/2, PI/2] 的问题
        if (Math.random() > 0.5) {
            time += Math.PI;
        }
        // const idx = Math.random() * 9;

        ret_arr = ret_arr.concat([pos_x, pos_y, pos_z, 0.0]);   // pos
        ret_arr = ret_arr.concat(default_color);                // color
        ret_arr = ret_arr.concat([time, 1.0]);                  // liftime + idx


        let uv_offset = state.main_canvas.atlas_info["uv_offset"][i % 5];
        let tex_aspect = state.main_canvas.atlas_info["tex_aspect"][i % 5];
        let uv_size = state.main_canvas.atlas_info["uv_size"][i % 5];

        ret_arr = ret_arr.concat(uv_offset);                    // uv-offset
        ret_arr = ret_arr.concat(tex_aspect);                   // uv-scale
        ret_arr = ret_arr.concat(uv_size);                      // quad-scale

        /**
         *  结合相机参数，对 instace 是否在视锥内进行判断
         * */
        console.log("init camera = ", state.main_canvas.prim_camera);
        const viewProjectMatrix = state.main_canvas.prim_camera["matrix"];
        const viewMatrix = state.main_canvas.prim_camera["view"];
        const projectMatrix = state.main_canvas.prim_camera["projection"];
        const pos = vec4.fromValues(pos_x, pos_y, pos_z, 1.0);
        let projected_pos = vec4.create(0.0, 0.0, 0.0, 0.0);


        vec4.transformMat4(pos, mat4.transpose(viewProjectMatrix), projected_pos);

        const computed_vp = mat4.multiply(projectMatrix, viewMatrix);
        console.log("computed_vp = ", computed_vp);


        // // console.log(projected_pos);
        // // 到剪裁空间（为啥这个库没有矩阵乘向量的操作？！）
        // for (let i = 0; i < 4; i++) {
        //     for (let j = 0; j < 4; j++) {
        //         let matrix_val = viewProjectMatrix[i * 4 + j];
        //         let pos_val = pos[j];
        //         projected_pos[i] += matrix_val * pos_val;
        //     }
        // }

        console.log("pos = ", pos);
        console.log("projected_pos = ", projected_pos);

        // 归一化到标准向量空间 NDC
        for (let i = 0; i < 4; i++) {
            projected_pos[i] /= projected_pos[3];
        }

        
        // console.log("pos = ", pos);

        let mip_val = -1.0;
        if (check_in_frustum(projected_pos)) {
            mip_val = 1.0;
            // console.log("projected_pos = ", projected_pos);
        }

        ret_arr = ret_arr.concat(1.0);                          // miplevel
        ret_arr = ret_arr.concat([0, 0, 0]);                    // padding
    }


    let flow_info = {};

    flow_info["flow_arr"] = ret_arr;
    flow_info["numParticles"] = counts;
    flow_info["lifetime"] = 10.0; // not used

    // console.log("counts = ", counts);
    // console.log("counts = ", ret_arr.length / 12);

    return flow_info;
}




// 保证 life time 的赋值正确即可，不需要大量的插值运算
function read_data_and_gen_line(lines_data, lifetime, color, insert_unit_cnt, segs) {

    let flow_info = {};

    let flow_arr = [];

    flow_info["flow_arr"] = flow_arr;
    let cnt = 0
    for (let key in lines_data) {
        cnt++;
        const item = lines_data[key];
        const len = item.position.length;
        const insert_stride = insert_unit_cnt + 1;
        const stride = lifetime / (len - 1) / insert_stride;

        // 设置一个随机的初始化 offset 看起来效果应该会好很多（但这样其实在语义上是错误的）
        // 这实际上表示你的粒子并非由同一时刻出发
        const seg_life = lifetime / segs;
        const rand_offset = Math.random() * seg_life;

        // 遍历一条流线中的每个粒子坐标
        // 并进行插值操作（暂不进行下采样）
        const scale = 50;
        for (let i = 0; i < len - 1; i++) {
            for (let j = 0; j < 3; j++) {
                item.position[i][j] /= scale; // 在相机结构体设置完成前，使用这个进行坐标缩放
            }


            const dir = [
                (item.position[i + 1][0] / scale - item.position[i][0]) / insert_stride,
                (item.position[i + 1][1] / scale - item.position[i][1]) / insert_stride,
                (item.position[i + 1][2] / scale - item.position[i][2]) / insert_stride
            ];
            for (let j = 0; j < insert_stride; j++) {
                let pos_temp = [
                    item.position[i][0] + dir[0] * j,
                    item.position[i][1] + dir[1] * j,
                    item.position[i][2] + dir[2] * j,
                    0.0  // padding
                ];


                flow_arr.push(...pos_temp);
                flow_arr.push(...color);

                const idx = i * insert_stride + j;
                flow_arr.push((idx * stride + rand_offset) % seg_life);
                flow_arr.push(...[0, 0, 0]); // padding
            }

        }
        if (cnt > 1000) {
            break;
        }
    }
    // console.log("max len = ", max_arr_len);
    // console.log("count = ", count);
    // console.log("lines_data = ", lines_data);

    console.log("cnt = ", cnt);

    flow_info["numParticles"] = flow_arr.length / 12;
    flow_info["lifetime"] = lifetime / segs;


    console.log("flow_info = ", flow_info);
    return flow_info;
}


export {
    read_data_and_gen_line,
    gen_sphere_instance,
    gen_customized_instance,
    updateMipLevel
};

