function set_BindGroup(state, device) {

    const MVP_UBO_BindGroup = device.createBindGroup({
        layout: state.main_canvas.Layouts["mvp"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.main_canvas.UBOs["mvp"]
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.main_canvas.UBOs["right"]
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: state.main_canvas.UBOs["up"]
                }
            },
        ]
    });
    state.main_canvas.BindGroups["mvp_pack"] = MVP_UBO_BindGroup;



    const Sample_UBO_BindGroup = device.createBindGroup({
        layout: state.main_canvas.Layouts["sample"],
        entries: [
            // texture sampler
            {
                binding: 0,
                resource: state.main_canvas.additional_info["sampler"]
            },
            // big texture test Mip0
            {
                binding: 1,
                resource: state.main_canvas.Textures["instance"][0].createView()
            }
        ]
    });
    state.main_canvas.BindGroups["sample"] = Sample_UBO_BindGroup;

}




export { set_BindGroup }
