
import { mat4, vec3 } from "wgpu-matrix"


function getCameraViewProjMatrix(state, viewProjMatrix) {

    // 宽高比
    const aspect = state.canvas.width / state.canvas.height;

    // // Scene matrices
    // const eyePosition = vec3.fromValues(0, 50, -100);
    const upVector = vec3.fromValues(0, 1, 0);
    const origin = vec3.fromValues(0, 0, 0);

    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        2000.0
    );
    // const viewMatrix = mat4.inverse(mat4.lookAt(eyePosition, origin, upVector));

    // const viewProjMatrix = mat4.multiply(projectionMatrix, viewMatrix);

    const eyePosition = vec3.fromValues(0, 50, -100);

    const rad = Math.PI * (Date.now() / 5000);
    const rotation = mat4.rotateY(mat4.translation(origin), rad);
    vec3.transformMat4(eyePosition, rotation, eyePosition);
    const rotatedEyePosition = vec3.transformMat4(eyePosition, rotation);

    const viewMatrix = mat4.lookAt(rotatedEyePosition, origin, upVector);

    mat4.multiply(projectionMatrix, viewMatrix, viewProjMatrix);

    return viewProjMatrix;
}


// // Rotates the camera around the origin based on time.
// function getCameraViewProjMatrix(state, viewProjMatrix) {
//     const eyePosition = vec3.fromValues(0, 50, -100);

//     const rad = Math.PI * (Date.now() / 2000);
//     const rotation = mat4.rotateY(mat4.translation(origin), rad);
//     vec3.transformMat4(eyePosition, rotation, eyePosition);

//     const viewMatrix = mat4.lookAt(eyePosition, origin, upVector);

//     mat4.multiply(projectionMatrix, viewMatrix, viewProjMatrix);
//     return viewProjMatrix;
// }



export { getCameraViewProjMatrix }
