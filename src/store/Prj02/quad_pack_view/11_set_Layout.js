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
            // quad texture Mip0
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip1
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip2
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip3
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip4
            {
                binding: 5,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip5
            {
                binding: 6,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip6
            {
                binding: 7,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip7
            {
                binding: 8,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip8
            {
                binding: 9,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip9
            {
                binding: 10,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip10
            {
                binding: 11,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip11
            {
                binding: 12,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // quad texture Mip12
            {
                binding: 13,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
        ]
    });
    state.main_view_flow_quad.Layouts["sample"] = Sample_UBO_Layout;

    const compute_UBO_Layout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "uniform"
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
    state.main_view_flow_quad.Layouts["compute"] = compute_UBO_Layout;


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
        },{
            binding: 2,
            visibility: GPUShaderStage.COMPUTE,
            buffer: {
                type: "storage"
            }
        }]
    });
    state.main_view_flow_quad.Layouts["cursor_ray"] = Cursor_Ray_UBO_Layout;

}




export { Layout_creation_quad }
