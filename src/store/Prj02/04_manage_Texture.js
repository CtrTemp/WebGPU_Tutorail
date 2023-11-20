function manage_Texture(state, payload) {
    const device = payload.device;


    // image texture
    const imageBitmap = payload.img;
    const instanceTexture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
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

    // Create a sampler with linear filtering for smooth interpolation.
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
    });

    state.Textures["image"] = instanceTexture;

    state.additional_info["sampler"] = sampler;


    // depth Texture
    const depthTexture = device.createTexture({
        size: [state.canvas.width, state.canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    });
    state.Textures["depth"] = depthTexture;

}




export { manage_Texture }
