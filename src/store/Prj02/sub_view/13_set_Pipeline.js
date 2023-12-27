
import { vertex_shader, fragment_shader } from '../../../assets/Shaders/Prj02/sub_canvas/shader.js'
import { instance_vert, instance_frag } from '../../../assets/Shaders/Prj02/sub_canvas/instance.js'

function set_Pipeline_sub(state, device) {

    /* ########################### Render Cone Pipeline ########################### */

    const Render_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [
            state.sub_canvas.Layouts["mvp"]
        ]
    });
    state.sub_canvas.Layouts["render_particles"] = Render_Pipeline_Layout;

    // 创建渲染流水线
    const Render_Pipeline = device.createRenderPipeline({
        layout: Render_Pipeline_Layout,
        vertex: {
            module: device.createShaderModule({
                code: vertex_shader
            }),
            entryPoint: "vertexMain",   // 指定 vertex shader 入口函数
            buffers: [state.sub_canvas.VBO_Layouts["cone"]]
        },
        fragment: {
            module: device.createShaderModule({
                code: fragment_shader
            }),
            entryPoint: "fragmentMain", // 指定 fragment shader 入口函数
            targets: [{
                format: state.sub_canvas["canvasFormat"],
                // 這一步是設置 半透明度 必須的要素（取消设置，得到默认遮挡）
                // 如果使用半透明，则将以下 depthStencil 中 depthWriteEnabled 字段设为 false
                blend: {
                    color: {
                        srcFactor: 'src-alpha',
                        dstFactor: 'one',
                        operation: 'add',
                    },
                    alpha: {
                        srcFactor: 'zero',
                        dstFactor: 'one',
                        operation: 'add',
                    },
                },

            }]
        },
        primitive: { // 指定面元类型（这里默认是三角形，所以不加也可）并指明剔除模式
            topology: 'triangle-list',
            // cullMode: 'back',
        },
        /**
         *  使能深度测试，小于深度纹理的fragment将会被保留，如果要使用半透明物体，则以下的
         * depthWriteEnabled 字段需要被设为 false
         * */ 
        depthStencil: {
            depthWriteEnabled: false,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });

    state.sub_canvas.Pipelines["cone"] = Render_Pipeline;

    
    const conRenderPassDescriptor = {
        colorAttachments: [{
            view: undefined,
            loadOp: "clear",
            clearValue: [0.0, 0.0, 0.0, 1.0],
            storeOp: "store",
        }],
        depthStencilAttachment: {
            view: state.sub_canvas.Textures["depth"].createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };
    state.sub_canvas.passDescriptors["cone"] = conRenderPassDescriptor;

    /* ########################### Render Instance Pipeline ########################### */

    const render_particles_pipeline = device.createRenderPipeline({
        layout: state.main_canvas.Pipeline_Layouts["render_particles"],
        vertex: {
            module: device.createShaderModule({
                code: instance_vert
            }),
            entryPoint: "vs_main",
            buffers: [
                state.main_canvas.VBO_Layouts["particles"],
                state.main_canvas.VBO_Layouts["quad"]
            ]
        },
        fragment: {
            module: device.createShaderModule({
                code: instance_frag
            }),
            entryPoint: "fs_main",
            targets: [
                {
                    format: state.main_canvas["canvasFormat"],
                    // 這一步是設置 半透明度 必須的要素（取消设置，得到默认遮挡）
                    // 如果使用半透明，则将以下 depthStencil 中 depthWriteEnabled 字段设为 false
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one',
                            operation: 'add',
                        },
                    },
                }
            ]
        },
        primitive: {
            topology: "triangle-list",
            cullMode: "back"
        },
        depthStencil: {
            // 如果使能以上的半透明，则将以下的 depthWriteEnabled 字段改为 false
            depthWriteEnabled: false,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });
    state.sub_canvas.Pipelines["render_particles"] = render_particles_pipeline;


    

    const renderInstancePassDescriptor = {
        colorAttachments: [
            {
                view: undefined,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }
        ],
        depthStencilAttachment: {
            view: state.sub_canvas.Textures["depth"].createView(),
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store"
        }
    };
    state.sub_canvas.passDescriptors["render_instance"] = renderInstancePassDescriptor;

}




export { set_Pipeline_sub }
