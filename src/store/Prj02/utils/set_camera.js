import { mat4, vec3, vec4 } from "wgpu-matrix"
// import { fill_MVP_UBO } from "../main_view/03_manage_UBO";
import { fill_MVP_UBO_quad } from "../quad_pack_view/03_manage_UBO";
import { fill_MVP_UBO_sub } from "../sub_view/03_manage_UBO";
import { pitch_yaw_updater_prim_cam } from "../quad_pack_view/xx_interaction";

// GUI
import * as dat from "dat.gui"


// 也可用作复位一个相机
function init_prim_Camera(state) {


    // 创建 GUI
    let gui = state.GUI["prim"];
    let reset_flag = true;
    if (gui == undefined) {
        reset_flag = false;
        gui = new dat.GUI();
        state.GUI["prim"] = gui;
    }

    let camera = state.camera.prim_camera;


    const fov = Math.PI / 2;//90°
    const aspect = state.main_canvas.canvas.width / state.main_canvas.canvas.height;
    // const aspect = 1920 / 1080;
    const z_far = 5000.0;
    const z_near = 1.0;
    camera["z_near"] = z_near;
    camera["z_far"] = z_far;
    let projection = mat4.perspective(fov, aspect, z_near, z_far);



    // const lookFrom = vec3.fromValues(-50.0, 0.0, 0.0);
    // const lookFrom = vec3.fromValues(-50.0, 110.0, -30.0);
    const lookFrom = vec3.fromValues(0.0, 0.0, -80.0);
    const viewDir = vec3.fromValues(0.0, 0.0, 1.0);
    const lookAt = vec3.add(lookFrom, viewDir);
    const up = vec3.fromValues(0.0, 1.0, 0.0);
    let view = mat4.lookAt(lookFrom, lookAt, up);

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
    if(reset_flag)
    {
        camera["pos"].x = lookFrom.at(0);
        camera["pos"].y = lookFrom.at(1);
        camera["pos"].z = lookFrom.at(2);
    }
    else
    {
        camera["pos"] = {
            x: lookFrom.at(0),
            y: lookFrom.at(1),
            z: lookFrom.at(2),
        }
    }
    
    camera["dir"] = {
        dir_x: viewDir.at(0),
        dir_y: viewDir.at(1),
        dir_z: viewDir.at(1),
    }

    // 相机矩阵（需要根据相机基本参数计算得到）
    camera["matrix"] = viewProjectionMatrix;
    camera["view"] = view;
    camera["projection"] = projection;

    // 其他附加参数
    // state.main_canvas.mouse_info["dragging"] = false;     // 当前鼠标是否正在拖动的标志
    // state.main_canvas.mouse_info["firstMouse"] = false;   // 是否首次点击鼠标
    // state.main_canvas.mouse_info["lastX"] = 0;
    // state.main_canvas.mouse_info["lastY"] = 0;

    // 解算得到的相机方位角
    camera["yaw"] = Math.PI / 2;    // 绕 y 轴转角
    // camera["yaw"] = 0.0;
    camera["pitch"] = 0.0;          // 绕 x 轴转角

    // defineReactive(state.camera.prim_camera, "yaw", Math.PI / 2);
    // defineReactive(state.camera.prim_camera, "pitch", 0.0);
    // 如果没有滚转角更新，则可以不考虑相机up方向的更新，也不会影响解算right方向
    // camera["roll"] = 0.0; // 不需要 roll

    // // 相机移动敏感度（在定义时初始化）
    // state.main_canvas.mouse_info["drag_speed"] = 0.005;
    // state.main_canvas.mouse_info["wheel_speed"] = 0.05;
    // state.main_canvas.keyboard_info["speed"] = 1.25;

    if (reset_flag) {
        return;
    }

    /**
     *  GUI para 
     * */
    const range = 1800;
    gui.add(state.camera.prim_camera, 'pitch', -2 * Math.PI, 2 * Math.PI, 0.01);
    gui.add(state.camera.prim_camera, 'yaw', -2 * Math.PI, 2 * Math.PI, 0.01);
    gui.add(state.camera.prim_camera.pos, "x", -range, range, 0.01);
    gui.add(state.camera.prim_camera.pos, "y", -range, range, 0.01);
    gui.add(state.camera.prim_camera.pos, "z", -range, range, 0.01);
    gui.add(state.camera.prim_camera.dir, "dir_x", -1.0, 1.0, 0.01);
    gui.add(state.camera.prim_camera.dir, "dir_y", -1.0, 1.0, 0.01);
    gui.add(state.camera.prim_camera.dir, "dir_z", -1.0, 1.0, 0.01);

    gui.add(state.main_canvas.mouse_info, "wheel_speed", 0.0, 0.2, 0.001);
    gui.add(state.main_canvas.mouse_info, "dragball_speed", 0.0, 0.02, 0.001);
    gui.add(state.main_canvas.mouse_info, "drag_speed", 0.0, 1, 0.001);
    gui.add(state.main_canvas.keyboard_info, "speed", 0.0, 10, 0.1);



    /**
     *  实现双向控制 pitch yaw
     * */
    gui.__controllers[0].onChange(() => {
        pitch_yaw_updater_prim_cam(state);
    })

    gui.__controllers[1].onChange(() => {
        pitch_yaw_updater_prim_cam(state);
    })


    /**
     *  实现双向控制 xyz
     * */
    gui.__controllers[2].onChange(() => {
        state.camera.prim_camera.lookFrom[0] = state.camera.prim_camera.pos["x"];
    })
    gui.__controllers[3].onChange(() => {
        state.camera.prim_camera.lookFrom[1] = state.camera.prim_camera.pos["y"];
    })
    gui.__controllers[4].onChange(() => {
        state.camera.prim_camera.lookFrom[2] = state.camera.prim_camera.pos["z"];
    })

    console.log("camera = ", camera);
}


