
import { init_simulation } from "./main_view/xx_simulation";

/**
 *  Stage04：启动渲染循环
 * */
function renderLoop_main(state, device) {

    // // 目前不开启 simulation
    // init_simulation(state, device);

    const view = state.main_canvas.prim_camera["view"];
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


    // // 初始化相机
    // setTimeout(() => {
    //     defocusCamera(state, device, gui);
    // }, 200);
    // setTimeout(() => {
    //     focusOnRandomPic(state, device, gui, payload.flow_info);
    // }, 800);








    // /**
    //  *  测试，一次性执行：调用 compute shader 计算MipLevel
    //  * */
    // {
    //     /**
    //      *  填充 UBO 矩阵
    //      * */

    //     const viewMatrix = state.main_canvas.prim_camera["view"];
    //     device.queue.writeBuffer(
    //         state.main_canvas.UBOs["view"],
    //         0,
    //         viewMatrix.buffer,
    //         viewMatrix.byteOffset,
    //         viewMatrix.byteLength
    //     );

    //     const projectionMatrix = state.main_canvas.prim_camera["projection"];
    //     device.queue.writeBuffer(
    //         state.main_canvas.UBOs["projection"],
    //         0,
    //         projectionMatrix.buffer,
    //         projectionMatrix.byteOffset,
    //         projectionMatrix.byteLength
    //     );


    //     /**
    //      *  Encode Pass 填充
    //      * */
    //     const encoder = device.createCommandEncoder();
    //     const pass = encoder.beginComputePass();
    //     pass.setPipeline(state.main_canvas.Pipelines["update_miplevel"]);
    //     pass.setBindGroup(0, state.main_canvas.BindGroups["mip_instance_arr"]); // group0
    //     pass.setBindGroup(1, state.main_canvas.BindGroups["view_projection"]);  // group1
    //     pass.dispatchWorkgroups(Math.ceil(state.main_canvas.particle_info["numParticles"] / 64));
    //     pass.end();

    //     /**
    //      *  队列提交
    //      * */

    //     device.queue.submit([encoder.finish()]);

    //     // 查看返回结果

    //     const readBack_encoder = device.createCommandEncoder();
    //     readBack_encoder.copyBufferToBuffer(
    //         state.main_canvas.SBOs["mip"],
    //         0,
    //         state.main_canvas.SBOs["mip_read_back"],
    //         0,
    //         state.main_canvas.particle_info["numParticles"] * 4,
    //     );
        
    //     device.queue.submit([readBack_encoder.finish()]);

    //     setTimeout(async () => {
    //         await state.main_canvas.SBOs["mip_read_back"].mapAsync(GPUMapMode.READ);
    //         const arrBuffer = new Float32Array(state.main_canvas.SBOs["mip_read_back"].getMappedRange());
    //         console.log("hello~ readBuffer = ", arrBuffer);
    //     }, 1000);

    // }


    let timerID = setInterval(() => {

        if (state.fence["RENDER_READY"] == false) {
            clearInterval(timerID);
        }


        const renderPassDescriptor = state.main_canvas.passDescriptors["render_instances"];

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

        // /**
        //  *  Simulation Pass 暂不启用动画
        //  * */
        // {
        //     const pass = encoder.beginComputePass();
        //     pass.setPipeline(state.main_canvas.Pipelines["simu_particles"]);
        //     pass.setBindGroup(0, state.main_canvas.BindGroups["compute"]);
        //     pass.dispatchWorkgroups(Math.ceil(state.main_canvas.instance_info["numInstances"] / 64));
        //     pass.end();
        // }


        /**
         *  Render Pass
         * */
        {
            const pass = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(state.main_canvas.Pipelines["render_instances"]);
            pass.setBindGroup(0, state.main_canvas.BindGroups["mvp_pack"]);
            pass.setBindGroup(1, state.main_canvas.BindGroups["sample"]);
            pass.setBindGroup(2, state.main_canvas.BindGroups["mip_vertex"]);
            pass.setVertexBuffer(0, state.main_canvas.VBOs["instances"]);
            pass.setVertexBuffer(1, state.main_canvas.VBOs["quad"]);
            pass.draw(6, state.main_canvas.instance_info["numInstances"], 0, 0);

            pass.end();
        }

        device.queue.submit([encoder.finish()]);
        if (!state.main_canvas.simu_info["simu_pause"]) {
            state.main_canvas.simu_info["simu_time"] += state.main_canvas.simu_info["simu_speed"];
        }
    }, 25);
}


export { renderLoop_main }
