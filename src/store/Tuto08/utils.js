
import { mat4, vec3 } from "wgpu-matrix"

function getTransformationMatrix(context) {

    // 宽高比
    const aspect = context.state.canvas.width / context.state.canvas.height;
    // 投影矩阵P，采用透视投影
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0
    );

    const modelViewProjectionMatrix = mat4.create();
    const viewMatrix = mat4.identity();
    mat4.translate(viewMatrix, vec3.fromValues(0, 0, -4), viewMatrix);
    const now = Date.now() / 1000;
    mat4.rotate(
        viewMatrix,
        vec3.fromValues(Math.sin(now), Math.cos(now), 0),
        1,
        viewMatrix
    );

    mat4.multiply(projectionMatrix, viewMatrix, modelViewProjectionMatrix);

    return modelViewProjectionMatrix;
}


export { getTransformationMatrix }
