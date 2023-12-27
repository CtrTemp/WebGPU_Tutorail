

/**
 *   Stage00：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
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


export { init_device_main }
