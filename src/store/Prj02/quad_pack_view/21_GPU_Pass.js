/**
 *  这个文件将组装渲染/计算管线，用于直接填充系统的 MAIN Loop 或一些前导性初始化工作
 * */



/**
 *  调用 compute shader 计算 MipLevel
 * */
function compute_miplevel_pass_quad(state, device) {
    // Encode Pass 填充
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(state.main_view_flow_quad.Pipelines["update_miplevel"]);
    pass.setBindGroup(0, state.main_view_flow_quad.BindGroups["mip_instance_arr"]); // group0
    pass.setBindGroup(1, state.main_view_flow_quad.BindGroups["view_projection"]);  // group1
    pass.dispatchWorkgroups(Math.ceil(state.CPU_storage.instance_info["numInstances"] / 64));
    pass.end();

    // 队列提交
    device.queue.submit([encoder.finish()]);
    // 在这里更新标志位

    state.main_view_flow_quad.fence["COMPUTE_MIP_SUBMIT"] = true;
}

/**
 *  查看MipLevel计算返回结果
 *  注意，这里是异步函数，使用 await 等待获取结果，在 dispatch 中执行调用
 * */
async function read_back_miplevel_pass_quad(state, device) {

    const instancesLen = state.CPU_storage.instance_info["numInstances"];


    // Encode Pass 填充
    const readBack_encoder = device.createCommandEncoder();
    readBack_encoder.copyBufferToBuffer(
        state.GPU_memory.SBOs["mip"],
        0,
        state.GPU_memory.SBOs["mip_read_back"],
        0,
        instancesLen * 4,
    );

    // 队列提交
    device.queue.submit([readBack_encoder.finish()]);


    await state.GPU_memory.SBOs["mip_read_back"].mapAsync(GPUMapMode.READ);
    const arrBuffer = new Float32Array(state.GPU_memory.SBOs["mip_read_back"].getMappedRange());
    // console.log("hello~ readBuffer = ", arrBuffer);

    state.CPU_storage.storage_arr["mip"] = arrBuffer;

    state.CPU_storage.mip_info["arr"].fill(0);

    for (let i = 0; i < instancesLen; i++) {
        if (arrBuffer[i] == -1) {
            continue;
        }
        state.CPU_storage.mip_info["arr"][Math.floor(arrBuffer[i])]++;
    }
}




/**
 *  main view render pass
 * */
function render_main_view_quad(state, device, renderPassDescriptor) {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass(renderPassDescriptor);
    pass.setPipeline(state.main_view_flow_quad.Pipelines["render_instances"]);
    pass.setBindGroup(0, state.main_view_flow_quad.BindGroups["mvp_pack"]);
    pass.setBindGroup(1, state.main_view_flow_quad.BindGroups["sample"]);
    pass.setBindGroup(2, state.main_view_flow_quad.BindGroups["mip_vertex"]);
    pass.setVertexBuffer(0, state.GPU_memory.VBOs["instances"]);
    pass.setVertexBuffer(1, state.GPU_memory.VBOs["quad"]);
    pass.draw(6, state.CPU_storage.instance_info["numInstances"], 0, 0);
    pass.end();

    device.queue.submit([encoder.finish()]);
}



export {
    compute_miplevel_pass_quad,
    read_back_miplevel_pass_quad,
    render_main_view_quad,
}

