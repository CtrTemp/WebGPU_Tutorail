

/**
 *   Stage00：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
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


export { init_device_sub }
