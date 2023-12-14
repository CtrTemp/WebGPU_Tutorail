function set_BindGroup(state, device) {

    const MVP_UBO_BindGroup = device.createBindGroup({
        layout: state.Layouts["mvp"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.UBOs["mvp"]
                }
            },
        ]
    });
    state.BindGroups["mvp"] = MVP_UBO_BindGroup;

}




export { set_BindGroup }
