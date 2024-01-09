function BindGroup_creation_quad(state, device) {

    /**
     *  MVP Matrix UBO
     * */

    const MVP_UBO_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["mvp_pack"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.UBOs["mvp"]
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.GPU_memory.UBOs["right"]
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: state.GPU_memory.UBOs["up"]
                }
            },
        ]
    });
    state.main_view_flow_quad.BindGroups["mvp_pack"] = MVP_UBO_BindGroup;


    /**
     *  Mip Storage Buffer
     * */
    // vertex stage (read only)
    const MIP_SBO_BindGroup_Vertex = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["mip_vertex"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["mip"]
                }
            }
        ]
    });
    state.main_view_flow_quad.BindGroups["mip_vertex"] = MIP_SBO_BindGroup_Vertex;


    // compute stage (read-write)
    const MIP_SBO_BindGroup_Compute = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["mip_compute"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["mip"]
                }
            }
        ]
    });
    state.main_view_flow_quad.BindGroups["mip_compute"] = MIP_SBO_BindGroup_Compute;


    /**
     *  Sampler and Texture
     * */
    const Sample_UBO_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["sample"],
        entries: [
            // texture sampler
            {
                binding: 0,
                resource: state.CPU_storage.additional_info["sampler"]
            },
            // quad texture Mip0
            {
                binding: 1,
                resource: state.GPU_memory.Textures["quad_instance"][0].createView()
            },
            // quad texture Mip1
            {
                binding: 2,
                resource: state.GPU_memory.Textures["quad_instance"][1].createView()
            },
            // quad texture Mip2
            {
                binding: 3,
                resource: state.GPU_memory.Textures["quad_instance"][2].createView()
            },
            // quad texture Mip3
            {
                binding: 4,
                resource: state.GPU_memory.Textures["quad_instance"][3].createView()
            },
            // quad texture Mip4
            {
                binding: 5,
                resource: state.GPU_memory.Textures["quad_instance"][4].createView()
            },
            // quad texture Mip5
            {
                binding: 6,
                resource: state.GPU_memory.Textures["quad_instance"][5].createView()
            },
            // quad texture Mip6
            {
                binding: 7,
                resource: state.GPU_memory.Textures["quad_instance"][6].createView()
            },
            // quad texture Mip7
            {
                binding: 8,
                resource: state.GPU_memory.Textures["quad_instance"][7].createView()
            },
            // quad texture Mip8
            {
                binding: 9,
                resource: state.GPU_memory.Textures["quad_instance"][8].createView()
            },
            // quad texture Mip9
            {
                binding: 10,
                resource: state.GPU_memory.Textures["quad_instance"][9].createView()
            },
            // quad texture Mip10
            {
                binding: 11,
                resource: state.GPU_memory.Textures["quad_instance"][10].createView()
            },
            // quad texture Mip11
            {
                binding: 12,
                resource: state.GPU_memory.Textures["quad_instance"][11].createView()
            },
            // quad texture Mip12
            {
                binding: 13,
                resource: state.GPU_memory.Textures["quad_instance"][12].createView()
            },
        ]
    });
    state.main_view_flow_quad.BindGroups["sample"] = Sample_UBO_BindGroup;


    /**
     *  update instance pos compute stage
     * */
    const simu_particles_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["compute"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.UBOs["compute"]
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.GPU_memory.VBOs["instances"],
                    offset: 0,
                    size: state.CPU_storage.instance_info["numInstances"] * state.CPU_storage.instance_info["instanceInfoByteSize"]
                }
            }
        ]
    });

    state.main_view_flow_quad.BindGroups["compute"] = simu_particles_BindGroup;


    /**
     *  View and Projection Matrix UBO for update MipLevel compute shader
     * */
    const VP_UBO_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["view_projection"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.UBOs["view"]
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.GPU_memory.UBOs["projection"]
                }
            },
        ]
    });
    state.main_view_flow_quad.BindGroups["view_projection"] = VP_UBO_BindGroup;

    /**
     *  mipArr and instanceArr SBO for update MipLevel compute shader
     * */
    const compute_instance_MipLevel_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["mip_instance_arr"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["mip"],
                    offset: 0,
                    size: state.CPU_storage.instance_info["numInstances"] * 4
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.GPU_memory.VBOs["instances"],
                    offset: 0,
                    size: state.CPU_storage.instance_info["numInstances"] * state.CPU_storage.instance_info["instanceInfoByteSize"]
                }
            }
        ]
    });

    state.main_view_flow_quad.BindGroups["mip_instance_arr"] = compute_instance_MipLevel_BindGroup;
}




export { BindGroup_creation_quad }
