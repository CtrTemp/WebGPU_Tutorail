
import {
    render_main_view_quad,
    compute_miplevel_pass_quad
} from "./quad_pack_view/21_GPU_Pass";
import { update_prim_Camera } from "./utils/set_camera";

/**
 *  Stage04：启动渲染循环
 * */
function renderLoop_quad(state, device) {

    /**
     *  Pre-Process
     * */


    /**
     *  Loop
     *  采用触发式，每次标志位被置位触发一次渲染，而不是使用定时器进行渲染
     * */
    // let timerID = setInterval(() => {


    // }, 25);





    const renderPassDescriptor = state.main_view_flow_quad.passDescriptors["render_instances"];

    // 自适应 canvas 大小
    const window_width = window.innerWidth;
    const window_height = window.innerHeight;
    state.main_canvas.canvas.width = window_width;
    state.main_canvas.canvas.height = window_height;


    /**
     *  color attachement reconstruct
     * */
    renderPassDescriptor.colorAttachments[0].view = state.main_canvas.GPU_context
        .getCurrentTexture()
        .createView();

    /**
     *  depth attachement reconstruct
     * */
    state.GPU_memory.Textures["depth"].destroy();
    state.GPU_memory.Textures["depth"] = device.createTexture({
        size: [window_width, window_height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
    renderPassDescriptor.depthStencilAttachment.view = state.GPU_memory.Textures["depth"].createView();

    /**
     *  camera aspect update
     * */
    state.camera.prim_camera["aspect"] = window_width / window_height;

    /**
     *  submit a pass to CMD queue as a render call
     * */
    render_main_view_quad(state, device, renderPassDescriptor);



    
    
    /**
     *  reset flags for next time trigger
     * */ 

    state.main_view_flow_quad.fence["COMPUTE_MIP_SUBMIT"] = false;
    state.main_view_flow_quad.fence["BITMAP_RECEIVED"] = false;
    state.main_view_flow_quad.fence["BITMAP_READY"] = false;
    state.main_view_flow_quad.fence["RENDER_READY"] = false;




    /**
     *  Update Camera Parameter
     * */
    update_prim_Camera(state, device);


    /**
     *  Calculate and Update MipLevel
     * */
    compute_miplevel_pass_quad(state, device);

    

    // setTimeout(() => {
    //     state.main_view_flow_quad.fence["RENDER_READY"] = true;
    // }, 25);
}


export { renderLoop_quad }
