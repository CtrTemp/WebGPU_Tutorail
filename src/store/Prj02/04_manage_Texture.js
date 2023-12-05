function manage_Texture(state, payload) {
    const device = payload.device;

    /**
     *  Sampler
     * */
    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });


    state.additional_info["sampler"] = sampler;


    /**
     *  depth Texture
     * */
    const depthTexture = device.createTexture({
        size: [state.canvas.width, state.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    state.Textures["depth"] = depthTexture;



    /**
     *  Instance Texture
     * */
    // const imageBitmap = payload.img; // 默认测试用例纹理

    const instance_len = state.instancedBitMap.length;

    let offset = 0;

    const global_texture_size = Math.pow(2, 13);
    console.log("global_texture_size = ", global_texture_size);
    state.atlas_info["size"].push([global_texture_size, global_texture_size]);
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
    console.log("instance len = ", instance_len);

    for (let i = 0; i < instance_len; i++) {
        const imageBitmap = state.instancedBitMap[i];
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


        device.queue.copyExternalImageToTexture(
            { source: imageBitmap }, // src
            // { texture: instanceTexture, origin: [i*100, i*100], flipY: false }, // dst （flipY 好像没啥卵用）
            { texture: instanceTexture, origin: [width_offset, height_offset, 0], flipY: false }, // dst （flipY 好像没啥卵用）
            [img_width, img_height] // size
        );

        state.Textures["instance"].push(instanceTexture);
        state.Textures["image"] = instanceTexture;

        state.atlas_info["uv_offset"].push([width_offset/ global_texture_size, height_offset/ global_texture_size]);

        let tex_aspect = [1.0, 1.0];
        if (img_width >= img_height) {
            tex_aspect[1] = img_height / img_width;
        }
        else {
            tex_aspect[0] = img_width / img_height;
        }

        state.atlas_info["tex_aspect"].push(tex_aspect);
        state.atlas_info["uv_size"].push([img_width / global_texture_size, img_height / global_texture_size]);



        offset += img_width * img_height;
        width_offset += img_width;
        height_offset += img_height;
    }



}




export { manage_Texture }
