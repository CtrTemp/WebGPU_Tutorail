
import { mat4, vec3, vec4 } from "wgpu-matrix"
import { updateCamera, defocusCamera, focusCamera } from "./xx_set_camera";

/**
 *  Dragging
 * */
function mouseMovingCallback(state, device, event, gui) {
    if (!state.mouse_info["dragging"]) {
        // console.log("invalid mouse moving~ ");
        return;
    }

    if (state.mouse_info["firstMouse"]) {
        state.mouse_info["firstMouse"] = false;
    }


    let xoffset = event.movementX;
    let yoffset = event.movementY;

    xoffset *= state.mouse_info["drag_speed"];
    yoffset *= state.mouse_info["drag_speed"];

    // 这里的改变没有触发GUI的更新
    state.prim_camera["yaw"] += xoffset;
    state.prim_camera["pitch"] -= yoffset;

    if (state.prim_camera["pitch"] > Math.PI * 0.99) {
        state.prim_camera["pitch"] = Math.PI * 0.99
    }
    if (state.prim_camera["pitch"] < -Math.PI * 0.99) {
        state.prim_camera["pitch"] = -Math.PI * 0.99
    }

    let new_view_dir = vec3.fromValues(
        Math.cos(state.prim_camera["yaw"]) * Math.cos(state.prim_camera["pitch"]),
        Math.sin(state.prim_camera["pitch"]),
        Math.sin(state.prim_camera["yaw"]) * Math.cos(state.prim_camera["pitch"])
    );

    state.prim_camera["viewDir"] = new_view_dir;

    // console.log("camera = ", state.prim_camera["viewDir"]);

    updateCamera(state, device, gui);
}

/**
 *  Click
 * */
function mouseClickCallback(state, flag) {
    if (flag == "down") {
        state.mouse_info["dragging"] = true;
        state.mouse_info["firstMouse"] = true;
    }
    else if (flag == "up") {
        state.mouse_info["dragging"] = false;
    }
}

/**
 *  Wheel
 * */
function mouseWheelCallback(state, device, deltaY, gui) {
    let camera = state.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["viewDir"],
        -state.mouse_info["wheel_speed"] * deltaY
    );

    updateCamera(state, device, gui);
}

/**
 *  Mouse
 * */
function canvasMouseInteraction(state, device, gui) {

    let canvas = state.canvas;
    let camera = state.prim_camera;

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



/**
 *  Key Down
 * */
function leftMovingCallback(state, device, gui) {
    let camera = state.prim_camera;
    const leftDir = vec3.normalize(vec3.cross(camera["up"], camera["viewDir"]));

    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        leftDir,
        state.keyboard_info["speed"]
    );

    updateCamera(state, device, gui);
}

function rightMovingCallback(state, device, gui) {
    let camera = state.prim_camera;
    const rightDir = vec3.normalize(vec3.cross(camera["viewDir"], camera["up"]));

    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        rightDir,
        state.keyboard_info["speed"]
    );

    updateCamera(state, device, gui);
}

function frontMovingCallback(state, device, gui) {
    let camera = state.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["viewDir"],
        state.keyboard_info["speed"]
    );

    updateCamera(state, device, gui);
}

function backMovingCallback(state, device, gui) {
    let camera = state.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["viewDir"],
        -state.keyboard_info["speed"]
    );

    updateCamera(state, device, gui);
}

function upMovingCallback(state, device, gui) {
    let camera = state.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["up"],
        state.keyboard_info["speed"]
    );

    updateCamera(state, device, gui);
}

function downMovingCallback(state, device, gui) {
    let camera = state.prim_camera;
    camera["lookFrom"] = vec3.addScaled(
        camera["lookFrom"],
        camera["up"],
        -state.keyboard_info["speed"]
    );

    updateCamera(state, device, gui);
}

/**
 *  Keyboard
 * */
function canvasKeyboardInteraction(state, device, gui) {

    let camera = state.prim_camera;

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
            // defocus
            case "K".charCodeAt(0):
                defocusCamera(state, device, gui);
                break;
            case "F".charCodeAt(0):
                focusCamera(state, device, gui);
                break;

            default:
                break;
        }

    })
}











export { canvasMouseInteraction, canvasKeyboardInteraction }
