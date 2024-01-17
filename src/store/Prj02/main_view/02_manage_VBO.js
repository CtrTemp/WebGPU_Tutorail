
import { gen_sphere_instance_atlas_info } from "./gen_curve_line";


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
 *  在初始化阶段：仅对 VBOs position 相关的信息进行填充，用于使用compute shader计算MipLevel信息
 * */

function fill_Instance_Pos_VBO(state, device) {
    let instanceArr = state.CPU_storage.vertices_arr["instance"];
    const instancesBuffer = state.GPU_memory.VBOs["instances"];
    // console.log("instance_arr = ", instanceArr);
    const writeBufferArr = new Float32Array(instanceArr);
    device.queue.writeBuffer(instancesBuffer, 0, writeBufferArr);
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
 *  更新/填充 VBOs Atlas Info 相关的信息，并上传GPU
 * */
function fill_Atlas_Info_VBO(state, device) {
    let instance_arr = state.CPU_storage.vertices_arr["instance"];
    let mip_arr = state.CPU_storage.storage_arr["mip"];
    // console.log("instance_arr = ", instance_arr);
    // console.log("mip_arr = ", mip_arr);
    gen_sphere_instance_atlas_info(state, instance_arr, mip_arr);
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
                // position
                shaderLocation: 0,
                offset: 0,
                format: 'float32x4',
            },
            {
                // color
                shaderLocation: 1,
                offset: 4 * 4,
                format: 'float32x4'
            },
            {
                // lifetime
                shaderLocation: 2,
                offset: 8 * 4,
                format: 'float32'
            },
            {
                // idx for instanced texture
                shaderLocation: 3,
                offset: 9 * 4,
                format: 'float32'
            },
            {
                // uv offset
                shaderLocation: 4,
                offset: 10 * 4,
                format: 'float32x2'
            },
            {
                // uv scale
                shaderLocation: 5,
                offset: 12 * 4,
                format: 'float32x2'
            },
            {
                // quad scale
                shaderLocation: 6,
                offset: 14 * 4,
                format: 'float32x2'
            },
            {
                // default uv offset
                shaderLocation: 7,
                offset: 16 * 4,
                format: 'float32x2'
            },
            {
                // default uv scale
                shaderLocation: 8,
                offset: 18 * 4,
                format: 'float32x2'
            },
            {
                // default quad scale
                shaderLocation: 9,
                offset: 20 * 4,
                format: 'float32x2'
            },
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
                shaderLocation: 10,
                offset: 0,
                format: 'float32x2',
            },
            {
                // vertex uv
                shaderLocation: 11,
                offset: 2 * 4,
                format: 'float32x2',
            },
        ]
    };
    state.CPU_storage.VBO_Layouts["quad"] = quad_VBO_Layout;

}


export {
    VBO_creation,
    fill_Instance_Pos_VBO,
    fill_Quad_VBO,
    fill_Atlas_Info_VBO,
    manage_VBO_Layout,
}
