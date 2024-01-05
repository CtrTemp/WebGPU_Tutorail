

function mipTexture_creation(state, device) {
    /**
     *  Sampler
     * */
    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });


    state.main_canvas.additional_info["sampler"] = sampler;


    /**
     *  depth Texture
     * */
    const depthTexture = device.createTexture({
        size: [state.main_canvas.canvas.width, state.main_canvas.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    state.main_canvas.Textures["depth"] = depthTexture;



    /**
     *  Instance Texture (big texture) creation
     * */

    const global_texture_size = Math.pow(2, 13);    // 大纹理尺寸为 8192*8192
    state.main_canvas.atlas_info["size"] = [global_texture_size, global_texture_size];

    /**
     *  遍历每一个 MipLevel
     * */
    const mip_range = state.main_canvas.mip_info["total_length"];
    for (let i = 0; i < mip_range; i++) {
        // 为每一个MipLevel创建一张大纹理
        const global_texture_size = Math.pow(2, 13);  // 8192 * 8192
        state.main_canvas.atlas_info["size"].push([global_texture_size, global_texture_size]);
        const instanceTexture = device.createTexture({
            dimension: '2d',
            size: [global_texture_size, global_texture_size, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        state.main_canvas.Textures["mip_instance"].push(instanceTexture);
    }
}


function fill_Mip_Texture(state, device) {

    const mipBitMap = state.main_canvas["mipBitMap"];

    
    state.main_canvas["mip_atlas_info"].fill([]); // 清空原有图片集信息


    const global_texture_size = state.main_canvas.atlas_info["size"][0];

    /**
     *  遍历每一个 MipLevel
     * */
    for (let i = 0; i < mipBitMap.length; i++) {
        // console.log("i = ", mipBitMap[i].length);

        /**
         *  为每一个MipLevel创建一张大纹理
         * */
        const instanceTexture = state.main_canvas.Textures["mip_instance"][i]

        let offset = 0;         // 总内存偏移

        let width_offset = 0;   // 当前图片在大纹理内的宽度偏移
        let height_offset = 0;  // 当前图片在大纹理内的高度偏移

        /**
         *  遍历当前MipLevel中的所有图片
         * */
        const instance_len = mipBitMap[i].length;
        let mip_atlas_info = {
            uv_offset: [],  // 用于记录instance对应图片纹理在大纹理中的uv偏移
            uv_size: [],    // 用于记录instance对应图片纹理在大纹理中的uv归一化宽高尺寸
            tex_aspect: [], // 用于记录instance对应图片纹理的宽高比系数
        };

        for (let j = 0; j < instance_len; j++) {

            const imageBitmap = mipBitMap[i][j];
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
            mip_atlas_info["uv_offset"].push([width_offset / global_texture_size, height_offset / global_texture_size]);

            let tex_aspect = [1.0, 1.0];
            if (img_width >= img_height) {
                tex_aspect[1] = img_height / img_width;
            }
            else {
                tex_aspect[0] = img_width / img_height;
            }

            mip_atlas_info["tex_aspect"].push(tex_aspect);
            mip_atlas_info["uv_size"].push([img_width / global_texture_size, img_height / global_texture_size]);

            offset += img_width * img_height;
            width_offset += img_width;
            height_offset += img_height;

        }
        state.main_canvas["mip_atlas_info"][i] = mip_atlas_info;
        state.main_canvas.Textures["mip_instance"][i] = instanceTexture;
    }


    console.log("atlas info = ", state.main_canvas["mip_atlas_info"]);
}

function manage_Texture(state, device) {

    /**
     *  Sampler
     * */
    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });


    state.main_canvas.additional_info["sampler"] = sampler;


    /**
     *  depth Texture
     * */
    const depthTexture = device.createTexture({
        size: [state.main_canvas.canvas.width, state.main_canvas.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    state.main_canvas.Textures["depth"] = depthTexture;



    /**
     *  Instance Texture
     * */
    // const imageBitmap = payload.img; // 默认测试用例纹理

    const instance_len = state.main_canvas.instancedBitMap.length;

    let offset = 0;

    const global_texture_size = Math.pow(2, 13);
    // console.log("global_texture_size = ", global_texture_size);
    state.main_canvas.atlas_info["size"].push([global_texture_size, global_texture_size]);
    const instanceTexture = device.createTexture({
        dimension: '2d',
        size: [global_texture_size, global_texture_size, 1],
        // size: [512, 512, 1], // 固定长宽无法适用
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT,
    });


    let width_offset = 0;
    let height_offset = 0;
    // console.log("instance len = ", instance_len);

    // console.log("All bitMap = ", state.main_canvas.instancedBitMap);

    /**
     *  这里插入图片排序算法？？图片排序放在服务端是否好一些，因为作为一个大屏访问项目，
     * 访问者不会很多，服务端计算压力会小很多。
     * */

    // 根据图片高度进行排序


    for (let i = 0; i < instance_len; i++) {
        const imageBitmap = state.main_canvas.instancedBitMap[i];
        const img_width = imageBitmap.width;
        const img_height = imageBitmap.height;

        // const instanceTexture = device.createTexture({
        //     size: [imageBitmap.width, imageBitmap.height, 1],
        //     // size: [512, 512, 1], // 固定长宽无法适用
        //     format: 'rgba8unorm',
        //     usage:
        //         GPUTextureUsage.TEXTURE_BINDING |
        //         GPUTextureUsage.COPY_DST |
        //         GPUTextureUsage.RENDER_ATTACHMENT,
        // });

        /**
         *  应该在这里插入图片填充算法
         * */


        device.queue.copyExternalImageToTexture(
            { source: imageBitmap }, // src
            // { texture: instanceTexture, origin: [i*100, i*100], flipY: false }, // dst （flipY 好像没啥卵用）
            { texture: instanceTexture, origin: [width_offset, height_offset, 0], flipY: false }, // dst （flipY 好像没啥卵用）
            [img_width, img_height] // size
        );

        state.main_canvas.Textures["instance"].push(instanceTexture);
        state.main_canvas.Textures["image"] = instanceTexture;

        state.main_canvas.atlas_info["uv_offset"].push([width_offset / global_texture_size, height_offset / global_texture_size]);

        let tex_aspect = [1.0, 1.0];
        if (img_width >= img_height) {
            tex_aspect[1] = img_height / img_width;
        }
        else {
            tex_aspect[0] = img_width / img_height;
        }

        state.main_canvas.atlas_info["tex_aspect"].push(tex_aspect);
        state.main_canvas.atlas_info["uv_size"].push([img_width / global_texture_size, img_height / global_texture_size]);

        offset += img_width * img_height;
        width_offset += img_width;
        height_offset += img_height;
    }
}



function manage_Mip_Texture(state, device) {

    /**
     *  Sampler
     * */
    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });


    state.main_canvas.additional_info["sampler"] = sampler;


    /**
     *  depth Texture
     * */
    const depthTexture = device.createTexture({
        size: [state.main_canvas.canvas.width, state.main_canvas.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    state.main_canvas.Textures["depth"] = depthTexture;



    /**
     *  Instance Texture
     * */
    // const imageBitmap = payload.img; // 默认测试用例纹理


    const global_texture_size = Math.pow(2, 13);
    // console.log("global_texture_size = ", global_texture_size);
    state.main_canvas.atlas_info["size"].push([global_texture_size, global_texture_size]);

    const mipBitMap = state.main_canvas["mipBitMap"];

    console.log("mipBitMap = ", mipBitMap);

    /**
     *  遍历每一个 MipLevel
     * */
    for (let i = 0; i < mipBitMap.length; i++) {
        // console.log("i = ", mipBitMap[i].length);

        /**
         *  为每一个MipLevel创建一张大纹理
         * */
        const instance_len = mipBitMap[i].length;

        const global_texture_size = Math.pow(2, 13);  // 8192 * 8192
        state.main_canvas.atlas_info["size"].push([global_texture_size, global_texture_size]);
        const instanceTexture = device.createTexture({
            dimension: '2d',
            size: [global_texture_size, global_texture_size, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        let offset = 0;         // 总内存偏移

        let width_offset = 0;   // 当前图片在大纹理内的宽度偏移
        let height_offset = 0;  // 当前图片在大纹理内的高度偏移

        /**
         *  遍历当前MipLevel中的所有图片
         * */
        // let mip_instance = [];
        let mip_atlas_info = {
            uv_offset: [],  // 用于记录instance对应图片纹理在大纹理中的uv偏移
            uv_size: [],    // 用于记录instance对应图片纹理在大纹理中的uv归一化宽高尺寸
            tex_aspect: [], // 用于记录instance对应图片纹理的宽高比系数
        };
        for (let j = 0; j < instance_len; j++) {

            const imageBitmap = mipBitMap[i][j];
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
            mip_atlas_info["uv_offset"].push([width_offset / global_texture_size, height_offset / global_texture_size]);

            let tex_aspect = [1.0, 1.0];
            if (img_width >= img_height) {
                tex_aspect[1] = img_height / img_width;
            }
            else {
                tex_aspect[0] = img_width / img_height;
            }

            mip_atlas_info["tex_aspect"].push(tex_aspect);
            mip_atlas_info["uv_size"].push([img_width / global_texture_size, img_height / global_texture_size]);

            offset += img_width * img_height;
            width_offset += img_width;
            height_offset += img_height;

        }
        state.main_canvas["mip_atlas_info"].push(mip_atlas_info);
        state.main_canvas.Textures["mip_instance"].push(instanceTexture);
    }
}


export {
    mipTexture_creation,
    fill_Mip_Texture,
    manage_Texture,
    manage_Mip_Texture
}
