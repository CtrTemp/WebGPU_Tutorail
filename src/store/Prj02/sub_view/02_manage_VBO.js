import { gen_cone_vertex_from_camera } from "./gen_cone_vertex";

/**
 *  Cone VBO creation
 * */
function VBO_creation_sub(state, device) {
    const cone_vertices = state.CPU_storage.vertices_arr["cone"];
    const coneVBO = device.createBuffer({
        size: cone_vertices.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    state.GPU_memory.VBOs["cone"] = coneVBO;
}

/**
 *  Cone IBO creation
 * */ 
function IBO_creation_sub(state, device) {
    const IBO_Arr = state.CPU_storage.indices_arr["cone"];
    const indexCount = IBO_Arr.length;
    const indexBuffer = device.createBuffer({
        size: indexCount * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    state.GPU_memory.IBOs["cone"] = indexBuffer;
}


/**
 *  Fill Cone VBO
 * */
function Update_and_Fill_Cone_VBO(state, device) {
    const prim_camera = state.camera.prim_camera;

    const cone_vec = gen_cone_vertex_from_camera(prim_camera);
    state.CPU_storage.vertices_arr["cone"] = cone_vec; // update

    const coneVBO = state.GPU_memory.VBOs["cone"];
    const writeBufferArr = new Float32Array(cone_vec);
    
    device.queue.writeBuffer(coneVBO, /*bufferOffset=*/0, writeBufferArr);
}

/**
 *  Fill Cone IBO
 * */ 
function Fill_cone_IBO(state, device)
{
    const coneIBO = state.GPU_memory.IBOs["cone"];
    const coneArr = state.CPU_storage.indices_arr["cone"];
    const writeBufferArr = new Uint16Array(coneArr);
    
    device.queue.writeBuffer(coneIBO, /*bufferOffset=*/0, writeBufferArr);
}



function manage_VBO_Layout_sub(state) {

    const vertexBufferLayout = {
        arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT, // 一个float类型是4个字节，这表示每一个单一数据寻址需要跨越的字节段（一个二维坐标是两个float组成）
        attributes: [{
            format: "float32x3", // GPU可以理解的顶点数据类型格式，这里类似于指定其类型为 vec2 
            offset: 0,  // 指定顶点数据与整体数据开始位置的偏移
            shaderLocation: 0, // 等到 vertex shader 章节进行介绍
        }],
    };
    state.CPU_storage.VBO_Layouts["cone"] = vertexBufferLayout;

}

function manage_IBO_sub(state, device) {

    const default_idx_data_arr = new Int16Array([
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
    ]);
    state.CPU_storage.indices_arr["cone"] = default_idx_data_arr;
    const indexCount = default_idx_data_arr.length;
    const indexBuffer = device.createBuffer({
        size: indexCount * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX,
        mappedAtCreation: true,
    });
    {
        const mapping = new Uint16Array(indexBuffer.getMappedRange());
        mapping.set(default_idx_data_arr, 0);
        indexBuffer.unmap();
    }
    state.GPU_memory.IBOs["cone"] = indexBuffer;
}


export {
    VBO_creation_sub,
    IBO_creation_sub,
    Update_and_Fill_Cone_VBO,
    Fill_cone_IBO,
    manage_VBO_Layout_sub,
    manage_IBO_sub
}
