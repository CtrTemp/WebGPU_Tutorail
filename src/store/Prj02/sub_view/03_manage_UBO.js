function manage_UBO(state, payload) {
    const device = payload.device;

    const MVP_Buffer_size = 4 * 4 * 4;
    const MVP_UBO_Buffer = device.createBuffer({
        size: MVP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.UBOs["mvp"] = MVP_UBO_Buffer;
}




export { manage_UBO }
