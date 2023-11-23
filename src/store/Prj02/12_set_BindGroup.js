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
            // instance images
            {
                binding: 1,
                resource: state.Textures["instance"][0].createView()
            },
            {
                binding: 2,
                resource: state.Textures["instance"][1].createView()
            },
            {
                binding: 3,
                resource: state.Textures["instance"][2].createView()
            },
            {
                binding: 4,
                resource: state.Textures["instance"][3].createView()
            },
            {
                binding: 5,
                resource: state.Textures["instance"][4].createView()
            },
            {
                binding: 6,
                resource: state.Textures["instance"][5].createView()
            },
            {
                binding: 7,
                resource: state.Textures["instance"][6].createView()
            },
            {
                binding: 8,
                resource: state.Textures["instance"][7].createView()
            },
            {
                binding: 9,
                resource: state.Textures["instance"][8].createView()
            }
        ]
    });
    state.BindGroups["sample"] = Sample_UBO_BindGroup;

}




export { set_BindGroup }
