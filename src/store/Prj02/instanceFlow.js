
// GUI
import * as dat from "dat.gui"

import { manage_Texture } from "./main_view/01_manage_Texture";
import { manage_VBO, manage_VBO_Layout } from "./main_view/02_manage_VBO"
import { manage_UBO } from "./main_view/03_manage_UBO"
import { set_Layout } from "./main_view/11_set_Layout";
import { set_BindGroup } from "./main_view/12_set_BindGroup";
import { set_Pipeline } from "./main_view/13_set_Pipeline";
import {
    init_Camera,
    moveCamera,
    defocusCamera,
    focusCamera,
    focusOnRandomPic
} from "./main_view/xx_set_camera.js"


import { canvasMouseInteraction, canvasKeyboardInteraction } from "./main_view/xx_interaction";




/**
 *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
 */
function init_device_main(state, { canvas, device }) {
    state.main_canvas.canvas = canvas;
    state.main_canvas.GPU_context = canvas.getContext("webgpu");
    state.main_canvas.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    state.main_canvas.GPU_context.configure({
        device: device,
        format: state.main_canvas.canvasFormat,
    });
    
}


/**
 *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
 * 并借助API将CPU读入的数据导入device 
 */
function manage_data_main(state, payload) {
    
    /**
     *  初始化设置相机参数
     * */
    // 注意，这里是单向控制的GUI，只能通过页面交互观察参数，还未实现通过GUI进行控制
    init_Camera(state, payload.device, payload.gui);


    /**
     *  Texture
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
     *  UBO
     * */
    manage_UBO(state, payload);
}

/**
 *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
 * */
function manage_pipeline_main(state, device) {

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
function renderLoop_main(state, payload) {

    const device = payload.device;


    // 初始化状态，是否直接开启浏览动画
    state.main_canvas.simu_info["simu_pause"] = 0.0;
    state.main_canvas.simu_info["simu_speed"] = 0.001; // 设置为0则不运动

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





    const gui = payload.gui;

    const view = state.main_canvas.prim_camera["view"];
    const projection = state.main_canvas.prim_camera["projection"];
    const viewProjectionMatrix = state.main_canvas.prim_camera["matrix"];
    // GPU 端更新相机参数
    device.queue.writeBuffer(
        state.main_canvas.UBOs["mvp"],
        0,
        viewProjectionMatrix.buffer,
        viewProjectionMatrix.byteOffset,
        viewProjectionMatrix.byteLength
    );

    device.queue.writeBuffer(
        state.main_canvas.UBOs["right"],
        0,
        new Float32Array([
            view[0], view[4], view[8], // right
        ])
    );
    device.queue.writeBuffer(
        state.main_canvas.UBOs["up"],
        0,
        new Float32Array([
            view[1], view[5], view[9], // up
        ])
    );



    /**
     *  Canvas 键鼠交互事件注册
     * 
     * */

    // canvas 注册鼠标交互事件
    canvasMouseInteraction(state, device, gui);

    // canvas 注册键盘交互事件
    canvasKeyboardInteraction(state, device, gui, payload.flow_info);

    // // 初始化相机
    // setTimeout(() => {
    //     defocusCamera(state, device, gui);
    // }, 200);
    // setTimeout(() => {
    //     focusOnRandomPic(state, device, gui, payload.flow_info);
    // }, 800);

    setInterval(() => {


        const renderPassDescriptor = state.main_canvas.passDescriptors["render_particles"];

        // 自适应 canvas 大小

        const window_width = window.innerWidth;
        const window_height = window.innerHeight;
        state.main_canvas.canvas.width = window_width;
        state.main_canvas.canvas.height = window_height;



        renderPassDescriptor.colorAttachments[0].view = state.main_canvas.GPU_context
            .getCurrentTexture()
            .createView();

        // depth texture 重建
        state.main_canvas.Textures["depth"].destroy();
        state.main_canvas.Textures["depth"] = device.createTexture({
            size: [window_width, window_height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })

        renderPassDescriptor.depthStencilAttachment.view = state.main_canvas.Textures["depth"].createView();


        // camera aspect 更新
        state.main_canvas.prim_camera["aspect"] = window_width / window_height;

        const encoder = device.createCommandEncoder();

        /**
         *  Simulation Pass
         * */
        {
            const pass = encoder.beginComputePass();
            pass.setPipeline(state.main_canvas.Pipelines["simu_particles"]);
            pass.setBindGroup(0, state.main_canvas.BindGroups["compute"]);
            pass.dispatchWorkgroups(Math.ceil(state.main_canvas.particle_info["numParticles"] / 64));
            pass.end();
        }


        /**
         *  Render Pass
         * */
        {
            const pass = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(state.main_canvas.Pipelines["render_particles"]);
            pass.setBindGroup(0, state.main_canvas.BindGroups["mvp_pack"]);
            pass.setBindGroup(1, state.main_canvas.BindGroups["sample"]);
            pass.setVertexBuffer(0, state.main_canvas.VBOs["particles"]);
            pass.setVertexBuffer(1, state.main_canvas.VBOs["quad"]);
            pass.draw(6, state.main_canvas.particle_info["numParticles"], 0, 0);

            pass.end();
        }

        device.queue.submit([encoder.finish()]);
        if (!state.main_canvas.simu_info["simu_pause"]) {
            state.main_canvas.simu_info["simu_time"] += state.main_canvas.simu_info["simu_speed"];
        }
    }, 25);
}


export{
    init_device_main, manage_data_main, manage_pipeline_main, renderLoop_main
}
