function set_Layout(state, device) {

    const MVP_UBO_Layout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {
                type: "uniform"
            }
        }]
    });
    state.sub_canvas.Layouts["mvp"] = MVP_UBO_Layout;
}


export { set_Layout }
