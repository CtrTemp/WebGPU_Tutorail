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

    for (let i = 0; i < instance_len; i++) {
        const imageBitmap = state.instancedBitMap[i];

        console.log("width = ", imageBitmap.width);
        const instanceTexture = device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            // size: [512, 512, 1], // 固定长宽无法适用
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        device.queue.copyExternalImageToTexture(
            { source: imageBitmap }, // src
            { texture: instanceTexture }, // dst
            [imageBitmap.width, imageBitmap.height] // size
        );

        state.Textures["instance"].push(instanceTexture);
        state.Textures["image"] = instanceTexture;
    }



}




export { manage_Texture }
