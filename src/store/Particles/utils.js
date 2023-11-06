
function updateCanvas(state, device)
{
    // 用于全屏模式
    const window_width = window.innerWidth * 0.9;
    const window_height = window.innerHeight * 0.9;

    state.canvas.width = window_width;
    state.canvas.height = window_height;

    // depth texture 重建
    state.Textures["depth"]["texture"].destroy();
    state.Textures["depth"]["texture"] = device.createTexture({
        size:[window_width, window_height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
    state.Textures["depth"]["texture"]["textureWidth"] = window_width;
    state.Textures["depth"]["texture"]["textureHeight"] = window_height;

    // render pass 描述符 重构
    state.passDescriptors["particles"].depthStencilAttachment.view = state.Textures["depth"]["texture"].createView();

    // 这里有一个问题，为什么 colorAttachment 就不需要重构？？？是进行了默认重构么？
    // 其实也没有默认重构，如下重构
    state.passDescriptors["particles"].colorAttachments[0].view = state.GPU_context
    .getCurrentTexture()
    .createView();

}

export { updateCanvas }
