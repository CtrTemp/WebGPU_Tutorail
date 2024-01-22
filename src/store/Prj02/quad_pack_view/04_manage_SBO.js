

function SBO_creation(state, device) {

    
    const instance_cnt = state.CPU_storage.instance_info["numInstances"];



    /**
     *  GPU 端 Storage Buffer
     * */ 
    const mipStorageBuffer = device.createBuffer({
        size: instance_cnt * 4 * 1,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        // mappedAtCreation: true,
    });

    state.GPU_memory.SBOs["mip"] = mipStorageBuffer;


    /**
     *  Storage Buffer 在 CPU 端的映射 用于数据回传后读取以及向后端传输
     * */ 
    const mip_info_MappedBuffer = device.createBuffer({
        size:  instance_cnt * 4 * 1,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["mip_read_back"] = mip_info_MappedBuffer;
}




function update_simulation_SBO_quad(state, device) {
    const simu_control_UBO = state.GPU_memory.SBOs["simu_control"];
    // console.log(Object.values(state.main_canvas.simu_info));
    const write_buffer = new Float32Array(Object.values(state.main_canvas.simu_info));
    device.queue.writeBuffer(simu_control_UBO, 0, write_buffer);
}








export { SBO_creation, update_simulation_SBO_quad }