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
            {
                binding: 1,
                resource: {
                    buffer: state.sub_canvas.UBOs["right"]
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: state.sub_canvas.UBOs["up"]
                }
            },
        ]
    });
    state.sub_canvas.BindGroups["mvp"] = MVP_UBO_BindGroup;

}




export { set_BindGroup }
