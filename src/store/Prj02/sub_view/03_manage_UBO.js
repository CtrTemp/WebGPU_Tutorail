function manage_UBO_sub(state, device) {

    const MVP_Buffer_size = 4 * 4 * 4;
    const MVP_UBO_Buffer = device.createBuffer({
        size: MVP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.sub_canvas.UBOs["mvp"] = MVP_UBO_Buffer;

    const RIGHT_Buffer_size = 3 * 4;
    const RIGHT_UBO_Buffer = device.createBuffer({
        size: RIGHT_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.sub_canvas.UBOs["right"] = RIGHT_UBO_Buffer;

    const UP_Buffer_size = 3 * 4;
    const UP_UBO_Buffer = device.createBuffer({
        size: UP_Buffer_size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    state.sub_canvas.UBOs["up"] = UP_UBO_Buffer;
}




export { manage_UBO_sub }
