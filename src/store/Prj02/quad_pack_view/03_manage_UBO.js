
// function UBO_creation(state, device) {

//     /**
//      *  MVP-Matrix
//      * */
//     const MVP_Buffer_size = 4 * 4 * 4;
//     const MVP_UBO_Buffer = device.createBuffer({
//         size: MVP_Buffer_size,
//         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
//     });
//     state.GPU_memory.UBOs["mvp"] = MVP_UBO_Buffer;

//     /**
//      *  View-Matrix
//      * */
//     const View_Buffer_size = 4 * 4 * 4;
//     const View_UBO_Buffer = device.createBuffer({
//         size: View_Buffer_size,
//         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
//     });
//     state.GPU_memory.UBOs["view"] = View_UBO_Buffer;

//     /**
//      *  Projection-Matrix
//      * */
//     const Projection_Buffer_size = 4 * 4 * 4;
//     const Projection_UBO_Buffer = device.createBuffer({
//         size: Projection_Buffer_size,
//         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
//     });
//     state.GPU_memory.UBOs["projection"] = Projection_UBO_Buffer;

//     /**
//      *  right side vec
//      * */
//     const RIGHT_Buffer_size = 3 * 4;
//     const RIGHT_UBO_Buffer = device.createBuffer({
//         size: RIGHT_Buffer_size,
//         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
//     });
//     state.GPU_memory.UBOs["right"] = RIGHT_UBO_Buffer;

//     /**
//      *  up side vec
//      * */
//     const UP_Buffer_size = 3 * 4;
//     const UP_UBO_Buffer = device.createBuffer({
//         size: UP_Buffer_size,
//         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
//     });
//     state.GPU_memory.UBOs["up"] = UP_UBO_Buffer;


//     const simu_Control_UBO_BufferSize =
//         1 * 4 + // deltaTime
//         3 * 4 + // padding
//         4 * 4 + // seed
//         1 * 4 + // particle_nums
//         1 * 4 + // pause simulation
//         2 * 4 + // padding
//         0;
//     const simu_Control_UBO_Buffer = device.createBuffer({
//         size: simu_Control_UBO_BufferSize,
//         usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
//     });
//     state.GPU_memory.UBOs["compute"] = simu_Control_UBO_Buffer;
// }

function fill_MVP_UBO_quad(state, device) {

    /**
     *  View Matrix
     * */
    const viewMatrix = state.camera.prim_camera["view"];
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["view"],
        0,
        viewMatrix.buffer,
        viewMatrix.byteOffset,
        viewMatrix.byteLength
    );


    /**
     *  Projection Matrix
     * */
    const projectionMatrix = state.camera.prim_camera["projection"];
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["projection"],
        0,
        projectionMatrix.buffer,
        projectionMatrix.byteOffset,
        projectionMatrix.byteLength
    );


    /**
     *  View-Projection Matrix
     * */
    const viewProjectionMatrix = state.camera.prim_camera["matrix"];
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["mvp"],
        0,
        viewProjectionMatrix.buffer,
        viewProjectionMatrix.byteOffset,
        viewProjectionMatrix.byteLength
    );

    /**
     *  Right Up Vector
     * */
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["right"],
        0,
        new Float32Array([
            viewMatrix[0], viewMatrix[4], viewMatrix[8], // right
        ])
    );
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["up"],
        0,
        new Float32Array([
            viewMatrix[1], viewMatrix[5], viewMatrix[9], // up
        ])
    );

}


function update_simulation_UBO_quad(state, device) {
    const simu_control_UBO = state.GPU_memory.UBOs["simu_control"];
    // console.log(Object.values(state.main_canvas.simu_info));
    const write_buffer = new Float32Array(Object.values(state.main_canvas.simu_info));
    device.queue.writeBuffer(simu_control_UBO, 0, write_buffer);
}

export { fill_MVP_UBO_quad, update_simulation_UBO_quad }
