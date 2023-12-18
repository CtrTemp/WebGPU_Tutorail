
import { mat4, vec3, vec4 } from "wgpu-matrix"
import {
    updateSubCamera,
    defocusCamera,
    focusCamera,
    focusOnRandomPic,
} from "./xx_set_camera";

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
    state.sub_canvas.prim_camera["yaw"] += xoffset;
    state.sub_canvas.prim_camera["pitch"] -= yoffset;

    if (state.sub_canvas.prim_camera["pitch"] > Math.PI * 0.99) {
        state.sub_canvas.prim_camera["pitch"] = Math.PI * 0.99
    }
    if (state.sub_canvas.prim_camera["pitch"] < -Math.PI * 0.99) {
        state.sub_canvas.prim_camera["pitch"] = -Math.PI * 0.99
    }

    let new_view_dir = vec3.fromValues(
        Math.cos(state.sub_canvas.prim_camera["yaw"]) * Math.cos(state.sub_canvas.prim_camera["pitch"]),
        Math.sin(state.sub_canvas.prim_camera["pitch"]),
        Math.sin(state.sub_canvas.prim_camera["yaw"]) * Math.cos(state.sub_canvas.prim_camera["pitch"])
    );

    state.sub_canvas.prim_camera["viewDir"] = new_view_dir;

    // console.log("camera = ", state.sub_canvas.prim_camera["viewDir"]);

    updateSubCamera(state, device, gui);
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
    let camera = state.sub_canvas.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["viewDir"],
        -state.sub_canvas.mouse_info["wheel_speed"] * deltaY
    );

    updateSubCamera(state, device, gui);
}

/**
 *  Mouse
 * */
function canvasMouseInteraction(state, device, gui) {

    let canvas = state.sub_canvas.canvas;
    let camera = state.sub_canvas.prim_camera;

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





export { canvasMouseInteraction }
