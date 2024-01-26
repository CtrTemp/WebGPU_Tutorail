

function quadTexture_creation(state, device) {
    /**
     *  Sampler
     * */
    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });


    state.CPU_storage.additional_info["sampler"] = sampler;


    /**
     *  depth Texture
     * */
    const depthTexture = device.createTexture({
        size: [state.main_canvas.canvas.width, state.main_canvas.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    state.GPU_memory.Textures["depth"] = depthTexture;



    // /**
    //  *  Instance Texture (big texture) creation
    //  * */

    // const global_texture_size = Math.pow(2, 13);    // 大纹理尺寸为 8192*8192
    // state.CPU_storage.atlas_info["size"] = [global_texture_size, global_texture_size];

    // /**
    //  *  对于 quad 平铺，我们只创建一张大纹理
    //  * */
    // const quadInstanceTexture = device.createTexture({
    //     dimension: '2d',
    //     size: [global_texture_size, global_texture_size, 1],
    //     format: 'rgba8unorm',
    //     usage:
    //         GPUTextureUsage.TEXTURE_BINDING |
    //         GPUTextureUsage.COPY_DST |
    //         GPUTextureUsage.RENDER_ATTACHMENT,
    // });

    // state.GPU_memory.Textures["quad_instance"].push(quadInstanceTexture);



    /**
     *  Instance Texture (big texture) creation
     * */


    // // 2024/01/17 弃用
    // /**
    //  *  遍历每一个 MipLevel
    //  * */
    // const mip_range = state.CPU_storage.mip_info["total_length"];
    // for (let i = 0; i < mip_range; i++) {
    //     // 为每一个MipLevel创建一张大纹理
    //     const global_texture_size = Math.pow(2, 13);  // 8192 * 8192
    //     state.CPU_storage.atlas_info["size"].push([global_texture_size, global_texture_size]);
    //     const instanceTexture = device.createTexture({
    //         dimension: '2d',
    //         size: [global_texture_size, global_texture_size, 1],
    //         format: 'rgba8unorm',
    //         usage:
    //             GPUTextureUsage.TEXTURE_BINDING |
    //             GPUTextureUsage.COPY_DST |
    //             GPUTextureUsage.RENDER_ATTACHMENT,
    //     });

    //     state.GPU_memory.Textures["quad_instance"].push(instanceTexture);
    // }

    /**
     *  2024/01/17 创建大型预取纹理，一共6张
     * */
    for (let i = 0; i < 6; i++) {
        const global_texture_size = Math.pow(2, 13);  // 8192 * 8192
        state.CPU_storage.atlas_info["size"].push([global_texture_size, global_texture_size]);
        const instanceTexture = device.createTexture({
            dimension: '2d',
            size: [global_texture_size, global_texture_size, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        state.GPU_memory.Textures["large_quad_prefetch"].push(instanceTexture);
    }

    /**
     *  2024/01/23 创建运行时预取纹理，一共5张
     * */

    for (let i = 0; i < 5; i++) {
        const global_texture_size = Math.pow(2, 13);  // 8192 * 8192
        state.CPU_storage.atlas_info["size"].push([global_texture_size, global_texture_size]);
        const instanceTexture = device.createTexture({
            dimension: '2d',
            size: [global_texture_size, global_texture_size, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        state.GPU_memory.Textures["dynamic_prefetch"].push(instanceTexture);
    }



}


function fill_Quad_Texture(state, device) {

    const quadBitMap = state.CPU_storage["quadBitMap"];


    state.CPU_storage["quad_atlas_info"].fill([]); // 清空原有图片集信息


    const global_texture_size = state.CPU_storage.atlas_info["size"][0][0];


    /**
     *  遍历每一个 MipLevel
     * */
    for (let i = 0; i < quadBitMap.length; i++) {
        // console.log("i = ", quadBitMap[i].length);

        /**
         *  为每一个MipLevel创建一张大纹理
         * */
        const instanceTexture = state.GPU_memory.Textures["quad_instance"][i]

        let offset = 0;         // 总内存偏移

        let width_offset = 0;   // 当前图片在大纹理内的宽度偏移
        let height_offset = 0;  // 当前图片在大纹理内的高度偏移

        /**
         *  遍历当前MipLevel中的所有图片
         * */
        const instance_len = quadBitMap[i].length;
        let quad_atlas_info = {
            uv_offset: [],  // 用于记录instance对应图片纹理在大纹理中的uv偏移
            uv_size: [],    // 用于记录instance对应图片纹理在大纹理中的uv归一化宽高尺寸
            tex_aspect: [], // 用于记录instance对应图片纹理的宽高比系数
        };

        for (let j = 0; j < instance_len; j++) {

            const imageBitmap = quadBitMap[i][j];
            const img_width = imageBitmap.width;
            const img_height = imageBitmap.height;


            /**
             *  目前不使用任何密铺算法，直接根据宽高偏移将图片写入，当然这毫无“局部性”可言
             * 也就无法带来任何性能上的优化。
             * */
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap }, // src
                { texture: instanceTexture, origin: [width_offset, height_offset, 0], flipY: false }, // dst （flipY 好像没啥卵用）
                [img_width, img_height] // size
            );
            // mip_instance.push();
            quad_atlas_info["uv_offset"].push([width_offset / global_texture_size, height_offset / global_texture_size]);

            let tex_aspect = [1.0, 1.0];
            if (img_width >= img_height) {
                tex_aspect[1] = img_height / img_width;
            }
            else {
                tex_aspect[0] = img_width / img_height;
            }


            quad_atlas_info["tex_aspect"].push(tex_aspect);
            quad_atlas_info["uv_size"].push([img_width / global_texture_size, img_height / global_texture_size]);

            offset += img_width * img_height;
            width_offset += img_width;
            if (width_offset >= global_texture_size) {
                height_offset += img_height;
                width_offset = 0;
            }

        }
        state.CPU_storage["quad_atlas_info"][i] = quad_atlas_info;
        state.GPU_memory.Textures["quad_instance"][i] = instanceTexture;
    }


    // console.log("atlas info = ", state.CPU_storage["quad_atlas_info"]);
}


/**
 *  晚餐返回后进行纹理内存填充
 * */
function fill_Large_Quad_Texture(state, device) {
    const global_texture_size = state.CPU_storage.atlas_info["size"][0][0];
    const largeBitMaps = state.CPU_storage.largeBitMap;
    // console.log("largeBitMaps = ", largeBitMaps);

    // 直接填充
    for (let i = 0; i < largeBitMaps.length; i++) {
        const BitMap = largeBitMaps[i];
        const Texture = state.GPU_memory.Textures["large_quad_prefetch"][i];
        device.queue.copyExternalImageToTexture(
            { source: BitMap }, // src
            { texture: Texture }, // dst （flipY 好像没啥卵用）
            [global_texture_size, global_texture_size] // size
        );
    }
}


/**
 *  2024-01-23晚饭前
 *  晚饭回来想这里应该咋更新纹理！！！就快成功了~
 * */
function dynamic_fetch_update_Texture(state, device) {

    const global_texture_size = state.CPU_storage.atlas_info["size"][0][0];

    const quadBitMap = state.CPU_storage.quadBitMap;

    const map = {
        6: 0,       // Mip6: 16*16
        5: 1,       // Mip5: 32*32
        4: 2,       // Mip4: 64*64
        3: 3,       // Mip3: 128*128
        2: 4,       // Mip2: 256*256
    }

    const atlas_info_stride = state.CPU_storage.atlas_info["stride"];

    /**
     *  2024/01/26 到此为止，明天来了继续更新
     * */ 
    // /**
    //  *  对 SBO 中的 ready state 都置为0
    //  *  不用费劲遍历了，直接清空即可
    //  * */
    // state.CPU_storage.atlas_info.arr.fill(0);


    /**
     *  遍历每一个 MipLevel
     * */
    for (let i = 0; i < quadBitMap.length; i++) {

        const instanceTexture = state.GPU_memory.Textures["dynamic_prefetch"][map[i]];


        /**
         *  由于分批次加载，以下变量改用全局变量代替
         * */
        let width_offset = state.CPU_storage.atlas_info["tex_width_offset"][i];   // 当前图片在大纹理内的宽度偏移
        let height_offset = state.CPU_storage.atlas_info["tex_height_offset"][i];  // 当前图片在大纹理内的高度偏移

        // console.log("width_offset = ", state.CPU_storage.atlas_info["tex_width_offset"]);

        /**
         *  遍历当前MipLevel中的所有图片
         * */
        const instance_len = quadBitMap[i].length;

        for (let j = 0; j < instance_len; j++) {

            const imageBitmap = quadBitMap[i][j]["bitMap"];
            const pic_idx = quadBitMap[i][j]["file_idx"];
            const img_width = imageBitmap.width;
            const img_height = imageBitmap.height;

            // 填充
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap }, // src
                { texture: instanceTexture, origin: [width_offset, height_offset, 0], flipY: false }, // dst （flipY 好像没啥卵用）
                [img_width, img_height] // size
            );


            const uv_offset = [width_offset / global_texture_size, height_offset / global_texture_size];
            const uv_aspect = [1.0, 1.0];
            const uv_size = [img_width / global_texture_size, img_height / global_texture_size];

            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 0] = 1;
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 1] = map[i];
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 2] = uv_offset[0];
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 3] = uv_offset[1];
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 4] = uv_aspect[0];
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 5] = uv_aspect[1];
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 6] = uv_size[0];
            state.CPU_storage.atlas_info.arr[pic_idx * atlas_info_stride + 7] = uv_size[1];



            width_offset += img_width;
            if (width_offset >= global_texture_size) {
                height_offset += img_height;
                width_offset = 0;
            }

        }


        state.CPU_storage.atlas_info["tex_width_offset"][i] = width_offset; // 回写
        state.CPU_storage.atlas_info["tex_height_offset"][i] = height_offset;
    }

    // 同步更新 SBO
    const atlas_Info_SBO = state.GPU_memory.SBOs["cur_atlas_info"];
    const writeBuffer = state.CPU_storage.atlas_info.arr;
    device.queue.writeBuffer(atlas_Info_SBO, 0, writeBuffer);

}

export {
    quadTexture_creation,
    fill_Quad_Texture,
    fill_Large_Quad_Texture,
    dynamic_fetch_update_Texture,
}
