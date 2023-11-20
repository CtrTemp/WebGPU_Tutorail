import { mat4, vec3, vec4 } from "wgpu-matrix"

function init_Camera(state, device) {

    let camera = state.prim_camera;


    const fov = (2 * Math.PI) / 4;//90°
    const aspect = state.canvas.width / state.canvas.height;
    const z_far = 1000.0;
    const z_near = 0.5;
    let projection = mat4.perspective(fov, aspect, z_near, z_far);


    const lookFrom = vec3.fromValues(0.0, 0.0, -3.5);
    const viewDir = vec3.fromValues(0.0, 0.0, 1.0);
    const lookAt = vec3.add(lookFrom, viewDir);
    const up = vec3.fromValues(0, 1, 0);
    let view = mat4.lookAt(lookFrom, lookAt, up);


    /**
     *  注意变换顺序不能更改，依次为：缩放-旋转-平移
     *  （前两者由于是线性变换所以可以更改顺序？）
     *  另外，在相机实例中，不应该出现对于model的变换，view+project属于相机
     * model属于空间中物体
     * */
    // const model = mat4.identity();

    // mat4.rotateX(model,);
    // mat4.rotateY();
    // mat4.rotateZ();

    const viewProjectionMatrix = mat4.multiply(projection, view);


    // 相机基本参数
    camera["fov"] = fov;            // 视场角
    camera["aspect"] = aspect;      // 屏幕宽高比
    camera["z_near"] = z_near;      // 视锥近平面
    camera["z_far"] = z_far;        // 视锥远平面

    camera["lookFrom"] = lookFrom;  // 相机/观察者位点
    camera["viewDir"] = viewDir;    // 单位向量
    camera["up"] = up;              // 相机相对向上向量

    // 相机矩阵（需要根据相机基本参数计算得到）
    camera["matrix"] = viewProjectionMatrix;
    camera["view"] = view;
    camera["projection"] = projection;

    // 其他附加参数
    state.mouse_info["dragging"] = false;     // 当前鼠标是否正在拖动的标志
    state.mouse_info["firstMouse"] = false;   // 是否首次点击鼠标
    state.mouse_info["lastX"] = 0;
    state.mouse_info["lastY"] = 0;

    // // 解算得到的相机方位角
    camera["yaw"] = Math.PI / 2;
    camera["pitch"] = 0.0;
    // 如果没有滚转角更新，则可以不考虑相机up方向的更新，也不会影响解算right方向
    // camera["roll"] = 0.0; // 不需要 roll

    // 相机移动敏感度
    state.mouse_info["drag_speed"] = 0.005;
    state.mouse_info["wheel_speed"] = 0.005;
    state.keyboard_info["speed"] = 0.25;

}


// 
/**
 *  更新相机参数
 *  根据相机的基本参数，更新相机矩阵
 * */
function updateCamera(state, device) {
    let camera = state.prim_camera;

    let projection = mat4.perspective(
        camera["fov"],
        camera["aspect"],
        camera["z_near"],
        camera["z_far"]
    );
    let view = mat4.lookAt(
        camera["lookFrom"],
        vec3.add(camera["lookFrom"], camera["viewDir"]),
        camera["up"]
    );

    const viewProjectionMatrix = mat4.multiply(projection, view);


    camera["matrix"] = viewProjectionMatrix;
    camera["view"] = view;
    camera["projection"] = projection;


    // GPU 端更新相机参数
    device.queue.writeBuffer(
        state.UBOs["mvp"],
        0,
        viewProjectionMatrix.buffer,
        viewProjectionMatrix.byteOffset,
        viewProjectionMatrix.byteLength
    );

    device.queue.writeBuffer(
        state.UBOs["right"],
        0,
        new Float32Array([
            view[0], view[4], view[8], // right
        ])
    );
    device.queue.writeBuffer(
        state.UBOs["up"],
        0,
        new Float32Array([
            view[1], view[5], view[9], // up
        ])
    );
}




export { init_Camera, updateCamera }
