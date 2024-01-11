

function SBO_creation(state, device) {

    const mip_SBO_Arr_size = state.CPU_storage.instance_info["numInstances"];
    /**
     *  GPU 端 Storage Buffer
     * */
    const mipStorageBuffer = device.createBuffer({
        size: mip_SBO_Arr_size * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        // mappedAtCreation: true,
    });

    state.GPU_memory.SBOs["mip"] = mipStorageBuffer;


    /**
     *  Storage Buffer 在 CPU 端的映射 用于数据回传后读取以及向后端传输
     * */
    const mip_info_MappedBuffer = device.createBuffer({
        size: mip_SBO_Arr_size * 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["mip_read_back"] = mip_info_MappedBuffer;


    /**
     *  Trace Ray Nearest Pos SBO creation
     * */
    const Nearest_Hit_Distance_SBO_BufferSize =
        1 * 4 + // float
        3 * 4 + // padding
        0;
    const Nearest_Hit_Distance_SBO = device.createBuffer({
        size: Nearest_Hit_Distance_SBO_BufferSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["nearest_hit_dist"] = Nearest_Hit_Distance_SBO;


}



function fill_nearest_dist_SBO_init(state, device) {
    const nearest_dist_Buffer = state.GPU_memory.SBOs["nearest_hit_dist"];
    const writeBuffer = new Float32Array([0.0]);
    device.queue.writeBuffer(nearest_dist_Buffer, 0, writeBuffer);
}








export { SBO_creation, fill_nearest_dist_SBO_init }