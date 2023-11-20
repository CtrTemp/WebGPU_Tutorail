function manage_VBO(state, payload) {
    const device = payload.device;

    // 全局粒子總數
    state.particle_info["numParticles"] = payload.flow_info.numParticles;
    state.particle_info["lifetime"] = payload.flow_info.lifetime;
    state.particle_info["particleInstanceByteSize"] =
        4 * 4 + // pos
        4 * 4 + // color
        1 * 4 + // life time
        3 * 4 + // padding
        0;


    const particles_data = payload.flow_info.flow_arr;
    // console.log("particles data = ", particles_data);

    // 應該將以上轉換成 Float32Arr
    const writeBufferArr = new Float32Array(particles_data);


    const particlesBuffer = device.createBuffer({
        size: writeBufferArr.byteLength,
        // 這裡的 STORAGE 的用途是什麼
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(particlesBuffer, 0, writeBufferArr);
    state.VBOs["particles"] = particlesBuffer;



    const quadVertexBuffer = device.createBuffer({
        size: 6 * 4 * 4, // 6x vec4<f32>
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    // prettier-ignore
    // 不知道为啥 UV 是上下颠倒的，需要翻转 Y 轴坐标
    // 这一步我们可以在此解决也可以放在GPU端让shader来解决
    const vertexData = [
        // X    Y    U   V 
        -1.0, -1.0, 0.0, 0.0,
        +1.0, -1.0, 1.0, 0.0,
        -1.0, +1.0, 0.0, 1.0,
        -1.0, +1.0, 0.0, 1.0,
        +1.0, -1.0, 1.0, 0.0,
        +1.0, +1.0, 1.0, 1.0
    ];
    new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
    quadVertexBuffer.unmap();
    state.VBOs["quad"] = quadVertexBuffer;
}



function manage_VBO_Layout(state, payload) {
    const device = payload.device;

    const particles_VBO_Layout = {
        arrayStride: 12 * 4, // 这里是否要补全 padding 呢？？？
        stepMode: "instance", // 这个设置的含义是什么
        attributes: [
            {
                // position
                shaderLocation: 0,
                offset: 0,
                format: 'float32x4',
            },
            {
                // color
                shaderLocation: 1,
                offset: 4 * 4,
                format: 'float32x4'
            },
            {
                // lifetime
                shaderLocation: 2,
                offset: 8 * 4,
                format: 'float32x4'
            }
        ]
    };
    state.VBO_Layouts["particles"] = particles_VBO_Layout;

    const quad_VBO_Layout = {
        arrayStride: 4 * 4, // 这里是否要补全 padding 呢？？？
        stepMode: "vertex", // 这个设置的含义是什么（注意可能和 instance 有关）（默认是vertex）
        // 这个的设置很有可能与 WebGPU 没有 geometry shader 存在互补性
        attributes: [
            {
                // vertex position
                shaderLocation: 3,
                offset: 0,
                format: 'float32x2',
            },
            {
                // vertex uv
                shaderLocation: 4,
                offset: 2 * 4,
                format: 'float32x2',
            },
        ]
    };
    state.VBO_Layouts["quad"] = quad_VBO_Layout;

}


export {
    manage_VBO, manage_VBO_Layout
}
