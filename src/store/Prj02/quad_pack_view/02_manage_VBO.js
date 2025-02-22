
import { gen_rect_instance_atlas_info } from "./gen_quad_pos_arr";




/**
 *  2024/01/22 晚饭前
 *  回来注销掉所有的 main-view 文件夹下的内容，之后就不会再使用了
 *  将有用的函数一并归入到 quad_pack_view 中
 *  sub_view 保留，并不进行修改
 *  重写VBO结构，将数据结构分开存放，分开更新
 * */ 

/**
 *  仅进行 VBO 的创建，并不进行填充
 * */
function VBO_creation(state, device) {
    const numInstances = state.CPU_storage.instance_info["numInstances"];
    const instanceInfoByteSize = state.CPU_storage.instance_info["instanceInfoByteSize"];
    /**
     *  Instance VBO
     * */
    const instancesBuffer = device.createBuffer({
        size: numInstances * instanceInfoByteSize,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        // mappedAtCreation: true,
    })
    state.GPU_memory.VBOs["instances"] = instancesBuffer;

    /**
     *  Quad VBO
     * */
    const quadArr = state.CPU_storage.vertices_arr["quad"];
    const quadVertexBuffer = device.createBuffer({
        size: quadArr.length * Float32Array.BYTES_PER_ELEMENT, // 6x vec4<f32>
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.VBOs["quad"] = quadVertexBuffer;
}


/**
 *  填充 quad VBO 信息
 * */
function fill_Quad_VBO(state, device) {
    let quadArr = state.CPU_storage.vertices_arr["quad"];
    const quadBuffer = state.GPU_memory.VBOs["quad"];

    const writeBufferArr = new Float32Array(quadArr);
    device.queue.writeBuffer(quadBuffer, 0, writeBufferArr);
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



/**
 *  VBO Layout Creation 
 * */
function manage_VBO_Layout(state) {

    const instance_VBO_Layout = {
        arrayStride: state.CPU_storage.instance_info["instanceInfoByteSize"], // 这里是否要补全 padding 呢？？？
        stepMode: "instance", // 这个设置的含义是什么
        attributes: [
            {
                // idx
                shaderLocation: 0,
                offset: 0 * 4,
                format: 'float32',
            },
            {
                // position
                shaderLocation: 1,
                offset: 4 * 4,
                format: 'float32x4',
            },
            {
                // pos offset (for interaction)
                shaderLocation: 2,
                offset: 8 * 4,
                format: 'float32x4'
            },
            {
                // Default Layout pos
                shaderLocation: 3,
                offset: 12 * 4,
                format: 'float32x4',
            },
            {
                // Layout 2d similarity
                shaderLocation: 4,
                offset: 16 * 4,
                format: 'float32x4',
            },
            {
                // Layout 3d similarity
                shaderLocation: 5,
                offset: 20 * 4,
                format: 'float32x4',
            },
            {
                // Layout-flag
                shaderLocation: 6,
                offset: 24 * 4,
                format: 'float32'
            },
            {
                // idx for instanced texture
                shaderLocation: 7,
                offset: 25 * 4,
                format: 'float32'
            },
            {
                // Default uv offset
                shaderLocation: 8,
                offset: 26 * 4,
                format: 'float32x2'
            },
            {
                // Default uv scale
                shaderLocation: 9,
                offset: 28 * 4,
                format: 'float32x2'
            },
            {
                // Default quad scale
                shaderLocation: 10,
                offset: 30 * 4,
                format: 'float32x2'
            }
        ]
    };
    state.CPU_storage.VBO_Layouts["instances"] = instance_VBO_Layout;

    const quad_VBO_Layout = {
        arrayStride: 4 * 4, // 这里是否要补全 padding 呢？？？
        stepMode: "vertex", // 这个设置的含义是什么（注意可能和 instance 有关）（默认是vertex）
        // 这个的设置很有可能与 WebGPU 没有 geometry shader 存在互补性
        attributes: [
            {
                // vertex position
                shaderLocation: 11,
                offset: 0,
                format: 'float32x2',
            },
            {
                // vertex uv
                shaderLocation: 12,
                offset: 2 * 4,
                format: 'float32x2',
            },
        ]
    };
    state.CPU_storage.VBO_Layouts["quad"] = quad_VBO_Layout;

}



export {
    VBO_creation,
    fill_quad_Instance_Pos_VBO,
    fill_quad_Atlas_Info_VBO,
    fill_Quad_VBO,
    manage_VBO_Layout,
}
