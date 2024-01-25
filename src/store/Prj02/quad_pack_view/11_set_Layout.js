function Layout_creation_quad(state, device) {

    /**
     *  MVP matrix UBO
     * */
    const MVP_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 1,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 2,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["mvp_pack"] = MVP_UBO_Layout;


    /**
     *  Mip Info SBO
     * */
    // read-only-storage for vertex shader stage
    const MIP_SBO_Layout_Vertex = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: "read-only-storage"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["mip_vertex"] = MIP_SBO_Layout_Vertex;
    // read-write-storage for compute shader stage
    const MIP_SBO_Layout_Compute = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "storage"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["mip_compute"] = MIP_SBO_Layout_Compute;


    /**
     *  Sampler and Texture
     * */
    const Sample_UBO_Layout = device.createBindGroupLayout({
        entries: [
            // sampler
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {
                    type: "filtering"
                }
            },
            // large quad texture idx0
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // large quad texture idx1
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // large quad texture idx2
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // large quad texture idx3
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // large quad texture idx4
            {
                binding: 5,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // large quad texture idx5
            {
                binding: 6,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // dynamic pre-fetch texture 16*16
            {
                binding: 7,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // dynamic pre-fetch texture 32*32
            {
                binding: 8,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // dynamic pre-fetch texture 64*64
            {
                binding: 9,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // dynamic pre-fetch texture 128*128
            {
                binding: 10,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // dynamic pre-fetch texture 256*256
            {
                binding: 11,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            }
        ]
    });
    state.main_view_flow_quad.Layouts["sample"] = Sample_UBO_Layout;


    /**
     *  Instance Moving Simulation
     * */ 
    const compute_instance_move_path_UBO_Layout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage"
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage"
                }
            }
        ]
    });
    state.main_view_flow_quad.Layouts["compute_move_path"] = compute_instance_move_path_UBO_Layout;


    /**
     *  View and Projection Matrix UBO for update MipLevel compute shader
     * */

    const VP_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["view_projection"] = VP_UBO_Layout;


    /**
     *  View and Projection Matrix UBO for update MipLevel compute shader
     * */
    const mipArr_instanceArr_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "storage"
            }
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "storage"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["mip_instance_arr"] = mipArr_instanceArr_UBO_Layout;



    /**
     *  Cursor Ray View Dir and LookFrom
     * */
    const Cursor_Ray_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 1,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "storage"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["cursor_ray"] = Cursor_Ray_UBO_Layout;


    /**
     *  Interaction UBO Layout
     * */
    const Interaction_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "uniform"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["interaction"] = Interaction_UBO_Layout;



    // /**
    //  *  pos layout-2d layout
    //  * */ 
    // const Layout_2d_Layout = device.createBindGroupLayout({
    //     entries: [{
    //         binding: 0,
    //         visibility: GPUShaderStage.VERTEX,
    //         buffer: {
    //             type: "read-only-storage"
    //         }
    //     }]
    // });
    // state.main_view_flow_quad.Layouts["layout_2d"] = Layout_2d_Layout;

    
    // /**
    //  *  pos layout-3d layout
    //  * */ 
    // const Layout_3d_Layout = device.createBindGroupLayout({
    //     entries: [{
    //         binding: 0,
    //         visibility: GPUShaderStage.VERTEX,
    //         buffer: {
    //             type: "read-only-storage"
    //         }
    //     }]
    // });
    // state.main_view_flow_quad.Layouts["layout_3d"] = Layout_3d_Layout;



    
    /**
     *  current atlas info layout
     * */ 
    const Current_Atlas_Info_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: {
                type: "read-only-storage"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["cur_atlas_info"] = Current_Atlas_Info_Layout;

}




export { Layout_creation_quad }
