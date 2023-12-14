

function manage_VBO(state, payload) {

    const device = payload.device;
    // CPU 端数据
    const vertices = new Float32Array([
        // near rect
        0.2, 0.2, 0.0,
        0.2, -0.2, 0.0,
        -0.2, -0.2, 0.0,
        -0.2, 0.2, 0.0,

        // far rect
        0.8, 0.8, 2.5,
        0.8, -0.8, 2.5,
        -0.8, -0.8, 2.5,
        -0.8, 0.8, 2.5,
    ]);

    state.vertices_arr["rect"] = vertices;


    // 顶点缓冲区创建
    const vertexBuffer = device.createBuffer({
        label: "Cell vertices",
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    state.VBOs["rect"] = vertexBuffer;

    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);
}



function manage_VBO_Layout(state, payload) {

    const vertexBufferLayout = {
        arrayStride: 12, // 一个float类型是4个字节，这表示每一个单一数据寻址需要跨越的字节段（一个二维坐标是两个float组成）
        attributes: [{
            format: "float32x3", // GPU可以理解的顶点数据类型格式，这里类似于指定其类型为 vec2 
            offset: 0,  // 指定顶点数据与整体数据开始位置的偏移
            shaderLocation: 0, // 等到 vertex shader 章节进行介绍
        }],
    };
    state.VBO_Layouts["rect"] = vertexBufferLayout;

}

function manage_IBO(state, payload) {
    const device = payload.device;

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
    state.indices_arr["rect"] = default_idx_data_arr;
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
    state.IBOs["rect"] = indexBuffer;
}


export {
    manage_VBO, manage_VBO_Layout, manage_IBO
}
