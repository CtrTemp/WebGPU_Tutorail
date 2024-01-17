import { vec3, vec4 } from "wgpu-matrix";


function SBO_creation(state, device) {

    const mip_SBO_Arr_size = state.CPU_storage.instance_info["numInstances"];
    /**
     *  GPU 端 Storage Buffer
     * */
    const mipStorageBuffer = device.createBuffer({
        size: mip_SBO_Arr_size * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
        // mappedAtCreation: true,
    });

    state.GPU_memory.SBOs["mip"] = mipStorageBuffer;


    /**
     *  Storage Buffer 在 CPU 端的映射 用于数据回传后读取以及向后端传输
     * */
    const mip_info_MappedBuffer = device.createBuffer({
        size: mip_SBO_Arr_size * 4,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["mip_read_back"] = mip_info_MappedBuffer;


    /**
     *  Trace Ray Nearest Pos SBO creation
     * */
    const Nearest_Hit_Distance_SBO_BufferSize =
        1 * 4 + // float
        3 * 4 + // padding
        0;
    const Nearest_Hit_Distance_SBO = device.createBuffer({
        size: Nearest_Hit_Distance_SBO_BufferSize * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // mappedAtCreation: true,
    });
    state.GPU_memory.SBOs["nearest_hit_dist"] = Nearest_Hit_Distance_SBO;


}


function compute_hitPoint(lookFrom, lookDir) {
    const z = 32.0;
    const t = z / lookDir[2];
    const hitPoint = vec4.mulScalar(lookDir, t);
    console.log("t = ", lookDir[1]);
}

function update_mip_data_SBO(state, device, event) {

    const mip_SBO_Arr_size = state.CPU_storage.instance_info["numInstances"];
    const mip_arr = state.CPU_storage.storage_arr["mip"];
    // console.log("mip_arr = ", mip_arr);
    const camera = state.camera.prim_camera;

    let window_width = window.innerWidth;
    let window_height = window.innerHeight;

    let xoffset = event.clientX;
    let yoffset = event.clientY;

    // console.log(xoffset / window_width, yoffset / window_height);

    /**
     *  归一化，以屏幕中央为原点，划分四个象限，range为【-0.5~0.5】
     * */
    let x_para = xoffset / window_width - 0.5;
    let y_para = 0.5 - yoffset / window_height;


    // console.log(x_para, y_para);

    const view_dir = state.camera.prim_camera["viewDir"];
    const right_dir = vec3.normalize(vec3.cross(view_dir, vec3.fromValues(0.0, 1.0, 0.0)));
    const up_dir = vec3.normalize(vec3.cross(right_dir, view_dir));

    const half_screen_height = camera.z_near * Math.tan(camera.fov / 2);
    const half_screen_width = half_screen_height * camera.aspect;
    // console.log(half_screen_height, half_screen_width);

    const middle_point = vec3.add(camera.lookFrom, vec3.mulScalar(camera.viewDir, camera.z_near));

    // console.log(middle_point);

    const lookAt_X = middle_point[0] + 2 * half_screen_width * right_dir[0] * x_para;
    const lookAt_Y = middle_point[1] + 2 * half_screen_height * up_dir[1] * y_para;
    const lookAt_Z = middle_point[2];


    const lookFrom = state.camera.prim_camera["lookFrom"];

    // console.log("state.camera.prim_camera = ", state.camera.prim_camera);
    // 这里坚决不能normalize！！！
    // const lookDir = vec4.normalize(vec4.fromValues(
    //     lookAt_X - camera.lookFrom[0],
    //     lookAt_Y - camera.lookFrom[1],
    //     lookAt_Z - camera.lookFrom[2],
    //     1.0));
    const lookDir = vec4.fromValues(
        lookAt_X - camera.lookFrom[0],
        lookAt_Y - camera.lookFrom[1],
        lookAt_Z - camera.lookFrom[2],
        1.0);
    compute_hitPoint(lookFrom, lookDir);


}


function fill_nearest_dist_SBO_init(state, device) {
    const nearest_dist_Buffer = state.GPU_memory.SBOs["nearest_hit_dist"];
    const writeBuffer = new Float32Array([0.0]);
    device.queue.writeBuffer(nearest_dist_Buffer, 0, writeBuffer);
}








export { SBO_creation, fill_nearest_dist_SBO_init, update_mip_data_SBO }