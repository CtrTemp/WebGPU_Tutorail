/**
 *  解析场景信息，并填充相关全局变量
 * */
import {
    gen_sphere_instance_pos,
    gen_customized_instance_pos
} from "../main_view/gen_curve_line";

import { gen_rect_instance_pos } from "../quad_pack_view/gen_quad_pos_arr";

import { gen_cone_vertex_from_camera } from "../sub_view/gen_cone_vertex";


function parse_dataset_info(state) {


    const ret_json_pack = state.CPU_storage.server_raw_info["dataset_info_pack"];
    /**
     *  后续使用读取到的信息进行填充，现阶段先写死
     * */
    const numInstances = 100;
    const instanceInfoByteSize =
        4 * 4 + // pos
        4 * 4 + // color
        1 * 4 + // life time
        1 * 4 + // idx for instanced texture
        2 * 4 + // uv offset
        2 * 4 + // uv scale
        2 * 4 + // quad scale
        // 1 * 4 + // miplevel
        // 3 * 4 + // padding （注意，padding补全是非常有必要的！）
        0;

    state.CPU_storage.instance_info["numInstances"] = numInstances;
    state.CPU_storage.instance_info["instanceInfoByteSize"] = instanceInfoByteSize;


    const mip_range = 13;  // mip level 0~12 后面也应该从数据库中读取获得，这里暂时写死
    state.CPU_storage.mip_info["total_length"] = mip_range;
    state.CPU_storage.mip_info["arr"] = new Array(mip_range).fill(0);
    state.CPU_storage["mip_atlas_info"] = new Array(mip_range).fill([]);
    state.CPU_storage["quad_atlas_info"] = new Array(mip_range).fill([]);


    /**
     *  暂时在这里生成随机的场景信息
     * */
    // const flow_info = gen_sphere_instance_pos(50, numInstances); // main-view-3D
    const z_dist = 31 + 1;
    const horizontal_range = 100;
    const vertical_range = 200;
    const horizontal_cnt = 32;
    const vertical_cnt = 50;
    const flow_info = gen_rect_instance_pos(z_dist, horizontal_range, vertical_range, horizontal_cnt, vertical_cnt); // main-view-quad
    state.CPU_storage.vertices_arr["instance"] = flow_info.flow_arr;
    state.CPU_storage.instance_info["numInstances"] = horizontal_cnt * vertical_cnt;

    state.CPU_storage.storage_arr["mip"] = new Float32Array(horizontal_cnt * vertical_cnt).fill(0);

    /**
     *  生成 quad 信息（这个的确是写死的）
     * */
    const quadArr = [
        // X    Y    U   V 
        -1.0, -1.0, 0.0, 0.0,
        +1.0, -1.0, 1.0, 0.0,
        -1.0, +1.0, 0.0, 1.0,
        -1.0, +1.0, 0.0, 1.0,
        +1.0, -1.0, 1.0, 0.0,
        +1.0, +1.0, 1.0, 1.0
    ];
    state.CPU_storage.vertices_arr["quad"] = quadArr;

    // console.log("flow_info = ", flow_info);

    /**
     *  生成 cone vertex 信息
     * */
    const prim_camera = state.camera.prim_camera;
    const cone_vertices = gen_cone_vertex_from_camera(prim_camera);
    state.CPU_storage.vertices_arr["cone"] = cone_vertices;

    /**
     *  生成 cone index 信息
     * */
    const default_idx_data_arr = [
        // // near rect
        // 0, 1, 2,
        // 0, 2, 3,
        // // far rect
        // 4, 5, 6,
        // 4, 6, 7,

        // left trap
        5, 0, 1,
        0, 5, 4,
        // rigth trap
        3, 6, 2,
        6, 3, 7,
        // up trap
        4, 3, 0,
        3, 4, 7,
        // bottom trap
        2, 5, 1,
        5, 2, 6,
    ];
    state.CPU_storage.indices_arr["cone"] = default_idx_data_arr;

}














export { parse_dataset_info }