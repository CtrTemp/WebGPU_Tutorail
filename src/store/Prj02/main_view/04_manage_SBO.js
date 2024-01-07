

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
        size:  mip_SBO_Arr_size * 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["mip_read_back"] = mip_info_MappedBuffer;
}












export { SBO_creation }