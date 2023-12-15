
import { mat4, vec3, vec4 } from "wgpu-matrix"

/**
 *  从一个已经定义好的相机参数中得到梯台的顶点信息
 * */
function gen_cone_vertex_from_camera(camera, range_near, range_far) {

    const fov = camera.fov;
    const aspect = camera.aspect;

    const y_offset_near = range_near * Math.tan(fov / 2);
    const x_offset_near = y_offset_near / aspect;
    const y_offset_far = range_far * Math.tan(fov / 2);
    const x_offset_far = y_offset_far / aspect;

    const lookFrom = camera.lookFrom;

    const v = camera.viewDir;
    const u = camera.up;
    const r = vec3.cross(v, u);

    const near_center = vec3.add(lookFrom, vec3.mulScalar(v, range_near));
    const far_center = vec3.add(lookFrom, vec3.mulScalar(v, range_far));

    const operator = [
        [+1, +1],
        [-1, +1],
        [-1, -1],
        [+1, -1],
    ]


    let ret_vec_temp = [];

    // near rect
    for (let i = 0; i < operator.length; i++) {
        let u_temp = u;
        let r_temp = r;
        if (operator[i][0] < 0) {
            vec3.mulScalar(u_temp, -1, u_temp);
        }
        if (operator[i][1] < 0) {
            vec3.mulScalar(r_temp, -1, r_temp);
        }
        ret_vec_temp.push(vec3.add(near_center, vec3.add(
            vec3.mulScalar(u_temp, y_offset_near),
            vec3.mulScalar(r_temp, x_offset_near),
        )));
    }

    // far rect
    for (let i = 0; i < operator.length; i++) {
        let u_temp = u;
        let r_temp = r;
        if (operator[i][0] < 0) {
            vec3.mulScalar(u_temp, -1, u_temp);
        }
        if (operator[i][1] < 0) {
            vec3.mulScalar(r_temp, -1, r_temp);
        }
        ret_vec_temp.push(vec3.add(far_center, vec3.add(
            vec3.mulScalar(u_temp, y_offset_far),
            vec3.mulScalar(r_temp, x_offset_far),
        )));
    }
    // console.log("ret_vec temp = ", ret_vec_temp);

    let ret_vec = [];

    for (let i = 0; i < ret_vec_temp.length; i++) {
        for (let j = 0; j < ret_vec_temp[i].length; j++) {
            ret_vec.push(ret_vec_temp[i][j]);
        }
    }

    // console.log("ret_vec = ", ret_vec);

    return ret_vec;
}


export {
    gen_cone_vertex_from_camera
}
