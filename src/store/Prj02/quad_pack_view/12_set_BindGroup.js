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
            // large quad texture idx0
            {
                binding: 1,
                resource: state.GPU_memory.Textures["large_quad_prefetch"][0].createView()
            },
            // large quad texture idx1
            {
                binding: 2,
                resource: state.GPU_memory.Textures["large_quad_prefetch"][1].createView()
            },
            // large quad texture idx2
            {
                binding: 3,
                resource: state.GPU_memory.Textures["large_quad_prefetch"][2].createView()
            },
            // large quad texture idx3
            {
                binding: 4,
                resource: state.GPU_memory.Textures["large_quad_prefetch"][3].createView()
            },
            // large quad texture idx4
            {
                binding: 5,
                resource: state.GPU_memory.Textures["large_quad_prefetch"][4].createView()
            },
            // large quad texture idx5
            {
                binding: 6,
                resource: state.GPU_memory.Textures["large_quad_prefetch"][5].createView()
            },
            // dynamic pre-fetch texture 16*16
            {
                binding: 7,
                resource: state.GPU_memory.Textures["dynamic_prefetch"][0].createView()
            },
            // dynamic pre-fetch texture 32*32
            {
                binding: 8,
                resource: state.GPU_memory.Textures["dynamic_prefetch"][1].createView()
            },
            // dynamic pre-fetch texture 64*64
            {
                binding: 9,
                resource: state.GPU_memory.Textures["dynamic_prefetch"][2].createView()
            },
            // dynamic pre-fetch texture 128*128
            {
                binding: 10,
                resource: state.GPU_memory.Textures["dynamic_prefetch"][3].createView()
            },
            // dynamic pre-fetch texture 256*256
            {
                binding: 11,
                resource: state.GPU_memory.Textures["dynamic_prefetch"][4].createView()
            }
        ]
    });
    state.main_view_flow_quad.BindGroups["sample"] = Sample_UBO_BindGroup;


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



    /**
     *  Cursor Ray View Dir and LookFrom
     * */
    const cursor_ray_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["cursor_ray"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.UBOs["ray_from"],
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.GPU_memory.UBOs["ray_dir"],
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: state.GPU_memory.SBOs["nearest_hit_dist"],
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: state.GPU_memory.SBOs["hit_index"],
                }
            }
        ]
    });

    state.main_view_flow_quad.BindGroups["cursor_ray"] = cursor_ray_BindGroup;


    /**
     *  Interaction BindGroup
     * */

    const interaction_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["interaction"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.UBOs["interaction"],
                }
            }
        ]
    });

    state.main_view_flow_quad.BindGroups["interaction"] = interaction_BindGroup;



    /**
     *  update instance pos compute
     * */
    const compute_move_path_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["compute_move_path"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["simu_control"]
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

    state.main_view_flow_quad.BindGroups["compute_move_path"] = compute_move_path_BindGroup;


    // /**
    //  *  Layout-2d BindGroup
    //  * */
    // const Layout_2d_BindGroup = device.createBindGroup({
    //     layout: state.main_view_flow_quad.Layouts["layout_2d"],
    //     entries: [
    //         {
    //             binding: 0,
    //             resource: {
    //                 buffer: state.GPU_memory.SBOs["layout_2d"],
    //             }
    //         }
    //     ]
    // });

    // state.main_view_flow_quad.BindGroups["layout_2d"] = Layout_2d_BindGroup;



    // /**
    //  *  Layout-3d BindGroup
    //  * */
    // const Layout_3d_BindGroup = device.createBindGroup({
    //     layout: state.main_view_flow_quad.Layouts["layout_3d"],
    //     entries: [
    //         {
    //             binding: 0,
    //             resource: {
    //                 buffer: state.GPU_memory.SBOs["layout_3d"],
    //             }
    //         }
    //     ]
    // });

    // state.main_view_flow_quad.BindGroups["layout_3d"] = Layout_3d_BindGroup;


    /**
     *  Current uv BindGroup
     * */
    const Curren_Atlas_Info_BindGroup = device.createBindGroup({
        layout: state.main_view_flow_quad.Layouts["cur_atlas_info"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.SBOs["cur_atlas_info"],
                }
            }
        ]
    });

    state.main_view_flow_quad.BindGroups["cur_atlas_info"] = Curren_Atlas_Info_BindGroup;

}




export { BindGroup_creation_quad }
