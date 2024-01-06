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
        pass.setPipeline(state.sub_canvas.Pipelines["cone"]);
        pass.setBindGroup(0, state.sub_canvas.BindGroups["mvp"]);
        pass.setVertexBuffer(0, state.sub_canvas.VBOs["cone"]);
        pass.setIndexBuffer(state.sub_canvas.IBOs["cone"], 'uint16');
        pass.drawIndexed(state.sub_canvas.indices_arr["cone"].length); // cone
    }

    /**
     *  Render Instance
     * */
    {
        pass.setPipeline(state.sub_canvas.Pipelines["render_instances"]);
        pass.setBindGroup(0, state.sub_canvas.BindGroups["mvp"]);
        pass.setBindGroup(1, state.main_canvas.BindGroups["sample"]);
        pass.setBindGroup(2, state.main_canvas.BindGroups["mip_vertex"]);
        pass.setVertexBuffer(0, state.main_canvas.VBOs["instances"]);
        pass.setVertexBuffer(1, state.main_canvas.VBOs["quad"]);
        pass.draw(6, state.main_canvas.instance_info["numInstances"], 0, 0);

    }

    pass.end();

    device.queue.submit([encoder.finish()]);
}





export {
    render_sub_view,
}

