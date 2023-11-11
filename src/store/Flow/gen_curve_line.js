
import { mat4, vec3, vec4 } from "wgpu-matrix"

function gen_straight_line_arr(p1, p2, particle_counts) {

    let dir_vec = vec3.create();

    let seg_count = particle_counts - 1;

    dir_vec[0] = (p2[0] - p1[0]) / seg_count;
    dir_vec[1] = (p2[1] - p1[1]) / seg_count;
    dir_vec[2] = (p2[2] - p1[2]) / seg_count;

    let ret_arr = new Array();


    for (let i = 0; i < particle_counts; i++) {
        let arr_temp = [];

        arr_temp.push(p1[0]);
        arr_temp.push(p1[1]);
        arr_temp.push(p1[2]);
        p1[0] += dir_vec[0];
        p1[1] += dir_vec[1];
        p1[2] += dir_vec[2];
        ret_arr.push(arr_temp);
    }


    return ret_arr;
}


function gen_axis_line_arr(particle_counts) {
    let x_axis = gen_straight_line_arr([0, 0, 0], [1.0, 0.0, 0.0], particle_counts);
    let y_axis = gen_straight_line_arr([0, 0, 0], [0.0, 1.0, 0.0], particle_counts);
    let z_axis = gen_straight_line_arr([0, 0, 0], [0.0, 0.0, 1.0], particle_counts);

    let arr = x_axis.concat(y_axis).concat(z_axis);

    return arr;
}

function gen_sin_func_arr(particle_counts) {
    const ret_arr = [];
    // const test_sin = Math.sin(0);
    // console.log("test_sin = ", test_sin);

    let seg_count = particle_counts - 1;
    let step = 1 / seg_count;

    for (let i = 0; i < particle_counts; i++) {
        let arr_temp = [];
        arr_temp.push(step * i - 0.5);
        arr_temp.push(Math.sin(step * i * 2 * Math.PI) / 2);
        arr_temp.push(0.0);

        ret_arr.push(arr_temp);
    }

    return ret_arr;
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


export { gen_straight_line_arr, gen_axis_line_arr, gen_sin_func_arr, read_data_and_gen_line };

