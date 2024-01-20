
import { mat4, vec3, vec4 } from "wgpu-matrix"

import { init_prim_Camera, update_sub_Camera, update_prim_Camera } from "../utils/set_camera";

import { update_and_fill_Trace_Ray_UBO } from "../main_view/03_manage_UBO";


import { update_mip_data_SBO } from "../main_view/04_manage_SBO";


/**
 *  通过欧拉角的偏移，去反向计算方向向量并更新
 * */
function pitch_yaw_updater_prim_cam(state) {
    if (state.camera.prim_camera["pitch"] > Math.PI * 0.99) {
        state.camera.prim_camera["pitch"] = Math.PI * 0.99
    }
    if (state.camera.prim_camera["pitch"] < -Math.PI * 0.99) {
        state.camera.prim_camera["pitch"] = -Math.PI * 0.99
    }

    let new_view_dir = vec3.fromValues(
        Math.cos(state.camera.prim_camera["yaw"]) * Math.cos(state.camera.prim_camera["pitch"]),
        Math.sin(state.camera.prim_camera["pitch"]),
        Math.sin(state.camera.prim_camera["yaw"]) * Math.cos(state.camera.prim_camera["pitch"])
    );

    state.camera.prim_camera["viewDir"] = new_view_dir;


    /**
     *  这里应该进一步更新up方向才对！
     * */
    // 首先得到 right 方向
    const new_right_dir = vec3.normalize(vec3.cross(new_view_dir, vec3.fromValues(0.0, 1.0, 0.0)));
    const new_up_dir = vec3.normalize(vec3.cross(new_right_dir, new_view_dir));

    state.camera.prim_camera["up"] = new_up_dir;
}

/**
 *  Dragging
 * */
function mouseMovingCallback(state, device, event) {
    if (!state.main_canvas.mouse_info["dragging"]) {
        // console.log("invalid mouse moving~ ");
        return;
    }

    if (state.main_canvas.mouse_info["firstMouse"]) {
        state.main_canvas.mouse_info["firstMouse"] = false;
    }


    let xoffset = event.movementX;
    let yoffset = event.movementY;

    xoffset *= state.main_canvas.mouse_info["drag_speed"];
    yoffset *= state.main_canvas.mouse_info["drag_speed"];

    // 这里的改变没有触发GUI的更新
    state.camera.prim_camera["yaw"] += xoffset;
    state.camera.prim_camera["pitch"] -= yoffset;

    pitch_yaw_updater_prim_cam(state);

    update_prim_Camera(state, device);
}

/**
 *  Click
 * */
function mouseClickCallback(state, flag) {
    if (flag == "down") {
        state.main_canvas.mouse_info["dragging"] = true;
        state.main_canvas.mouse_info["firstMouse"] = true;
    }
    else if (flag == "up") {
        state.main_canvas.mouse_info["dragging"] = false;
    }
}

/**
 *  Wheel
 * */
function mouseWheelCallback(state, device, deltaY) {
    let camera = state.camera.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["up"],
        -state.main_canvas.mouse_info["wheel_speed"] * deltaY
    );

    update_prim_Camera(state, device);
}

/**
 *  Mouse
 * */
function canvasMouseInteraction_quad(state, device) {

    let canvas = state.main_canvas.canvas;
    // let camera = state.camera.prim_camera;
    const gui = state.GUI["prim"];

    /**
     *  更新 trace ray UBO
     * */

    canvas.addEventListener("mousemove", (event) => {

        update_and_fill_Trace_Ray_UBO(state, device, event);

        // /**
        //  *  这里我们用串行算法使用CPU计算，验证一下
        //  * */
        // update_mip_data_SBO(state, device, event);
    })

    /**
     *  我们暂时屏蔽掉 Drag 交互
     * */

    // canvas.addEventListener("mousemove", (event) => {
    //     // 这里的一个优点在于可以直接获取鼠标的移动距离信息
    //     // console.log("event = ", event.movementX);
    //     mouseMovingCallback(state, device, event);
    // })



    // canvas.addEventListener("mousedown", (event) => {
    //     mouseClickCallback(state, "down");
    // })
    // canvas.addEventListener("mouseup", (event) => {
    //     mouseClickCallback(state, "up");
    // })

    canvas.addEventListener("mousewheel", (event) => {
        mouseWheelCallback(state, device, event.deltaY);
    })

}



/**
 *  Key Down
 * */
function leftMovingCallback(state, device) {

    const gui = state.GUI["prim"];

    if (state.main_canvas.keyboard_info.active == true) {
        let camera = state.camera.prim_camera;
        const leftDir = vec3.normalize(vec3.cross(camera["up"], camera["viewDir"]));
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            leftDir,
            state.main_canvas.keyboard_info["speed"]
        );
        update_prim_Camera(state, device);
    }
    else {
        let camera = state.camera.sub_camera;
        const leftDir = vec3.normalize(vec3.cross(camera["up"], camera["viewDir"]));
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            leftDir,
            state.sub_canvas.keyboard_info["speed"]
        );
        update_sub_Camera(state, device, gui);
    }

}

