function set_Layout(state, device) {

    const MVP_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 1,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: "uniform"
            }
        }, {
            binding: 2,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: "uniform"
            }
        }]
    });
    state.main_canvas.Layouts["mvp"] = MVP_UBO_Layout;

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
            // big texture Mip0
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip1
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip2
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip3
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip4
            {
                binding: 5,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip5
            {
                binding: 6,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip6
            {
                binding: 7,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip7
            {
                binding: 8,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip8
            {
                binding: 9,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip9
            {
                binding: 10,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip10
            {
                binding: 11,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip11
            {
                binding: 12,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },
            // big texture Mip12
            {
                binding: 13,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'float'
                }
            },

        ]
    });
    state.main_canvas.Layouts["sample"] = Sample_UBO_Layout;

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
    state.main_canvas.Layouts["compute"] = compute_UBO_Layout;

}




export { set_Layout }
