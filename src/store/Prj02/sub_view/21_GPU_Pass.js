/**
 *  这个文件将组装渲染/计算管线，用于直接填充系统的 MAIN Loop 或一些前导性初始化工作
 * */


/**
 *  Render Sub View
 * */ 
function render_sub_view(state, device, renderPassDescriptor) {

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass(renderPassDescriptor);

    /**
     *  Render Cone
     * */
    {
        pass.setPipeline(state.CPU_storage.Pipelines["render_cone"]);
        pass.setBindGroup(0, state.CPU_storage.BindGroups["mvp_sub"]);
        pass.setVertexBuffer(0, state.GPU_memory.VBOs["cone"]);
        pass.setIndexBuffer(state.GPU_memory.IBOs["cone"], 'uint16');
        pass.drawIndexed(state.CPU_storage.indices_arr["cone"].length); // cone
    }

    /**
     *  Render Instance
     * */
    {
        pass.setPipeline(state.CPU_storage.Pipelines["render_instances_sub"]);
        pass.setBindGroup(0, state.CPU_storage.BindGroups["mvp_sub"]);
        pass.setBindGroup(1, state.CPU_storage.BindGroups["sample"]);
        pass.setBindGroup(2, state.CPU_storage.BindGroups["mip_vertex"]);
        pass.setVertexBuffer(0, state.GPU_memory.VBOs["instances"]);
        pass.setVertexBuffer(1, state.GPU_memory.VBOs["quad"]);
        pass.draw(6, state.CPU_storage.instance_info["numInstances"], 0, 0);

    }

    pass.end();

    device.queue.submit([encoder.finish()]);
}





export {
    render_sub_view,
}

