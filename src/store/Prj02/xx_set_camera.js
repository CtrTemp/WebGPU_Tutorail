import { reactive } from "vue";
import { mat4, vec3, vec4 } from "wgpu-matrix"


// function observe(data) {
//     if (!data || typeof data !== 'object') {
//         return;
//     }
//     // 取出所有属性遍历
//     Object.keys(data).forEach(function (key) {
//         defineReactive(data, key, data[key]);
//     });
// };

// function defineReactive(data, key, val) {
//     observe(val); // 监听子属性
//     Object.defineProperty(data, key, {
//         enumerable: false, // 可枚举
//         configurable: false, // 不能再define
//         get: function () {
//             return val;
//         },
//         set: function (newVal) {
//             // console.log('哈哈哈，监听到值变化了 ', val, ' --> ', newVal);
//             val = newVal;
//         }
//     });
// }


function init_Camera(state, device, gui) {

    let camera = state.prim_camera;


    const fov = (2 * Math.PI) / 4;//90°
    const aspect = state.canvas.width / state.canvas.height;
    const z_far = 1000.0;
    const z_near = 0.5;
    let projection = mat4.perspective(fov, aspect, z_near, z_far);


    const lookFrom = vec3.fromValues(0.0, 0.0, -2);
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
    // 为了监测相机坐标，单独设置一个结构体
    camera["pos"] = {
        x: lookFrom.at(0),
        y: lookFrom.at(1),
        z: lookFrom.at(2),
    }

    // 相机矩阵（需要根据相机基本参数计算得到）
    camera["matrix"] = viewProjectionMatrix;
    camera["view"] = view;
    camera["projection"] = projection;

    // 其他附加参数
    state.mouse_info["dragging"] = false;     // 当前鼠标是否正在拖动的标志
    state.mouse_info["firstMouse"] = false;   // 是否首次点击鼠标
    state.mouse_info["lastX"] = 0;
    state.mouse_info["lastY"] = 0;

    // 解算得到的相机方位角
    camera["yaw"] = Math.PI / 2;
    camera["pitch"] = 0.0;

    // defineReactive(state.prim_camera, "yaw", Math.PI / 2);
    // defineReactive(state.prim_camera, "pitch", 0.0);
    // 如果没有滚转角更新，则可以不考虑相机up方向的更新，也不会影响解算right方向
    // camera["roll"] = 0.0; // 不需要 roll

    // 相机移动敏感度
    state.mouse_info["drag_speed"] = 0.005;
    state.mouse_info["wheel_speed"] = 0.005;
    state.keyboard_info["speed"] = 0.25;

    /**
     *  GUI para 
     * */
    const range = 20;
    gui.add(state.prim_camera, 'pitch', -2.0, 2.0, 0.01);
    gui.add(state.prim_camera, 'yaw', -2.0, 2.0, 0.01);
    gui.add(state.prim_camera.pos, "x", -range, range, 0.01);
    gui.add(state.prim_camera.pos, "y", -range, range, 0.01);
    gui.add(state.prim_camera.pos, "z", -range, range, 0.01);

}


/**
 *  更新相机参数
 *  根据相机的基本参数，更新相机矩阵
 * */
function updateCamera(state, device, gui) {
    let camera = state.prim_camera;

    camera.pos.x = camera.lookFrom.at(0);
    camera.pos.y = camera.lookFrom.at(1);
    camera.pos.z = camera.lookFrom.at(2);

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


    // !!! 注意这里必须手动触发更新才行
    gui.updateDisplay();
}


function moveCamera(state, device) {
    let camera = state.prim_camera;
    camera["lookFrom"][2] = Math.sin(Date.now() / 1000) * 2 - 5;
    updateCamera(state, device, gui);
}

/**
 *  将相机移动到默认原位观察点
 * */
function defocusCamera(state, device, gui) {
    let step = 20;
    let time_stride = 25; // 25ms 一次坐标更新（尽量保证与帧率一致或小于帧率）

    let camera = state.prim_camera;

    const current_camera_pos = camera.lookFrom;  // vec3
    const targets_camera_pos = vec3.fromValues(0.0, 0.0, -5.0);
    let dir_vec = vec3.sub(targets_camera_pos, current_camera_pos);
    let dir_vec_unit = vec3.divScalar(dir_vec, step);


    const current_camera_pitch = camera.pitch;
    const targets_camera_pitch = 0;
    let pitch_unit = (targets_camera_pitch - current_camera_pitch) / step;


    const current_camera_yaw = camera.yaw;
    const targets_camera_yaw = 1.57;
    let yaw_unit = (targets_camera_yaw - current_camera_yaw) / step;

    let timer = setInterval(() => {

        // 更新 lookFrom
        camera["lookFrom"] = vec3.add(camera["lookFrom"], dir_vec_unit);

        // 更新 pitch 和 yaw
        state.prim_camera["yaw"] += yaw_unit;
        state.prim_camera["pitch"] += pitch_unit;

        // 进一步更新 viewDir
        let new_view_dir = vec3.fromValues(
            Math.cos(state.prim_camera["yaw"]) * Math.cos(state.prim_camera["pitch"]),
            Math.sin(state.prim_camera["pitch"]),
            Math.sin(state.prim_camera["yaw"]) * Math.cos(state.prim_camera["pitch"])
        );

        state.prim_camera["viewDir"] = new_view_dir;


        updateCamera(state, device, gui);


    }, time_stride);

    setTimeout(() => {
        clearInterval(timer);
    }, step * time_stride);

}


function focusCamera(state, device, gui) {
    let step = 20;
    let time_stride = 25; // 25ms 一次坐标更新（尽量保证与帧率一致或小于帧率）

    let camera = state.prim_camera;

    const current_camera_pos = camera.lookFrom;  // vec3
    const targets_camera_pos = vec3.fromValues(9.15, 8.22, -8.91);

    let dir_vec = vec3.sub(targets_camera_pos, current_camera_pos);
    let dir_vec_unit = vec3.divScalar(dir_vec, step);


    const current_camera_pitch = camera.pitch;
    const targets_camera_pitch = -0.57;
    let pitch_unit = (targets_camera_pitch - current_camera_pitch) / step;


    const current_camera_yaw = camera.yaw;
    const targets_camera_yaw = 2.28;
    let yaw_unit = (targets_camera_yaw - current_camera_yaw) / step;


    let timer = setInterval(() => {

        // 更新 lookFrom
        camera["lookFrom"] = vec3.add(camera["lookFrom"], dir_vec_unit);

        // 更新 pitch 和 yaw
        state.prim_camera["yaw"] += yaw_unit;
        state.prim_camera["pitch"] += pitch_unit;

        // 进一步更新 viewDir
        let new_view_dir = vec3.fromValues(
            Math.cos(state.prim_camera["yaw"]) * Math.cos(state.prim_camera["pitch"]),
            Math.sin(state.prim_camera["pitch"]),
            Math.sin(state.prim_camera["yaw"]) * Math.cos(state.prim_camera["pitch"])
        );

        state.prim_camera["viewDir"] = new_view_dir;


        updateCamera(state, device, gui);

    }, time_stride);

    setTimeout(() => {
        clearInterval(timer);
    }, step * time_stride);
}


export { init_Camera, updateCamera, moveCamera, defocusCamera, focusCamera }
