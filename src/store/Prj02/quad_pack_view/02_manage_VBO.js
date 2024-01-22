
import { gen_rect_instance_atlas_info } from "./gen_quad_pos_arr";




/**
 *  2024/01/22 晚饭前
 *  回来注销掉所有的 main-view 文件夹下的内容，之后就不会再使用了
 *  将有用的函数一并归入到 quad_pack_view 中
 *  sub_view 保留，并不进行修改
 *  重写VBO结构，将数据结构分开存放，分开更新
 * */ 


function create_pos_VBO(state, device)
{
    const instancesBuffer = device.createBuffer({
        size: numInstances * instanceInfoByteSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        // mappedAtCreation: true,
    })
    state.GPU_memory.VBOs["instances"] = instancesBuffer;
}


function createVBO_repectively(state, device)
{
     
}





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
