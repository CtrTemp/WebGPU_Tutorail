function set_Layout(state, device) {

    const void_Layout = device.createBindGroupLayout({
        entries: []
    });
    state.Layouts["void"] = void_Layout;

    const compute_SBO_Layout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "storage"
                }
            }
        ]
    });
    state.Layouts["move_vertex"] = compute_SBO_Layout;
}




export { set_Layout }
