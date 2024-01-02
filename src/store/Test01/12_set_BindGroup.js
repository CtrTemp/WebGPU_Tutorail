function set_BindGroup(state, device) {
    const void_UBO_BindGroup = device.createBindGroup({
        layout: state.Layouts["void"],
        entries: []
    });
    state.BindGroups["void"] = void_UBO_BindGroup;


    const move_vertex_BindGroup = device.createBindGroup({
        layout: state.Layouts["move_vertex"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.VBOs["triangle"],
                    offset: 0,
                    size: 3 * 8 // 3 个顶点，每个顶点包括8个Bytes的数据
                }
            }
        ]
    });

    state.BindGroups["move_vertex"] = move_vertex_BindGroup;
}




export { set_BindGroup }
