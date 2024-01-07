function UBO_creation_sub(state, device) {

    const MVP_Buffer_size = 4 * 4 * 4;
    const MVP_UBO_Buffer = device.createBuffer({
        size: MVP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.GPU_memory.UBOs["mvp_sub"] = MVP_UBO_Buffer;

    const RIGHT_Buffer_size = 3 * 4;
    const RIGHT_UBO_Buffer = device.createBuffer({
        size: RIGHT_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.GPU_memory.UBOs["right_sub"] = RIGHT_UBO_Buffer;

    const UP_Buffer_size = 3 * 4;
    const UP_UBO_Buffer = device.createBuffer({
        size: UP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.GPU_memory.UBOs["up_sub"] = UP_UBO_Buffer;
}

function fill_MVP_UBO_sub(state, device) {
    
    const viewProjectionMatrix = state.camera.sub_camera["matrix"];
    const viewMatrix = state.camera.sub_camera["view"];
    /**
     *  View-Projection Matrix
     * */ 
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["mvp_sub"],
        0,
        viewProjectionMatrix.buffer,
        viewProjectionMatrix.byteOffset,
        viewProjectionMatrix.byteLength
    );

    /**
     *  Right Up Vector
     * */ 
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["right_sub"],
        0,
        new Float32Array([
            viewMatrix[0], viewMatrix[4], viewMatrix[8], // right
        ])
    );
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["up_sub"],
        0,
        new Float32Array([
            viewMatrix[1], viewMatrix[5], viewMatrix[9], // up
        ])
    );

}




export {
    UBO_creation_sub,
    fill_MVP_UBO_sub,
}
