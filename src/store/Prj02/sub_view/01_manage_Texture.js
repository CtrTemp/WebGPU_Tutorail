function subViewTexture_creation(state, device) {
    /**
     *  如果我们使能深度测试，需要一个确定的遮挡关系，就必须要创建一张深度图纹理
     * */
    const depthTexture = device.createTexture({
        size: [state.sub_canvas.canvas.width, state.sub_canvas.canvas.height],
        format: 'depth24plus', // 一般深度纹理和模板纹理是一张 16位被分配给了深度纹理 8位分配给模板纹理
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    state.sub_canvas.Textures["depth"] = depthTexture;
}




export { subViewTexture_creation }