function rightMovingCallback(state, device, gui) {
    if (state.main_canvas.keyboard_info.active == true) {
        let camera = state.camera.prim_camera;
        const leftDir = vec3.normalize(vec3.cross(camera["viewDir"], camera["up"]));
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            leftDir,
            state.main_canvas.keyboard_info["speed"]
        );
        update_prim_Camera(state, device);
    }
    else {
        let camera = state.camera.sub_camera;
        const leftDir = vec3.normalize(vec3.cross(camera["viewDir"], camera["up"]));
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            leftDir,
            state.sub_canvas.keyboard_info["speed"]
        );
        update_sub_Camera(state, device, gui);
    }
}

function frontMovingCallback(state, device, gui) {
    if (state.main_canvas.keyboard_info.active == true) {
        let camera = state.camera.prim_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["viewDir"],
            state.main_canvas.keyboard_info["speed"]
        );
        update_prim_Camera(state, device);
    }
    else {
        let camera = state.camera.sub_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["viewDir"],
            state.sub_canvas.keyboard_info["speed"]
        );
        update_sub_Camera(state, device, gui);
    }

}

function backMovingCallback(state, device, gui) {
    if (state.main_canvas.keyboard_info.active == true) {
        let camera = state.camera.prim_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["viewDir"],
            -state.main_canvas.keyboard_info["speed"]
        );
        update_prim_Camera(state, device);
    }
    else {
        let camera = state.camera.sub_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["viewDir"],
            -state.sub_canvas.keyboard_info["speed"]
        );
        update_sub_Camera(state, device, gui);
    }

}

function upMovingCallback(state, device, gui) {
    if (state.main_canvas.keyboard_info.active == true) {
        let camera = state.camera.prim_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["up"],
            state.main_canvas.keyboard_info["speed"]
        );
        update_prim_Camera(state, device);
    }
    else {
        let camera = state.camera.sub_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["up"],
            state.sub_canvas.keyboard_info["speed"]
        );
        update_sub_Camera(state, device, gui);
    }

}

function downMovingCallback(state, device, gui) {
    if (state.main_canvas.keyboard_info.active == true) {
        let camera = state.camera.prim_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["up"],
            -state.main_canvas.keyboard_info["speed"]
        );
        update_prim_Camera(state, device);
    }
    else {
        let camera = state.camera.sub_camera;
        camera["lookFrom"] = vec3.addScaled(
            camera["lookFrom"],
            camera["up"],
            -state.sub_canvas.keyboard_info["speed"]
        );
        update_sub_Camera(state, device, gui);
    }

}

function pauseAnimation(state) {
    if (state.main_canvas.simu_info.simu_pause == 1.0) {
        state.main_canvas.simu_info.simu_pause = 0.0;
    }
    else {
        state.main_canvas.simu_info.simu_pause = 1.0;
    }
}


function toLayout1(state) {
    state.main_canvas.simu_info.cur_layout = 1.0;
}


function toLayout2(state) {
    state.main_canvas.simu_info.cur_layout = 2.0;
}


function toLayout3(state) {
    state.main_canvas.simu_info.cur_layout = 3.0;
}

function exchangeKeyboardActive(state) {
    if (state.main_canvas.keyboard_info.active == true) {
        state.main_canvas.keyboard_info.active = false;
        state.sub_canvas.keyboard_info.active = true;
    }
    else {
        state.main_canvas.keyboard_info.active = true;
        state.sub_canvas.keyboard_info.active = false;
    }
}

/**
 *  Keyboard
 * */
function canvasKeyboardInteraction_quad(state, device, gui) {

    let camera = state.camera.prim_camera;

    /**
     *  初始化状态下，将键盘交互绑定在主视图上
     * */
    state.main_canvas.keyboard_info.active = true;
    state.sub_canvas.keyboard_info.active = false;


    window.addEventListener("keydown", (event) => {

        switch (event.keyCode) {
            case "A".charCodeAt(0):
                leftMovingCallback(state, device, gui);
                break;
            case "D".charCodeAt(0):
                rightMovingCallback(state, device, gui);
                break;
            case "W".charCodeAt(0):
                frontMovingCallback(state, device, gui);
                break;
            case "S".charCodeAt(0):
                backMovingCallback(state, device, gui);
                break;
            case "Q".charCodeAt(0):
                downMovingCallback(state, device, gui);
                break;
            case "E".charCodeAt(0):
                upMovingCallback(state, device, gui);
                break;
            // // defocus
            // case "K".charCodeAt(0):
            //     defocusCamera(state, device, gui);
            //     break;
            // // focus
            // case "F".charCodeAt(0):
            //     // focusCamera(state, device, gui);
            //     focusOnRandomPic(state, device, gui, flow_info);
            //     break;
            // // pause
            case "P".charCodeAt(0):
                pauseAnimation(state);
                break;
            case "L".charCodeAt(0): // 相机复位
                init_prim_Camera(state);
                break;

            case "Z".charCodeAt(0): // 切换布局 --> layout1
                console.log(state.main_canvas.simu_info.cur_layout)
                toLayout1(state); 
                break;
            case "X".charCodeAt(0): // 切换布局 --> layout2 
                toLayout2(state); 
                break;
            case "C".charCodeAt(0): // 切换布局 --> layout3 
                toLayout3(state); 
                break;

            case "B".charCodeAt(0):
                exchangeKeyboardActive(state)
                break;

            default:
                break;
        }

    })
}











export {
    canvasMouseInteraction_quad,
    canvasKeyboardInteraction_quad,
    pitch_yaw_updater_prim_cam,
}
