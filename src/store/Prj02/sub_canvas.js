
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


import { canvasMouseInteraction } from "./sub_view/xx_interaction";




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

    
    // canvas 注册鼠标交互事件
    canvasMouseInteraction(state, device, gui);


    /**
     *  Loop
     * */
    setInterval(() => {

        const encoder = device.createCommandEncoder();

        /**
         *  GPU 端更新相机参数
         * */

        const view = state.sub_canvas.prim_camera["view"];
        const projection = state.sub_canvas.prim_camera["projection"];
        const viewProjectionMatrix = state.sub_canvas.prim_camera["matrix"];
        device.queue.writeBuffer(
            state.sub_canvas.UBOs["mvp"],
            0,
            viewProjectionMatrix.buffer,
            viewProjectionMatrix.byteOffset,
            viewProjectionMatrix.byteLength
        );


        /**
         *  以下选择使用更新vertex buffer的方式更新梯台的绘制
         *  注意：这可能是费时的！但鉴于要操作的数据量非常小，还是可以考虑这样去做
         * */
        /**
         *  根据相机参数更新当前相机可视区域
         * */
        manage_VBO(state, payload);



        device.queue.writeBuffer(
            state.main_canvas.UBOs["compute"],
            0,
            new Float32Array([
                state.main_canvas.simu_info["simu_speed"],
                0.0,
                0.0,
                0.0,// padding
                Math.random() * 100,
                Math.random() * 100, // seed.xy
                1 + Math.random(),
                1 + Math.random(), // seed.zw
                state.main_canvas.particle_info["lifetime"],
                state.main_canvas.simu_info["simu_pause"], // pause = false
                0.0, // paddings 
                0.0
            ])
        );



        
        const view_ = state.sub_canvas.prim_camera["view"];
        const projection_ = state.sub_canvas.prim_camera["projection"];
        const viewProjectionMatrix_ = state.sub_canvas.prim_camera["matrix"];
        // GPU 端更新相机参数
        device.queue.writeBuffer(
            state.sub_canvas.UBOs["mvp"],
            0,
            viewProjectionMatrix_.buffer,
            viewProjectionMatrix_.byteOffset,
            viewProjectionMatrix_.byteLength
        );

        device.queue.writeBuffer(
            state.sub_canvas.UBOs["right"],
            0,
            new Float32Array([
                view_[0], view_[4], view_[8], // right
            ])
        );
        device.queue.writeBuffer(
            state.sub_canvas.UBOs["up"],
            0,
            new Float32Array([
                view_[1], view_[5], view_[9], // up
            ])
        );

        // device.queue.writeBuffer(
        //     state.main_canvas.UBOs["mvp"],
        //     0,
        //     viewProjectionMatrix.buffer,
        //     viewProjectionMatrix.byteOffset,
        //     viewProjectionMatrix.byteLength
        // );

        // device.queue.writeBuffer(
        //     state.main_canvas.UBOs["right"],
        //     0,
        //     new Float32Array([
        //         view[0], view[4], view[8], // right
        //     ])
        // );
        // device.queue.writeBuffer(
        //     state.main_canvas.UBOs["up"],
        //     0,
        //     new Float32Array([
        //         view[1], view[5], view[9], // up
        //     ])
        // );



        const renderInstancePassDescriptor = state.sub_canvas.passDescriptors["render_instance"];
        renderInstancePassDescriptor.colorAttachments[0].view = state.sub_canvas.GPU_context
            .getCurrentTexture()
            .createView();
        {
            const pass = encoder.beginRenderPass(renderInstancePassDescriptor);


            /**
             *  Render Cone
             * */
            pass.setPipeline(state.sub_canvas.Pipelines["cone"]);
            pass.setBindGroup(0, state.sub_canvas.BindGroups["mvp"]);
            pass.setVertexBuffer(0, state.sub_canvas.VBOs["cone"]);
            pass.setIndexBuffer(state.sub_canvas.IBOs["cone"], 'uint16');
            pass.drawIndexed(state.sub_canvas.indices_arr["cone"].length); // cone



            /**
             *  Render Instance
             * */
            pass.setPipeline(state.sub_canvas.Pipelines["render_particles"]);
            pass.setBindGroup(0, state.sub_canvas.BindGroups["mvp"]);
            pass.setBindGroup(1, state.main_canvas.BindGroups["sample"]);
            pass.setVertexBuffer(0, state.main_canvas.VBOs["particles"]);
            pass.setVertexBuffer(1, state.main_canvas.VBOs["quad"]);
            pass.draw(6, state.main_canvas.particle_info["numParticles"], 0, 0);


            pass.end();
        }

        device.queue.submit([encoder.finish()]);
    }, 25);

}


export {
    init_device_sub, manage_data_sub, manage_pipeline_sub, renderLoop_sub
}
