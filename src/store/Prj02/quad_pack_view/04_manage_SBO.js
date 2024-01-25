

function SBO_creation(state, device) {

    const instance_cnt = state.CPU_storage.instance_info["numInstances"];


    // /**
    //  *  Layout-2d-similarity SBO
    //  * */
    // const Layout_2d_SBO = device.createBuffer({
    //     size: instance_cnt * 4 * 2,
    //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    //     // mappedAtCreation: true,
    // });
    // state.GPU_memory.SBOs["layout_2d"] = Layout_2d_SBO;


    // /**
    //  *  Layout-3d-similarity SBO
    //  * */
    // const Layout_3d_SBO = device.createBuffer({
    //     size: instance_cnt * 4 * 3,
    //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    //     // mappedAtCreation: true,
    // });
    // state.GPU_memory.SBOs["layout_3d"] = Layout_3d_SBO;


    /**
     *  current atlas info SBO
     * */
    const atlas_info_stride = state.CPU_storage.atlas_info["stride"];
    const Current_Atlas_Info_SBO = device.createBuffer({
        size: instance_cnt * atlas_info_stride * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["cur_atlas_info"] = Current_Atlas_Info_SBO;



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
        size: instance_cnt * 4 * 1,
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



    /**
     *  Instance Moving Simulation Related SBO
     * */
    const simulation_info_size =
        1 * 4 + // current layout
        1 * 4 + // last layout
        1 * 4 + // base simu-speed
        1 * 4 + // pause flag
        0;
    const Simulation_Control_SBO = device.createBuffer({
        size: simulation_info_size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    state.GPU_memory.SBOs["simu_control"] = Simulation_Control_SBO;
}



function fill_nearest_dist_SBO_init(state, device) {
    const nearest_dist_Buffer = state.GPU_memory.SBOs["nearest_hit_dist"];
    const writeBuffer = new Float32Array([0.0]);
    device.queue.writeBuffer(nearest_dist_Buffer, 0, writeBuffer);
}


function update_simulation_SBO_quad(state, device) {
    const simu_control_UBO = state.GPU_memory.SBOs["simu_control"];
    // console.log(Object.values(state.main_canvas.simu_info));
    const write_buffer = new Float32Array(Object.values(state.main_canvas.simu_info));
    device.queue.writeBuffer(simu_control_UBO, 0, write_buffer);
}




export {
    SBO_creation,
    update_simulation_SBO_quad,
    fill_nearest_dist_SBO_init,
}