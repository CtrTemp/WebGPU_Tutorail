
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
        arr_temp.push(step * i-0.5);
        arr_temp.push(Math.sin(step * i * 2 * Math.PI)/2);
        arr_temp.push(0.0);

        ret_arr.push(arr_temp);
    }

    return ret_arr;
}



export { gen_straight_line_arr, gen_axis_line_arr, gen_sin_func_arr };

