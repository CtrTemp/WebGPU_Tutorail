
import {
    gen_sphere_instance,
    gen_customized_instance,
    gen_sphere_instance_pos,
    gen_sphere_instance_atlas_info
} from "./gen_curve_line";


/**
 *  对 VBO 的填充应该分两步来解决：
 *  第一步：在配置texture之前，首先根据投影信息，确定图片的位置坐标。这一步不进行GPUbuffer的填充
 *  第二步：在配置texture之后，根据texture信息以及MipLevel等信息，将图片实例在大纹理中的uv_offset
 * 等信息进行填充。这一步要进行GPUbuffer的填充。
 * */


function manage_VBO_stage1(state, payload) {

    const flow_info = gen_sphere_instance_pos(50, 100, state);

    payload.flow_info = flow_info;


    const device = payload.device;

    // 全局粒子總數
    state.main_canvas.particle_info["numParticles"] = payload.flow_info.numParticles;
    state.main_canvas.particle_info["lifetime"] = payload.flow_info.lifetime;
    state.main_canvas.particle_info["particleInstanceByteSize"] =
        4 * 4 + // pos
        4 * 4 + // color
        1 * 4 + // life time
        1 * 4 + // idx for instanced texture
        2 * 4 + // uv offset
        2 * 4 + // uv scale
        2 * 4 + // quad scale
        1 * 4 + // miplevel
        3 * 4 + // padding （注意，padding补全是非常有必要的！）
        0;


    const particles_data = payload.flow_info.flow_arr;

    // 这里还不能写GPU buffetr
    state.main_canvas.vertices_arr["instance"] = particles_data;



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
        // -1.0, 0.0, 0.0, 0.0,
        // +1.0, 0.0, 1.0, 0.0,
        // -1.0, +1.0, 0.0, 1.0,
        // -1.0, +1.0, 0.0, 1.0,
        // +1.0, 0.0, 1.0, 0.0,
        // +1.0, +1.0, 1.0, 1.0
    ];
    new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
    quadVertexBuffer.unmap();
    state.main_canvas.VBOs["quad"] = quadVertexBuffer;
}

function manage_VBO_stage2(state, payload) {
    let flow_arr = state.main_canvas.vertices_arr["instance"];
    gen_sphere_instance_atlas_info(state, flow_arr);

    /**
     *  这里应该加入打印验证
     * */

    // console.log("updated flow data = ");

    /**
     *  GPU VBO 填充
     * */
    
    const device = payload.device;
    const writeBufferArr = new Float32Array(flow_arr);

    const particlesBuffer = device.createBuffer({
        size: writeBufferArr.byteLength,
        // 這裡的 STORAGE 的用途是什麼
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(particlesBuffer, 0, writeBufferArr);
    state.main_canvas.VBOs["particles"] = particlesBuffer;


}

function manage_VBO(state, payload) {

    const flow_info = gen_sphere_instance(50, 100, state);
    // const instance_pos_arr = [
    //     [25, 0.0, 0.0],
    //     // [-5.0, 1.0, 5.0],
    // ];
    // const flow_info = gen_customized_instance(instance_pos_arr, state);
    payload.flow_info = flow_info;


    const device = payload.device;

    // 全局粒子總數
    state.main_canvas.particle_info["numParticles"] = payload.flow_info.numParticles;
    state.main_canvas.particle_info["lifetime"] = payload.flow_info.lifetime;
    state.main_canvas.particle_info["particleInstanceByteSize"] =
        4 * 4 + // pos
        4 * 4 + // color
        1 * 4 + // life time
        1 * 4 + // idx for instanced texture
        2 * 4 + // uv offset
        2 * 4 + // uv scale
        2 * 4 + // quad scale
        1 * 4 + // miplevel
        3 * 4 + // padding （注意，padding补全是非常有必要的！）
        0;


    const particles_data = payload.flow_info.flow_arr;
    // console.log("particles data = ", particles_data);
    state.main_canvas.vertices_arr["instance"] = particles_data;

    // 應該將以上轉換成 Float32Arr
    const writeBufferArr = new Float32Array(particles_data);


    const particlesBuffer = device.createBuffer({
        size: writeBufferArr.byteLength,
        // 這裡的 STORAGE 的用途是什麼
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    })
    device.queue.writeBuffer(particlesBuffer, 0, writeBufferArr);
    state.main_canvas.VBOs["particles"] = particlesBuffer;



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
        // -1.0, 0.0, 0.0, 0.0,
        // +1.0, 0.0, 1.0, 0.0,
        // -1.0, +1.0, 0.0, 1.0,
        // -1.0, +1.0, 0.0, 1.0,
        // +1.0, 0.0, 1.0, 0.0,
        // +1.0, +1.0, 1.0, 1.0
    ];
    new Float32Array(quadVertexBuffer.getMappedRange()).set(vertexData);
    quadVertexBuffer.unmap();
    state.main_canvas.VBOs["quad"] = quadVertexBuffer;
}



function manage_VBO_Layout(state, payload) {
    const device = payload.device;

    const particles_VBO_Layout = {
        arrayStride: state.main_canvas.particle_info["particleInstanceByteSize"], // 这里是否要补全 padding 呢？？？
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
                format: 'float32'
            },
            {
                // idx for instanced texture
                shaderLocation: 3,
                offset: 9 * 4,
                format: 'float32'
            },
            {
                // uv offset
                shaderLocation: 4,
                offset: 10 * 4,
                format: 'float32x2'
            },
            {
                // uv scale
                shaderLocation: 5,
                offset: 12 * 4,
                format: 'float32x2'
            },
            {
                // quad scale
                shaderLocation: 6,
                offset: 14 * 4,
                format: 'float32x2'
            },
            {
                // miplevel
                shaderLocation: 7,
                offset: 16 * 4,
                format: 'float32'
            }
        ]
    };
    state.main_canvas.VBO_Layouts["particles"] = particles_VBO_Layout;

    const quad_VBO_Layout = {
        arrayStride: 4 * 4, // 这里是否要补全 padding 呢？？？
        stepMode: "vertex", // 这个设置的含义是什么（注意可能和 instance 有关）（默认是vertex）
        // 这个的设置很有可能与 WebGPU 没有 geometry shader 存在互补性
        attributes: [
            {
                // vertex position
                shaderLocation: 8,
                offset: 0,
                format: 'float32x2',
            },
            {
                // vertex uv
                shaderLocation: 9,
                offset: 2 * 4,
                format: 'float32x2',
            },
        ]
    };
    state.main_canvas.VBO_Layouts["quad"] = quad_VBO_Layout;

}


export {
    manage_VBO,
    manage_VBO_stage1,
    manage_VBO_stage2,
    manage_VBO_Layout,
}
