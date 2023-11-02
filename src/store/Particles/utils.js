
import { mat4, vec3 } from "wgpu-matrix"


function getCameraViewProjMatrix(context) {
    
    // 宽高比
    const aspect = context.state.canvas.width / context.state.canvas.height;

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



function updateCanvas(context)
{
    const device = context.rootState.device;
    // 用于全屏模式
    const window_width = window.innerWidth;
    const window_height = window.innerHeight;

    context.state.canvas.width = window_width;
    context.state.canvas.height = window_height;

    // depth texture 重建
    context.state.Textures["depth"].destroy();
    context.state.Textures["depth"] = device.createTexture({
        size:[window_width, window_height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })

    // render pass 描述符 重构
    context.state.passDescriptors["stanford_dragon"].depthStencilAttachment.view = context.state.Textures["depth"].createView();

    // 这里有一个问题，为什么 colorAttachment 就不需要重构？？？是进行了默认重构么？
    // 其实也没有默认重构，如下重构
    context.state.passDescriptors["stanford_dragon"].colorAttachments[0].view = context.state.GPU_context
    .getCurrentTexture()
    .createView();

}

export { getCameraViewProjMatrix, updateCanvas }
