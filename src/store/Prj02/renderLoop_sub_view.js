
import { render_sub_view } from "./sub_view/21_GPU_Pass";
import { Update_and_Fill_Cone_VBO } from "./sub_view/02_manage_VBO";

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

        const renderPassDescriptor = state.sub_canvas.passDescriptors["render_instances"];
        /**
         *  update cone vertex from current main camera
         * */ 
        Update_and_Fill_Cone_VBO(state, device);


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
