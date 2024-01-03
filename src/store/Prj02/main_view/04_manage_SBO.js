

function manage_SBO(state, device) {

    /**
     *  Mip SBO
     * */
    const mipArr = state.main_canvas.storage_arr["mip"];
    const mip_UBO_Arr_size = mipArr.length;
    const byteLength = 4;

    console.log("mip_UBO_Arr_size = ", mip_UBO_Arr_size);

    /**
     *  GPU 端 Storage Buffer
     * */ 
    const mipStorageBuffer = device.createBuffer({
        size: mip_UBO_Arr_size * byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
    });

    state.main_canvas.SBOs["mip"] = mipStorageBuffer;

    
    new Float32Array(mipStorageBuffer.getMappedRange()).set(mipArr);
    mipStorageBuffer.unmap();


    // /**
    //  *  Storage Buffer 在 CPU 端的映射
    //  * */ 
    // const mip_info_MappedBuffer = device.createBuffer({
    //     size:  mip_UBO_Arr_size * byteLength,
    //     usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    //     mappedAtCreation: true,
    // })
}












export { manage_SBO }