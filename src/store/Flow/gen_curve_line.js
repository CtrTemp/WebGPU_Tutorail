
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


// 這個數據結構感覺要重寫！！！
function gen_axis_line_arr(particle_counts) {
    let x_axis = gen_straight_line_arr([0, 0, 0], [1.0, 0.0, 0.0], particle_counts);
    let y_axis = gen_straight_line_arr([0, 0, 0], [0.0, 1.0, 0.0], particle_counts);
    let z_axis = gen_straight_line_arr([0, 0, 0], [0.0, 0.0, 1.0], particle_counts);

    let arr =  x_axis.concat(y_axis).concat(z_axis);

    return arr;
}





export { gen_straight_line_arr, gen_axis_line_arr };

