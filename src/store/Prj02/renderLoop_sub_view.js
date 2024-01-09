
import { render_sub_view } from "./sub_view/21_GPU_Pass";
import { Update_and_Fill_Cone_VBO } from "./sub_view/02_manage_VBO";
import { update_sub_Camera } from "./utils/set_camera";

/**  
 *  Stage04：启动渲染循环
 * */
function renderLoop_sub(state, device) {

    /**
     *  Pre-Process
     * */ 


    /**
     *  Loop
     * */
    setInterval(() => {

        /**
         *  Update Camera Parameter
         * */ 
        update_sub_Camera(state, device);
        

        /**
         *  update cone vertex from current main camera
         * */ 
        Update_and_Fill_Cone_VBO(state, device);


        const renderPassDescriptor = state.sub_view_flow_debug.passDescriptors["render_instances_sub"];
        /**
         *  color attachement reconstruct
         * */ 
        renderPassDescriptor.colorAttachments[0].view = state.sub_canvas.GPU_context
            .getCurrentTexture()
            .createView();

        /**
         *  submit a pass to CMD queue as a render call
         * */ 
        render_sub_view(state, device, renderPassDescriptor);

    }, 25);

}


export { renderLoop_sub }
