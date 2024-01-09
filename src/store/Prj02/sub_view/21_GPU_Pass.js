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
        pass.setPipeline(state.sub_view_flow_debug.Pipelines["render_cone"]);
        pass.setBindGroup(0, state.sub_view_flow_debug.BindGroups["mvp_pack"]);
        pass.setVertexBuffer(0, state.GPU_memory.VBOs["cone"]);
        pass.setIndexBuffer(state.GPU_memory.IBOs["cone"], 'uint16');
        pass.drawIndexed(state.CPU_storage.indices_arr["cone"].length); // cone
    }

    /**
     *  Render Instance
     * */
    {
        pass.setPipeline(state.sub_view_flow_debug.Pipelines["render_instances_sub"]);
        pass.setBindGroup(0, state.sub_view_flow_debug.BindGroups["mvp_pack"]);
        pass.setBindGroup(1, state.main_view_flow_quad.BindGroups["sample"]);
        pass.setBindGroup(2, state.main_view_flow_quad.BindGroups["mip_vertex"]);
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

