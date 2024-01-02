import { vertex_shader, fragment_shader, global_shader } from '../../assets/Shaders/Test01/shader.js'
import { move_vertex_compute } from '../../assets/Shaders/Test01/compute.js';


/**
 *  渲染管线
 * */
function set_Render_Pipeline(state, device) {

    const triangle_Render_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [state.Layouts["void"]]
    });

    state.Pipeline_Layouts["render_triangle"] = triangle_Render_Pipeline_Layout;

    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        layout: triangle_Render_Pipeline_Layout,
        vertex: {
            module: device.createShaderModule({
                code: vertex_shader
            }),
            entryPoint: "vertexMain",   // 指定 vertex shader 入口函数
            buffers: [state.VBO_Layouts["triangle"]]
        },
        fragment: {
            module: device.createShaderModule({
                code: fragment_shader
            }),
            entryPoint: "fragmentMain", // 指定 fragment shader 入口函数
            targets: [{
                format: state.canvasFormat
            }]
        }
    });

    state.Pipelines["render_triangle"] = cellPipeline;


    console.log("Render Pipeline Manage Done~");
}




/**
 *  计算管线
 * */
function set_Compute_Pipeline(state, device) {


    const vertex_Move_Compute_Pipeline_Layout = device.createPipelineLayout({
        bindGroupLayouts: [state.Layouts["move_vertex"]]
    });

    state.Pipeline_Layouts["move_vertex"] = vertex_Move_Compute_Pipeline_Layout;

    const computePipeline = device.createComputePipeline({
        layout: vertex_Move_Compute_Pipeline_Layout,
        compute: {
            module: device.createShaderModule({
                code: move_vertex_compute,
            }),
            entryPoint: 'simulate',
        },
    });
    state.Pipelines["move_vertex"] = computePipeline;


    console.log("Compute Pipeline Manage Done~");
}

export { set_Render_Pipeline, set_Compute_Pipeline }
