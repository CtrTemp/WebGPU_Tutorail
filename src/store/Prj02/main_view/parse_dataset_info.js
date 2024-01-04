/**
 *  解析场景信息，并填充相关全局变量
 * */
import { gen_sphere_instance_pos } from "./gen_curve_line";


function parse_dataset_info(state, ret_json_pack) {
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

    state.main_canvas.instance_info["numInstances"] = numInstances;
    state.main_canvas.instance_info["instanceInfoByteSize"] = instanceInfoByteSize;


    const mip_range = 13;  // mip level 0~12 后面也应该从数据库中读取获得，这里暂时写死
    state.main_canvas.mip_info["total_length"] = mip_range;


    /**
     *  暂时在这里生成随机的场景信息
     * */ 
    const flow_info = gen_sphere_instance_pos(50, numInstances, state);
    state.main_canvas.vertices_arr["instance"] = flow_info.flow_arr;

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
    state.main_canvas.vertices_arr["quad"] = quadArr;

    // console.log("flow_info = ", flow_info);
}














export { parse_dataset_info }