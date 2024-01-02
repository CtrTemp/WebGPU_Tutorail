
async function manage_VBO(state, device) {

    // CPU 端数据
    const vertices = new Float32Array([
        0.0, 0.8,
        -0.8, -0.8,
        0.8, -0.8,
    ]);

    state.vertices_arr["triangle"] = vertices;

    // 顶点缓冲区创建
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });


    state.VBOs["triangle"] = vertexBuffer;

    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);

    console.log("vertex buffer = ", vertexBuffer);

    console.log("VBO manage done~");
}



function manage_VBO_Layout(state) {

    const vertexBufferLayout = {
        arrayStride: 8, // 一个float类型是4个字节，这表示每一个单一数据寻址需要跨越的字节段（一个二维坐标是两个float组成）
        attributes: [{
            format: "float32x2", // GPU可以理解的顶点数据类型格式，这里类似于指定其类型为 vec2 
            offset: 0,  // 指定顶点数据与整体数据开始位置的偏移
            shaderLocation: 0, // 等到 vertex shader 章节进行介绍
        }],
    };

    state.VBO_Layouts["triangle"] = vertexBufferLayout;
    console.log("VBO_Layout manage done~");
}


export {
    manage_VBO,
    manage_VBO_Layout,
}
