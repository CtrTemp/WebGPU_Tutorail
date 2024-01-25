
import { vec3, vec4, mat4 } from "wgpu-matrix"

function UBO_creation(state, device) {

        /**
         *  MVP-Matrix
         * */
        const MVP_Buffer_size = 4 * 4 * 4;
        const MVP_UBO_Buffer = device.createBuffer({
            size: MVP_Buffer_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        state.GPU_memory.UBOs["mvp"] = MVP_UBO_Buffer;

        /**
         *  View-Matrix
         * */
        const View_Buffer_size = 4 * 4 * 4;
        const View_UBO_Buffer = device.createBuffer({
            size: View_Buffer_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        state.GPU_memory.UBOs["view"] = View_UBO_Buffer;

        /**
         *  Projection-Matrix
         * */
        const Projection_Buffer_size = 4 * 4 * 4;
        const Projection_UBO_Buffer = device.createBuffer({
            size: Projection_Buffer_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        state.GPU_memory.UBOs["projection"] = Projection_UBO_Buffer;

        /**
         *  right side vec
         * */
        const RIGHT_Buffer_size = 3 * 4;
        const RIGHT_UBO_Buffer = device.createBuffer({
            size: RIGHT_Buffer_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        state.GPU_memory.UBOs["right"] = RIGHT_UBO_Buffer;

        /**
         *  up side vec
         * */
        const UP_Buffer_size = 3 * 4;
        const UP_UBO_Buffer = device.createBuffer({
            size: UP_Buffer_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        state.GPU_memory.UBOs["up"] = UP_UBO_Buffer;


        const simu_Control_UBO_BufferSize =
            1 * 4 + // deltaTime
            3 * 4 + // padding
            4 * 4 + // seed
            1 * 4 + // particle_nums
            1 * 4 + // pause simulation
            2 * 4 + // padding
            0;
        const simu_Control_UBO_Buffer = device.createBuffer({
            size: simu_Control_UBO_BufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        state.GPU_memory.UBOs["compute"] = simu_Control_UBO_Buffer;


        /**
         *  Trace Ray UBO creation
         * */
        const Trace_Ray_LookFrom_UBO_Buffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        state.GPU_memory.UBOs["ray_from"] = Trace_Ray_LookFrom_UBO_Buffer;


        const Trace_Ray_CursorDir_UBO_Buffer = device.createBuffer({
            size: 4 * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        state.GPU_memory.UBOs["ray_dir"] = Trace_Ray_CursorDir_UBO_Buffer;

        /**
         *  Interaction Related UBO
         * */
        const interaction_info_size =
            1 * 4 + // z-plane depth for fish-eye lens 
            0;
        const Interaction_UBO = device.createBuffer({
            size: interaction_info_size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        state.GPU_memory.UBOs["interaction"] = Interaction_UBO;

    }


function fill_MVP_UBO_quad(state, device) {

    /**
     *  View Matrix
     * */
    const viewMatrix = state.camera.prim_camera["view"];
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["view"],
        0,
        viewMatrix.buffer,
        viewMatrix.byteOffset,
        viewMatrix.byteLength
    );


    /**
     *  Projection Matrix
     * */
    const projectionMatrix = state.camera.prim_camera["projection"];
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["projection"],
        0,
        projectionMatrix.buffer,
        projectionMatrix.byteOffset,
        projectionMatrix.byteLength
    );


    /**
     *  View-Projection Matrix
     * */
    const viewProjectionMatrix = state.camera.prim_camera["matrix"];
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["mvp"],
        0,
        viewProjectionMatrix.buffer,
        viewProjectionMatrix.byteOffset,
        viewProjectionMatrix.byteLength
    );

    /**
     *  Right Up Vector
     * */
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["right"],
        0,
        new Float32Array([
            viewMatrix[0], viewMatrix[4], viewMatrix[8], // right
        ])
    );
    device.queue.writeBuffer(
        state.GPU_memory.UBOs["up"],
        0,
        new Float32Array([
            viewMatrix[1], viewMatrix[5], viewMatrix[9], // up
        ])
    );

}


function fill_Interaction_UBO(state, device) {
    const Interaction_UBO = state.GPU_memory.UBOs["interaction"];
    const writeBuffer = new Float32Array([
        state.CPU_storage.interaction_info["z_plane_depth"]
    ]);

    device.queue.writeBuffer(Interaction_UBO, 0, writeBuffer);
}


/**
 *  更新光标位置对应的 Trace Ray
 * */
function update_and_fill_Trace_Ray_UBO(state, device, event) {
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


    const Trace_Ray_LookFrom_UBO_Buffer = state.GPU_memory.UBOs["ray_from"];
    const lookFrom_Arr = new Float32Array([
        camera.lookFrom[0],
        camera.lookFrom[1],
        camera.lookFrom[2],
        1.0,
    ]);
    device.queue.writeBuffer(Trace_Ray_LookFrom_UBO_Buffer, 0, lookFrom_Arr);


    const Trace_Ray_CursorDir_UBO_Buffer = state.GPU_memory.UBOs["ray_dir"];

    const cursorDir_Arr = vec4.normalize(vec4.fromValues(
        lookAt_X - camera.lookFrom[0],
        lookAt_Y - camera.lookFrom[1],
        lookAt_Z - camera.lookFrom[2],
        1.0));

    // console.log("cursorDir_Arr = ", cursorDir_Arr);
    device.queue.writeBuffer(Trace_Ray_CursorDir_UBO_Buffer, 0, cursorDir_Arr);

}


export {
    UBO_creation,
    fill_MVP_UBO_quad,
    fill_Interaction_UBO,
    update_and_fill_Trace_Ray_UBO,
}
