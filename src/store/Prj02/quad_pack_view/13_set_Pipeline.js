import { vertex_shader, fragment_shader } from '../../../assets/Shaders/Prj02/quad_view/shader';
import { update_mip_compute } from '../../../assets/Shaders/Prj02/quad_view/update_mip';
import { update_select_compute } from '../../../assets/Shaders/Prj02/compute_hitpoint';

function Pipeline_creation_quad(state, device) {


    /* ########################### Render Pipeline ########################### */


    const particle_Render_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [
            state.main_view_flow_quad.Layouts["mvp_pack"],      // group0
            state.main_view_flow_quad.Layouts["sample"],        // group1
            state.main_view_flow_quad.Layouts["mip_vertex"]     // group2
        ]
    });
    state.main_view_flow_quad.Pipeline_Layouts["render_instances"] = particle_Render_Pipeline_Layout;


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
    state.main_view_flow_quad.Pipelines["render_instances"] = render_instances_pipeline;


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
    state.main_view_flow_quad.passDescriptors["render_instances"] = renderPassDescriptor;


    

    /**
     *  compute instance mip level
     * */ 
    const MipLevel_Compute_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [
            state.main_view_flow_quad.Layouts["mip_instance_arr"],  // group0
            state.main_view_flow_quad.Layouts["view_projection"],   // group1
        ]
    });
    state.main_view_flow_quad.Pipeline_Layouts["compute_miplevel"] = MipLevel_Compute_Pipeline_Layout;

    const MipLevelUpdatePipeline = device.createComputePipeline({
        layout: MipLevel_Compute_Pipeline_Layout,
        compute: {
            module: device.createShaderModule({
                code: update_mip_compute,
            }),
            entryPoint: 'simulate',
        },
    });
    state.main_view_flow_quad.Pipelines["update_miplevel"] = MipLevelUpdatePipeline;


    /**
     *  compute and update cursor ray hitpoint test
     * */ 
    const compute_hitpoint_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [
            state.main_view_flow_quad.Layouts["mip_instance_arr"],  // group0
            state.main_view_flow_quad.Layouts["cursor_ray"],        // group1
            state.main_view_flow_quad.Layouts["mvp_pack"],          // group2
            state.main_view_flow_quad.Layouts["interaction"],       // group3
        ]
    });
    state.main_view_flow_quad.Pipeline_Layouts["compute_hitpoint"] = compute_hitpoint_Pipeline_Layout;

    const compute_hitpoint_Pipeline = device.createComputePipeline({
        layout: compute_hitpoint_Pipeline_Layout,
        compute: {
            module: device.createShaderModule({
                code: update_select_compute,
            }),
            entryPoint: 'simulate',
        },
    });
    state.main_view_flow_quad.Pipelines["compute_hitpoint"] = compute_hitpoint_Pipeline;

}




export { Pipeline_creation_quad }
