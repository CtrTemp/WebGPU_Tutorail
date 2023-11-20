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
            {
                binding: 1,
                resource: {
                    buffer: state.UBOs["right"]
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: state.UBOs["up"]
                }
            },
        ]
    });
    state.BindGroups["mvp_pack"] = MVP_UBO_BindGroup;



    const Sample_UBO_BindGroup = device.createBindGroup({
        layout: state.Layouts["sample"],
        entries: [
            // texture sampler
            {
                binding: 0,
                resource: state.additional_info["sampler"]
            },
            // instance sampler
            {
                binding: 1,
                resource: state.Textures["image"].createView()
            }
        ]
    });
    state.BindGroups["sample"] = Sample_UBO_BindGroup;

}




export { set_BindGroup }
