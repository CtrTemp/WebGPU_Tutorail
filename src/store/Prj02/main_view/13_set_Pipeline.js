import { vertex_shader, fragment_shader } from '../../../assets/Shaders/Prj02/shader';
import { update_mip_compute } from '../../../assets/Shaders/Prj02/update_mip';


function Pipeline_creation(state, device) {


    /* ########################### Render Pipeline ########################### */


    const particle_Render_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [
            state.CPU_storage.Layouts["mvp"],           // group0
            state.CPU_storage.Layouts["sample"],        // group1
            state.CPU_storage.Layouts["mip_vertex"]     // group2
        ]
    });
    state.CPU_storage.Pipeline_Layouts["render_instances"] = particle_Render_Pipeline_Layout;


    const render_instances_pipeline = device.createRenderPipeline({
        layout: particle_Render_Pipeline_Layout,
        vertex: {
            module: device.createShaderModule({
                code: vertex_shader
            }),
            entryPoint: "vs_main",
            buffers: [
                state.CPU_storage.VBO_Layouts["instances"],
                state.CPU_storage.VBO_Layouts["quad"]
            ]
        },
        fragment: {
            module: device.createShaderModule({
                code: fragment_shader
            }),
            entryPoint: "fs_main",
            targets: [
                {
                    format: state.main_canvas["canvasFormat"],
                    // // 這一步是設置 半透明度 必須的要素（取消设置，得到默认遮挡）
                    // // 如果使用半透明，则将以下 depthStencil 中 depthWriteEnabled 字段设为 false
                    // blend: {
                    //     color: {
                    //         srcFactor: 'src-alpha',
                    //         dstFactor: 'one',
                    //         operation: 'add',
                    //     },
                    //     alpha: {
                    //         srcFactor: 'zero',
                    //         dstFactor: 'one',
                    //         operation: 'add',
                    //     },
                    // },
                }
            ]
        },
        primitive: {
            topology: "triangle-list",
            cullMode: "back"
        },
        depthStencil: {
            // 如果使能以上的半透明，则将以下的 depthWriteEnabled 字段改为 false
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });
    state.CPU_storage.Pipelines["render_instances"] = render_instances_pipeline;


    const renderPassDescriptor = {
        colorAttachments: [
            {
                view: undefined,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }
        ],
        depthStencilAttachment: {
            view: state.GPU_memory.Textures["depth"].createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store"
        }
    };
    state.CPU_storage.passDescriptors["render_instances"] = renderPassDescriptor;



    /**
     *  compute instance mip level
     * */ 
    const MipLevel_Compute_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [
            state.CPU_storage.Layouts["mip_instance_arr"],  // group0
            state.CPU_storage.Layouts["view_projection"],   // group1
        ]
    });
    state.CPU_storage.Pipeline_Layouts["compute_miplevel"] = MipLevel_Compute_Pipeline_Layout;

    const MipLevelUpdatePipeline = device.createComputePipeline({
        layout: MipLevel_Compute_Pipeline_Layout,
        compute: {
            module: device.createShaderModule({
                code: update_mip_compute,
            }),
            entryPoint: 'simulate',
        },
    });
    state.CPU_storage.Pipelines["update_miplevel"] = MipLevelUpdatePipeline;
}




export { Pipeline_creation }
