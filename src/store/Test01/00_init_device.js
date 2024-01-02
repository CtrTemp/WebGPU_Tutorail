

/**
 *   Stage00：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
 */
function init_device_main(state, { canvas, device }) {
    state.canvas = canvas;
    state.GPU_context = canvas.getContext("webgpu");
    state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

    state.GPU_context.configure({
        device: device,
        format: state.canvasFormat,
    });
    console.log("Device manage done~");
}


export { init_device_main }
