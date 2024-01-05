

import {
    manage_VBO_sub,
} from "./sub_view/02_manage_VBO"

import { canvasMouseInteraction } from "./sub_view/xx_interaction";


/**  
 *  Stage04：启动渲染循环
 * */
function renderLoop_sub(state, device) {

    // canvas 注册鼠标交互事件
    canvasMouseInteraction(state, device);

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
        manage_VBO_sub(state, device);



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
            pass.setPipeline(state.sub_canvas.Pipelines["render_instances"]);
            pass.setBindGroup(0, state.sub_canvas.BindGroups["mvp"]);
            pass.setBindGroup(1, state.main_canvas.BindGroups["sample"]);
            pass.setBindGroup(2, state.main_canvas.BindGroups["mip_vertex"]);
            pass.setVertexBuffer(0, state.main_canvas.VBOs["instances"]);
            pass.setVertexBuffer(1, state.main_canvas.VBOs["quad"]);
            pass.draw(6, state.main_canvas.instance_info["numInstances"], 0, 0);


            pass.end();
        }

        device.queue.submit([encoder.finish()]);
    }, 25);

}


export { renderLoop_sub }
