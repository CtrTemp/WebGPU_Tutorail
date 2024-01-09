

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

    /**
     *  遍历每一个 MipLevel
     * */
    const mip_range = state.CPU_storage.mip_info["total_length"];
    for (let i = 0; i < mip_range; i++) {
        // 为每一个MipLevel创建一张大纹理
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

        state.GPU_memory.Textures["quad_instance"].push(instanceTexture);
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
            if(width_offset >= global_texture_size)
            {   
                height_offset += img_height;
                width_offset = 0;
            }

        }
        state.CPU_storage["quad_atlas_info"][i] = quad_atlas_info;
        state.GPU_memory.Textures["quad_instance"][i] = instanceTexture;
    }


    // console.log("atlas info = ", state.CPU_storage["quad_atlas_info"]);
}


export {
    quadTexture_creation,
    fill_Quad_Texture,
}
