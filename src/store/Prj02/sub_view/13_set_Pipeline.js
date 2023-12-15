
import { vertex_shader, fragment_shader } from '../../../assets/Shaders/Prj02/sub_canvas/shader.js'

function set_Pipeline(state, device) {

    /* ########################### Render Pipeline ########################### */

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
            buffers: [state.sub_canvas.VBO_Layouts["rect"]]
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

    state.sub_canvas.Pipelines["rect"] = Render_Pipeline;
}




export { set_Pipeline }