/**
 *  更新相机参数
 *  根据相机的基本参数，更新相机矩阵
 * */
function update_prim_Camera(state, device) {
    let camera = state.camera.prim_camera;
    let gui = state.GUI["prim"];

    camera.pos.x = camera.lookFrom.at(0);
    camera.pos.y = camera.lookFrom.at(1);
    camera.pos.z = camera.lookFrom.at(2);

    camera.dir.dir_x = camera.viewDir.at(0);
    camera.dir.dir_y = camera.viewDir.at(1);
    camera.dir.dir_z = camera.viewDir.at(2);


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
    fill_MVP_UBO_quad(state, device);

    // !!! 注意这里必须手动触发才行更新GUI
    gui.updateDisplay();
}




function init_sub_Camera(state) {

    // 创建 GUI
    const gui = new dat.GUI();
    state.GUI["sub"] = gui;

    let camera = state.camera.sub_camera;


    const fov = (2 * Math.PI) / 4;//90°
    const aspect = state.sub_canvas.canvas.width / state.sub_canvas.canvas.height;
    const z_far = 1000.0;
    const z_near = 0.5;
    let projection = mat4.perspective(fov, aspect, z_near, z_far);


    const lookFrom = vec3.fromValues(0, 30, -20);
    const lookAt = vec3.fromValues(0.0, 0.0, 0.0);
    const viewDir = vec3.normalize(vec3.sub(lookAt, lookFrom));
    const up = vec3.fromValues(0, 1, 0);
    let view = mat4.lookAt(lookFrom, lookAt, up);


    /**
     *  注意变换顺序不能更改，依次为：缩放-旋转-平移
     *  （前两者由于是线性变换所以可以更改顺序？）
     *  另外，在相机实例中，不应该出现对于model的变换，view+project属于相机
     * model属于空间中物体
     * */
    // const model = mat4.identity();


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
    state.sub_canvas.mouse_info["dragging"] = false;     // 当前鼠标是否正在拖动的标志
    state.sub_canvas.mouse_info["firstMouse"] = false;   // 是否首次点击鼠标
    state.sub_canvas.mouse_info["lastX"] = 0;
    state.sub_canvas.mouse_info["lastY"] = 0;

    // 解算得到的相机方位角
    camera["yaw"] = 1.56;
    camera["pitch"] = -0.5;

    // 如果没有滚转角更新，则可以不考虑相机up方向的更新，也不会影响解算right方向
    // camera["roll"] = 0.0; // 不需要 roll

    // 相机移动敏感度
    state.sub_canvas.mouse_info["drag_speed"] = 0.005;
    state.sub_canvas.mouse_info["wheel_speed"] = 0.005;
    state.sub_canvas.keyboard_info["speed"] = 0.75;

    /**
     *  GUI para 
     * */
    const range = 50;
    gui.add(state.camera.sub_camera, 'pitch', -1 * Math.PI, 1 * Math.PI, 0.01);
    gui.add(state.camera.sub_camera, 'yaw', -1 * Math.PI, 1 * Math.PI, 0.01);
    gui.add(state.camera.sub_camera.pos, "x", -range, range, 0.01);
    gui.add(state.camera.sub_camera.pos, "y", -range, range, 0.01);
    gui.add(state.camera.sub_camera.pos, "z", -range, range, 0.01);

}


/**
 *  更新相机参数
 *  根据相机的基本参数，更新相机矩阵
 * */
function update_sub_Camera(state, device) {
    let camera = state.camera.sub_camera;
    let gui = state.GUI["sub"];

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

    fill_MVP_UBO_sub(state, device);



    // !!! 注意这里必须手动触发才行更新GUI
    gui.updateDisplay();
}

export {
    init_prim_Camera,
    update_prim_Camera,
    init_sub_Camera,
    update_sub_Camera,
}
