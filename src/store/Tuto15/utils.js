
import { mat4, vec3 } from "wgpu-matrix"


function getCameraViewProjMatrix(state) {

    // 宽高比
    const aspect = state.canvas.width / state.canvas.height;

    const eyePosition = vec3.fromValues(0, 125, -100);
    const upVector = vec3.fromValues(0, 1, 0);
    const origin = vec3.fromValues(0, 0, 0);

    // MVP : P
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        2000.0
    );

    const rad = Math.PI * (Date.now() / 4000);
    const rotation = mat4.rotateY(mat4.translation(origin), rad);
    vec3.transformMat4(eyePosition, rotation, eyePosition);


    // MVP : V
    const viewMatrix = mat4.lookAt(eyePosition, origin, upVector);
    // MVP : VP
    const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    mat4.multiply(projectionMatrix, viewMatrix, viewProjMatrix);
    return viewProjMatrix;
}


export { getCameraViewProjMatrix }
