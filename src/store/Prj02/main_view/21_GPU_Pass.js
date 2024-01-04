/**
 *  这个文件将组装渲染/计算管线，用于直接填充系统的 MAIN Loop 或一些前导性初始化工作
 * */



/**
 *  调用 compute shader 计算 MipLevel
 * */
function compute_miplevel_pass(state, device) {
    // Encode Pass 填充
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(state.main_canvas.Pipelines["update_miplevel"]);
    pass.setBindGroup(0, state.main_canvas.BindGroups["mip_instance_arr"]); // group0
    pass.setBindGroup(1, state.main_canvas.BindGroups["view_projection"]);  // group1
    pass.dispatchWorkgroups(Math.ceil(state.main_canvas.instance_info["numInstances"] / 64));
    pass.end();

    // 队列提交
    device.queue.submit([encoder.finish()]);
}

/**
 *  查看MipLevel计算返回结果
 * */
function read_back_miplevel_pass(state, device) {

    // Encode Pass 填充
    const readBack_encoder = device.createCommandEncoder();
    readBack_encoder.copyBufferToBuffer(
        state.main_canvas.SBOs["mip"],
        0,
        state.main_canvas.SBOs["mip_read_back"],
        0,
        state.main_canvas.instance_info["numInstances"] * 4,
    );

    // 队列提交
    device.queue.submit([readBack_encoder.finish()]);

    // 返回结果打印
    setTimeout(async () => {
        await state.main_canvas.SBOs["mip_read_back"].mapAsync(GPUMapMode.READ);
        const arrBuffer = new Float32Array(state.main_canvas.SBOs["mip_read_back"].getMappedRange());
        console.log("hello~ readBuffer = ", arrBuffer);
    }, 1000);
}










export {
    compute_miplevel_pass,
    read_back_miplevel_pass,
}

