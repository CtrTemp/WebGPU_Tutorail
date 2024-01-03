function set_BindGroup(state, device) {

    /**
     *  MVP Matrix UBO
     * */ 
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


    /**
     *  Mip Storage Buffer
     * */ 
    // vertex stage
    const MIP_SBO_BindGroup_Vertex = device.createBindGroup({
        layout: state.main_canvas.Layouts["mip_vertex"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.main_canvas.SBOs["mip"]
                }
            }
        ]
    });
    state.main_canvas.BindGroups["mip_vertex"] = MIP_SBO_BindGroup_Vertex;

    
    // compute stage
    const MIP_SBO_BindGroup_Compute = device.createBindGroup({
        layout: state.main_canvas.Layouts["mip_compute"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.main_canvas.SBOs["mip"]
                }
            }
        ]
    });
    state.main_canvas.BindGroups["mip_compute"] = MIP_SBO_BindGroup_Compute;


    /**
     *  Sampler and Texture
     * */ 
    const Sample_UBO_BindGroup = device.createBindGroup({
        layout: state.main_canvas.Layouts["sample"],
        entries: [
            // texture sampler
            {
                binding: 0,
                resource: state.main_canvas.additional_info["sampler"]
            },
            // big texture Mip0
            {
                binding: 1,
                resource: state.main_canvas.Textures["mip_instance"][0].createView()
            },
            // big texture Mip1
            {
                binding: 2,
                resource: state.main_canvas.Textures["mip_instance"][1].createView()
            },
            // big texture Mip2
            {
                binding: 3,
                resource: state.main_canvas.Textures["mip_instance"][2].createView()
            },
            // big texture Mip3
            {
                binding: 4,
                resource: state.main_canvas.Textures["mip_instance"][3].createView()
            },
            // big texture Mip4
            {
                binding: 5,
                resource: state.main_canvas.Textures["mip_instance"][4].createView()
            },
            // big texture Mip5
            {
                binding: 6,
                resource: state.main_canvas.Textures["mip_instance"][5].createView()
            },
            // big texture Mip6
            {
                binding: 7,
                resource: state.main_canvas.Textures["mip_instance"][6].createView()
            },
            // big texture Mip7
            {
                binding: 8,
                resource: state.main_canvas.Textures["mip_instance"][7].createView()
            },
            // big texture Mip8
            {
                binding: 9,
                resource: state.main_canvas.Textures["mip_instance"][8].createView()
            },
            // big texture Mip9
            {
                binding: 10,
                resource: state.main_canvas.Textures["mip_instance"][9].createView()
            },
            // big texture Mip10
            {
                binding: 11,
                resource: state.main_canvas.Textures["mip_instance"][10].createView()
            },
            // big texture Mip11
            {
                binding: 12,
                resource: state.main_canvas.Textures["mip_instance"][11].createView()
            },
            // big texture Mip12
            {
                binding: 13,
                resource: state.main_canvas.Textures["mip_instance"][12].createView()
            },
        ]
    });
    state.main_canvas.BindGroups["sample"] = Sample_UBO_BindGroup;

}




export { set_BindGroup }
