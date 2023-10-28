<!-- 说明：TS 是 JS 的超集，JS代码基本可以不做修改直接移植到TS中 -->
<template>
    <canvas width="512" height="512"></canvas>
</template>

<script setup lang="ts">

import { onMounted } from 'vue';
import {vertex_shader, fragment_shader } from '../assets/Shaders/Demo_01/shader'
import {
    cubeVertexSize, 
    cubePositionOffset, 
    cubeColorOffset, 
    cubeUVOffset, 
    cubeVertexCount, 
    cubeVertexArray} from "../assets/Shaders/Demo_01/cube_info"

import {mat4, vec3} from "wgpu-matrix"

// 查看当前浏览器是否支持 WebGPU
if(!navigator.gpu){
    throw new Error("WebGPU not supported on this browser");
}
else{
    console.log("Well done~ your browser can fully support WebGPU");
}

// 当前浏览器是否找到合适的适配器
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error("No appropriate GPUAdapter found.");
}

// 选中 GPU 设备
const device = await adapter.requestDevice();




  // Fetch the image and upload it into a GPUTexture.
  let cubeTexture;
  {
    const response = await fetch(
      new URL('../assets/img/eye.jpeg', import.meta.url).toString()
    );
    const imageBitmap = await createImageBitmap(await response.blob());

    cubeTexture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: cubeTexture },
      [imageBitmap.width, imageBitmap.height]
    );
  }

  // Create a sampler with linear filtering for smooth interpolation.
  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });


// onMounted
const mount_func = onMounted(()=>{
    const canvas = document.querySelector("canvas");

    const context = canvas.getContext("webgpu");
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    
    context.configure({
        device: device,
        format: canvasFormat,
        alphaMode: 'premultiplied', // 未知
    });

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    // Create a vertex buffer from the cube data.
    const verticesBuffer = device.createBuffer({
        size: cubeVertexArray.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    });
    new Float32Array(verticesBuffer.getMappedRange()).set(cubeVertexArray);
    verticesBuffer.unmap();

    
    

    // 创建渲染流水线
    const cellPipeline = device.createRenderPipeline({
        label: "Cell pipeline",
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code:vertex_shader
            }),
            entryPoint: "main",
            buffers: [
                {
                    arrayStride: cubeVertexSize,
                    attributes: [
                        {
                            // position
                            shaderLocation: 0,
                            offset: cubePositionOffset,
                            format: 'float32x4',
                        },
                        {
                            // uv
                            shaderLocation: 1,
                            offset: cubeUVOffset,
                            format: 'float32x2',
                        },
                    ],
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({
                code:fragment_shader
            }),
            entryPoint: "main",
            targets: [{
                format: canvasFormat
            }]
        },
        primitive: { // 指定面元类型，这里默认是三角形，所以不加也可
            topology: 'triangle-list',
            // Backface culling since the cube is solid piece of geometry.
            // Faces pointing away from the camera will be occluded by faces
            // pointing toward the camera.
            cullMode: 'back',
        },
        // Enable depth testing so that the fragment closest to the camera
        // is rendered in front.
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    });



    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const xCount = 4;
    const yCount = 4;
    const numInstances = xCount * yCount;
    const matrixFloatCount = 16; // 4x4 matrix
    const matrixSize = 4 * matrixFloatCount;
    const uniformBufferSize = numInstances * matrixSize;

    // Allocate a buffer large enough to hold transforms for every
    // instance.
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // const uniformBindGroup = device.createBindGroup({
    //     layout: pipeline.getBindGroupLayout(0),
    //     entries: [
    //     {
    //         binding: 0,
    //         resource: {
    //             buffer: uniformBuffer,
    //         },
    //     },
    //     ],
    // });

    const uniformBindGroup = device.createBindGroup({
        layout: cellPipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            },
            {
                binding: 1,
                resource: sampler,
            },
            {
                binding: 2,
                resource: cubeTexture.createView(),
            },
        ],
    });

    // const uniformBindGroup = device.createBindGroup({
    //     layout: cellPipeline.getBindGroupLayout(0),
    //     entries: [
    //     {
    //         binding: 0,
    //         resource: {
    //         buffer: uniformBuffer,
    //         },
    //     },
    //     ],
    // });

    
    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.perspective(
        (2 * Math.PI) / 5,
        aspect,
        1,
        100.0
    );


    // type myMat4 = mat4.default;
    // console.log("type Mat4 = ", myMat4);
    // 注意 TS 代码转换成 JS 代码一并去掉强数据类型的定义
    // const modelMatrices = new Array<Mat4>(numInstances);
    const modelMatrices = new Array(numInstances);
    const mvpMatricesData = new Float32Array(matrixFloatCount * numInstances);


    const step = 4.0;

    // Initialize the matrix data for every instance.
    let m = 0;
    for (let x = 0; x < xCount; x++) {
        for (let y = 0; y < yCount; y++) {
            modelMatrices[m] = mat4.translation(
                vec3.fromValues(
                    step * (x - xCount / 2 + 0.5),
                    step * (y - yCount / 2 + 0.5),
                    0
                )
            );
            m++;
        }
    }


    const viewMatrix = mat4.translation(vec3.fromValues(0, 0, -12));

    const tmpMat4 = mat4.create();



    // Update the transformation matrix data for each instance.
    function updateTransformationMatrix() {
        const now = Date.now() / 1000;

        let m = 0,
        i = 0;
        for (let x = 0; x < xCount; x++) {
            for (let y = 0; y < yCount; y++) {
                mat4.rotate(
                modelMatrices[i],
                    vec3.fromValues(
                        Math.sin((x + 0.5) * now),
                        Math.cos((y + 0.5) * now),
                        0
                    ),
                1,
                tmpMat4
                );

                mat4.multiply(viewMatrix, tmpMat4, tmpMat4);
                mat4.multiply(projectionMatrix, tmpMat4, tmpMat4);

                mvpMatricesData.set(tmpMat4, m);

                i++;
                m += matrixFloatCount;
            }
        }
    }

    const renderPassDescriptor = {
        colorAttachments: [
        {
            view: undefined, // Assigned later

            clearValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            loadOp: 'clear',
            storeOp: 'store',
        },
        ],
        depthStencilAttachment: {
            view: depthTexture.createView(),

            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    function renderFrame()
    {

        // Update the matrix data.
        updateTransformationMatrix();
        device.queue.writeBuffer(
            uniformBuffer,
            0,
            mvpMatricesData.buffer,
            mvpMatricesData.byteOffset,
            mvpMatricesData.byteLength
        );
        renderPassDescriptor.colorAttachments[0].view = context
        .getCurrentTexture()
        .createView();


        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass(renderPassDescriptor);

        pass.setPipeline(cellPipeline);
        
        pass.setBindGroup(0, uniformBindGroup);
        pass.setVertexBuffer(0, verticesBuffer);
        pass.draw(cubeVertexCount, numInstances, 0, 0);
        
        pass.end();

        device.queue.submit([encoder.finish()]);
    }

    
    setInterval(() => {
        renderFrame();
    }, 25);
})



</script>

<style>

</style>
