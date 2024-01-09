
import { gen_rect_instance_atlas_info } from "./gen_quad_pos_arr";




/**
 *  在初始化阶段：仅对 VBOs position 相关的信息进行填充，用于使用compute shader计算MipLevel信息
 * */

function fill_quad_Instance_Pos_VBO(state, device) {
    let instanceArr = state.CPU_storage.vertices_arr["instance"];
    const instancesBuffer = state.GPU_memory.VBOs["instances"];
    // console.log("instance_arr = ", instanceArr);
    const writeBufferArr = new Float32Array(instanceArr);
    device.queue.writeBuffer(instancesBuffer, 0, writeBufferArr);
}


/**
 *  更新/填充 VBOs Atlas Info 相关的信息，并上传GPU
 * */
function fill_quad_Atlas_Info_VBO(state, device) {
    let instance_arr = state.CPU_storage.vertices_arr["instance"];
    let mip_arr = state.CPU_storage.storage_arr["mip"];
    // console.log("instance_arr = ", instance_arr);
    // console.log("mip_arr = ", mip_arr);
    gen_rect_instance_atlas_info(state, instance_arr, mip_arr);
    const writeBufferArr = new Float32Array(instance_arr);

    const instancesBuffer = state.GPU_memory.VBOs["instances"];
    device.queue.writeBuffer(instancesBuffer, 0, writeBufferArr);
}



export {
    fill_quad_Instance_Pos_VBO,
    fill_quad_Atlas_Info_VBO,
}
