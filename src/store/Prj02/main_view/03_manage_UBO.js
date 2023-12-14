function manage_UBO(state, payload) {
    const device = payload.device;


    const MVP_Buffer_size = 4 * 4 * 4;
    const MVP_UBO_Buffer = device.createBuffer({
        size: MVP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.UBOs["mvp"] = MVP_UBO_Buffer;

    const RIGHT_Buffer_size = 3 * 4;
    const RIGHT_UBO_Buffer = device.createBuffer({
        size: RIGHT_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.UBOs["right"] = RIGHT_UBO_Buffer;

    const UP_Buffer_size = 3 * 4;
    const UP_UBO_Buffer = device.createBuffer({
        size: UP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.UBOs["up"] = UP_UBO_Buffer;


    const simu_Control_UBO_BufferSize =
        1 * 4 + // deltaTime
        3 * 4 + // padding
        4 * 4 + // seed
        1 * 4 + // particle_nums
        1 * 4 + // pause simulation
        2 * 4 + // padding
        0;
    const simu_Control_UBO_Buffer = device.createBuffer({
        size: simu_Control_UBO_BufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    state.UBOs["compute"] = simu_Control_UBO_Buffer;
}




export { manage_UBO }
