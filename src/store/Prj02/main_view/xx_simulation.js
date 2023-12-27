
/**
 *  对主视图可能进行的一些仿真/动画效果参数进行配置
 */
function init_simulation(state, device) {
    
    // 初始化状态，是否直接开启浏览动画
    state.main_canvas.simu_info["simu_pause"] = 0.0;
    state.main_canvas.simu_info["simu_speed"] = 0.000; // 设置为0则不运动

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

}


export { init_simulation }