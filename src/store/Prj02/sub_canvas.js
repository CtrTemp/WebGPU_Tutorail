
import { manage_Texture } from "./sub_view/01_manage_Texture";
import { manage_VBO, manage_VBO_Layout, manage_IBO } from "./sub_view/02_manage_VBO"
import { manage_UBO } from "./sub_view/03_manage_UBO"
import { set_Layout } from "./sub_view/11_set_Layout";
import { set_BindGroup } from "./sub_view/12_set_BindGroup";
import { set_Pipeline } from "./sub_view/13_set_Pipeline";
import {
    init_Camera,
} from "./sub_view/xx_set_camera.js"

import { gen_cone_vertex_from_camera } from "./sub_view/gen_cone_vertex";
import { mat4, vec3 } from "wgpu-matrix";





/**
 *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
 */
function init_device_sub(state, { canvas, device }) {
    state.sub_canvas.canvas = canvas;
    state.sub_canvas.GPU_context = canvas.getContext("webgpu");
    state.sub_canvas.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    state.sub_canvas.GPU_context.configure({
        device: device,
        format: state.sub_canvas.canvasFormat,
    });
}


/**
 *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
 * 并借助API将CPU读入的数据导入device 
 */
function manage_data_sub(state, payload) {
    /**
     *  Depth Texture
     * */
    manage_Texture(state, payload);

    /**
     *  VBO
     * */
    manage_VBO(state, payload);

    /**
     *  VBO Layout
     * */
    manage_VBO_Layout(state, payload);

    /**
     *  IBO
     * */
    manage_IBO(state, payload);

    /**
     *  UBO
     * */
    manage_UBO(state, payload);

}

/**
 *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
 * */
function manage_pipeline_sub(state, device) {
    /**
     *  UBO Layout
     * */
    set_Layout(state, device);

    /**
     *  BindGroups
     * */
    set_BindGroup(state, device);

    /**
     *  Pipelines
     * */
    set_Pipeline(state, device);
}

/**  
 *  Stage04：启动渲染循环
 * */
function renderLoop_sub(state, payload) {

    const device = payload.device;

    /**
     *  Update MVP Matrix
     * */
    const gui = payload.gui;
    init_Camera(state, device, gui);

    console.log("prim camera = ", state.sub_canvas.prim_camera);

    gen_cone_vertex_from_camera(state.sub_canvas.prim_camera, 1.0, 10.0);

    /**
     *  Loop
     * */ 
    setInterval(() => {
        
        const encoder = device.createCommandEncoder();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: state.sub_canvas.GPU_context.getCurrentTexture().createView(),
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
        });

        const sub_camera = state.sub_canvas.prim_camera;
        const prim_camera = state.main_canvas.prim_camera;

        const view = sub_camera["view"];
        const projection = sub_camera["projection"];
        const viewProjectionMatrix = sub_camera["matrix"];


        // const cone_model_matrix = mat4.identity(); // 创建一个单位矩阵

        // console.log("look from = ", prim_camera);
        // mat4.translate(cone_model_matrix, prim_camera["lookFrom"], cone_model_matrix);

        // console.log(cone_model_matrix);

        /**
         *  以下选择使用更新vertex buffer的方式更新梯台的绘制
         *  注意：这可能是费时的！但鉴于要操作的数据量非常小，还是可以考虑这样去做
         * */ 

        manage_VBO(state, payload);



        // GPU 端更新相机参数
        device.queue.writeBuffer(
            state.sub_canvas.UBOs["mvp"],
            0,
            viewProjectionMatrix.buffer,
            viewProjectionMatrix.byteOffset,
            viewProjectionMatrix.byteLength
        );

        pass.setPipeline(state.sub_canvas.Pipelines["rect"]);
        pass.setBindGroup(0, state.sub_canvas.BindGroups["mvp"]);
        pass.setVertexBuffer(0, state.sub_canvas.VBOs["rect"]);
        pass.setIndexBuffer(state.sub_canvas.IBOs["rect"], 'uint16');
        pass.drawIndexed(state.sub_canvas.indices_arr["rect"].length); // rect

        pass.end();

        device.queue.submit([encoder.finish()]);
    }, 25);

}


export {
    init_device_sub, manage_data_sub, manage_pipeline_sub, renderLoop_sub
}
