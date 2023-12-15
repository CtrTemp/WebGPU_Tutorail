function set_BindGroup(state, device) {

    const MVP_UBO_BindGroup = device.createBindGroup({
        layout: state.sub_canvas.Layouts["mvp"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.sub_canvas.UBOs["mvp"]
                }
            },
        ]
    });
    state.sub_canvas.BindGroups["mvp"] = MVP_UBO_BindGroup;

}




export { set_BindGroup }
