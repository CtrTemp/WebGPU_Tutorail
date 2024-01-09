
import { mat4, vec3, vec4 } from "wgpu-matrix"


import { update_sub_Camera } from "../utils/set_camera";



/**
 *  Dragging
 * */
function mouseMovingCallback(state, device, event, gui) {
    if (!state.sub_canvas.mouse_info["dragging"]) {
        // console.log("invalid mouse moving~ ");
        return;
    }

    if (state.sub_canvas.mouse_info["firstMouse"]) {
        state.sub_canvas.mouse_info["firstMouse"] = false;
    }


    let xoffset = event.movementX;
    let yoffset = event.movementY;

    xoffset *= state.sub_canvas.mouse_info["drag_speed"];
    yoffset *= state.sub_canvas.mouse_info["drag_speed"];

    // 这里的改变没有触发GUI的更新
    state.camera.sub_camera["yaw"] += xoffset;
    state.camera.sub_camera["pitch"] -= yoffset;

    if (state.camera.sub_camera["pitch"] > Math.PI * 0.99) {
        state.camera.sub_camera["pitch"] = Math.PI * 0.99
    }
    if (state.camera.sub_camera["pitch"] < -Math.PI * 0.99) {
        state.camera.sub_camera["pitch"] = -Math.PI * 0.99
    }

    let new_view_dir = vec3.fromValues(
        Math.cos(state.camera.sub_camera["yaw"]) * Math.cos(state.camera.sub_camera["pitch"]),
        Math.sin(state.camera.sub_camera["pitch"]),
        Math.sin(state.camera.sub_camera["yaw"]) * Math.cos(state.camera.sub_camera["pitch"])
    );

    state.camera.sub_camera["viewDir"] = new_view_dir;

    // console.log("camera = ", state.camera.sub_camera["viewDir"]);

    update_sub_Camera(state, device);
}

/**
 *  Click
 * */
function mouseClickCallback(state, flag) {
    if (flag == "down") {
        state.sub_canvas.mouse_info["dragging"] = true;
        state.sub_canvas.mouse_info["firstMouse"] = true;
    }
    else if (flag == "up") {
        state.sub_canvas.mouse_info["dragging"] = false;
    }
}

/**
 *  Wheel
 * */
function mouseWheelCallback(state, device, deltaY, gui) {
    let camera = state.camera.sub_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["viewDir"],
        -state.sub_canvas.mouse_info["wheel_speed"] * deltaY
    );

    update_sub_Camera(state, device);
}

/**
 *  Mouse
 * */
function subCanvasMouseInteraction(state, device) {

    let canvas = state.sub_canvas.canvas;
    let camera = state.camera.sub_camera;

    const gui = state.GUI["sub"];

    canvas.addEventListener("mousemove", (event) => {
        // 这里的一个优点在于可以直接获取鼠标的移动距离信息
        // console.log("event = ", event.movementX);
        mouseMovingCallback(state, device, event, gui);
    })


    canvas.addEventListener("mousedown", (event) => {
        mouseClickCallback(state, "down");
    })
    canvas.addEventListener("mouseup", (event) => {
        mouseClickCallback(state, "up");
    })

    canvas.addEventListener("mousewheel", (event) => {
        mouseWheelCallback(state, device, event.deltaY, gui);
    })

}





export { subCanvasMouseInteraction }
