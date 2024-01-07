function BindGroup_creation_sub(state, device) {

    const MVP_UBO_BindGroup = device.createBindGroup({
        layout: state.CPU_storage.Layouts["mvp_sub"],
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: state.GPU_memory.UBOs["mvp_sub"]
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: state.GPU_memory.UBOs["right_sub"]
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: state.GPU_memory.UBOs["up_sub"]
                }
            },
        ]
    });
    state.CPU_storage.BindGroups["mvp_sub"] = MVP_UBO_BindGroup;

}




export { BindGroup_creation_sub }
