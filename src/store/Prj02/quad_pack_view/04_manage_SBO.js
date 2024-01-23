

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
        size: instance_cnt * 4 * 1,
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


// function fill_atlas_info_SBO(state, device) {

//     const stride = state.CPU_storage.atlas_info["stride"];;

//     const quadBitMap = state.CPU_storage.quadBitMap;
    
//     const map = {
//         5: 0,
//         4: 1,
//         3: 2,
//         2: 3,
//     }
//     /**
//      *  遍历每一个 MipLevel
//      * */
//     for (let i = 0; i < quadBitMap.length; i++) {
        
//         const Texture_idx = map[i];

//         /**
//          *  遍历当前MipLevel中的所有图片
//          * */
//         const instance_len = quadBitMap[i].length;

//         for (let j = 0; j < instance_len; j++) {

//             const imageBitmap = quadBitMap[i][j]["bitMap"];
//             const img_width = imageBitmap.width;
//             const img_height = imageBitmap.height;

//             // 填充
//             device.queue.copyExternalImageToTexture(
//                 { source: imageBitmap }, // src
//                 { texture: instanceTexture, origin: [width_offset, height_offset, 0], flipY: false }, // dst （flipY 好像没啥卵用）
//                 [img_width, img_height] // size
//             );

//             offset += img_width * img_height;
//             width_offset += img_width;
//             if (width_offset >= global_texture_size) {
//                 height_offset += img_height;
//                 width_offset = 0;
//             }

//         }
//     }

//     // state.CPU_storage.atlas_info.arr
// }





export {
    SBO_creation,
    update_simulation_SBO_quad,
}