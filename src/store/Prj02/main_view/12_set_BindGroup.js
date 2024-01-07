function BindGroup_creation(state, device) {

    /**
     *  MVP Matrix UBO
     * */
    const MVP_UBO_BindGroup = device.createBindGroup({
        layout: state.CPU_storage.Layouts["mvp"],
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
    state.CPU_storage.BindGroups["mvp_pack"] = MVP_UBO_BindGroup;


    /**
     *  Mip Storage Buffer
     * */
    // vertex stage (read only)
    const MIP_SBO_BindGroup_Vertex = device.createBindGroup({
        layout: state.CPU_storage.Layouts["mip_vertex"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["mip"]
                }
            }
        ]
    });
    state.CPU_storage.BindGroups["mip_vertex"] = MIP_SBO_BindGroup_Vertex;


    // compute stage (read-write)
    const MIP_SBO_BindGroup_Compute = device.createBindGroup({
        layout: state.CPU_storage.Layouts["mip_compute"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["mip"]
                }
            }
        ]
    });
    state.CPU_storage.BindGroups["mip_compute"] = MIP_SBO_BindGroup_Compute;


    /**
     *  Sampler and Texture
     * */
    const Sample_UBO_BindGroup = device.createBindGroup({
        layout: state.CPU_storage.Layouts["sample"],
        entries: [
            // texture sampler
            {
                binding: 0,
                resource: state.CPU_storage.additional_info["sampler"]
            },
            // big texture Mip0
            {
                binding: 1,
                resource: state.GPU_memory.Textures["mip_instance"][0].createView()
            },
            // big texture Mip1
            {
                binding: 2,
                resource: state.GPU_memory.Textures["mip_instance"][1].createView()
            },
            // big texture Mip2
            {
                binding: 3,
                resource: state.GPU_memory.Textures["mip_instance"][2].createView()
            },
            // big texture Mip3
            {
                binding: 4,
                resource: state.GPU_memory.Textures["mip_instance"][3].createView()
            },
            // big texture Mip4
            {
                binding: 5,
                resource: state.GPU_memory.Textures["mip_instance"][4].createView()
            },
            // big texture Mip5
            {
                binding: 6,
                resource: state.GPU_memory.Textures["mip_instance"][5].createView()
            },
            // big texture Mip6
            {
                binding: 7,
                resource: state.GPU_memory.Textures["mip_instance"][6].createView()
            },
            // big texture Mip7
            {
                binding: 8,
                resource: state.GPU_memory.Textures["mip_instance"][7].createView()
            },
            // big texture Mip8
            {
                binding: 9,
                resource: state.GPU_memory.Textures["mip_instance"][8].createView()
            },
            // big texture Mip9
            {
                binding: 10,
                resource: state.GPU_memory.Textures["mip_instance"][9].createView()
            },
            // big texture Mip10
            {
                binding: 11,
                resource: state.GPU_memory.Textures["mip_instance"][10].createView()
            },
            // big texture Mip11
            {
                binding: 12,
                resource: state.GPU_memory.Textures["mip_instance"][11].createView()
            },
            // big texture Mip12
            {
                binding: 13,
                resource: state.GPU_memory.Textures["mip_instance"][12].createView()
            },
        ]
    });
    state.CPU_storage.BindGroups["sample"] = Sample_UBO_BindGroup;


    /**
     *  update instance pos compute stage
     * */
    const simu_particles_BindGroup = device.createBindGroup({
        layout: state.CPU_storage.Layouts["compute"],
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

    state.CPU_storage.BindGroups["compute"] = simu_particles_BindGroup;


    /**
     *  View and Projection Matrix UBO for update MipLevel compute shader
     * */
    const VP_UBO_BindGroup = device.createBindGroup({
        layout: state.CPU_storage.Layouts["view_projection"],
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
    state.CPU_storage.BindGroups["view_projection"] = VP_UBO_BindGroup;

    /**
     *  mipArr and instanceArr SBO for update MipLevel compute shader
     * */
    const compute_instance_MipLevel_BindGroup = device.createBindGroup({
        layout: state.CPU_storage.Layouts["mip_instance_arr"],
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

    state.CPU_storage.BindGroups["mip_instance_arr"] = compute_instance_MipLevel_BindGroup;
}




export { BindGroup_creation }
