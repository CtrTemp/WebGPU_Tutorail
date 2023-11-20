

import { mat4, vec3, vec4 } from "wgpu-matrix"

// GUI
import * as dat from "dat.gui"


import { manage_VBO, manage_VBO_Layout } from "./01_manage_VBO"
import { manage_UBO } from "./02_manage_UBO"
import { manage_Texture } from "./04_manage_Texture";
import { set_Layout } from "./11_set_Layout";
import { set_BindGroup } from "./12_set_BindGroup";
import { set_Pipeline } from "./13_set_Pipeline";
import { init_Camera } from "./xx_set_camera.js"

import {
    gen_straight_line_arr,
    gen_axis_line_arr,
    gen_sin_func_arr,
    read_data_and_gen_line,
    gen_plane_instance
} from './gen_curve_line';
import { canvasMouseInteraction, canvasKeyboardInteraction } from "./xx_interaction";

// import { getCameraViewProjMatrix, updateCanvas } from './utils.js';




export default {
    namespaced: true,
    /**
     *  本工程使用Vue框架，借助WebGPU重构工程，实现前向渲染管线 
     */
    actions: {

        // 整体框架，内为异步函数，用于简单操控数据异步读取，阻塞式等待。
        async init_and_render(context, canvas) {
            const device = context.rootState.device;

            const flow_info = gen_plane_instance(10, 10, 3.0);

            // 创建 GUI
            const gui = new dat.GUI();

            const payload = {
                canvas: canvas,
                device: device,
                flow_info: flow_info,
                gui: gui
            }

            context.commit("init_device", payload);


            // CPU 端读入图片，并创建bitmap
            const response = await fetch(
                new URL('../../assets/img/webgpu.png', import.meta.url).toString()
                // new URL('../../assets/img/eye.jpeg', import.meta.url).toString()
            );
            const imageBitmap = await createImageBitmap(await response.blob());
            let cubeTexture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                format: 'rgba8unorm', // 格式
                usage:
                    GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT,
            });
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap }, // src
                { texture: cubeTexture }, // dst
                [imageBitmap.width, imageBitmap.height] // size
            );
            payload["img"] = imageBitmap;

            context.commit("manage_data", payload);

            context.commit("manage_pipeline", device);

            context.commit("renderLoop", payload);
        },




    },
    mutations: {

        /**
         *   Stage01：device 相关初始化，选中设备，为device、canvas相关的上下文全局变量赋值
         */
        init_device(state, { canvas, device }) {
            state.canvas = canvas;
            state.GPU_context = canvas.getContext("webgpu");
            state.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

            state.GPU_context.configure({
                device: device,
                format: state.canvasFormat,
            });
        },


        /**
         *  Stage02：内存、数据相关的初始化。主要是纹理、顶点数据引入；device上开辟对应buffer
         * 并借助API将CPU读入的数据导入device 
         */
        manage_data(state, payload) {

            /**
             *  VBO
             * */
            manage_VBO(state, payload);

            /**
             *  UBO
             * */
            manage_UBO(state, payload);

            /**
             *  Texture
             * */
            manage_Texture(state, payload);

            /**
             *  VBO Layout
             * */
            manage_VBO_Layout(state, payload);

        },

        /**
         *  Stage03：对渲染的 pipeline 进行定制，一般来说，在渲染过程中不再会对管线进行更改
         * */
        manage_pipeline(state, device) {

            /**
             *  UBO Layout
             * */
            set_Layout(state, device);

            /**
             *  BindGroups
             * */
            set_BindGroup(state, device);

            /**
             *  Pipelines
             * */
            set_Pipeline(state, device);

        },

        /**
         *  Stage04：启动渲染循环
         * */
        renderLoop(state, payload) {

            const device = payload.device;




            device.queue.writeBuffer(
                state.UBOs["compute"],
                0,
                new Float32Array([
                    1.0,
                    0.0,
                    0.0,
                    0.0,// padding
                    Math.random() * 100,
                    Math.random() * 100, // seed.xy
                    1 + Math.random(),
                    1 + Math.random(), // seed.zw
                    state.particle_info["lifetime"],
                    0.0,
                    0.0,
                    0.0
                ])
            );







            /**
             *  初始化设置相机参数
             * */
            init_Camera(state, device);

            const view = state.prim_camera["view"];
            const projection = state.prim_camera["projection"];
            const viewProjectionMatrix = state.prim_camera["matrix"];
            // GPU 端更新相机参数
            device.queue.writeBuffer(
                state.UBOs["mvp"],
                0,
                viewProjectionMatrix.buffer,
                viewProjectionMatrix.byteOffset,
                viewProjectionMatrix.byteLength
            );

            device.queue.writeBuffer(
                state.UBOs["right"],
                0,
                new Float32Array([
                    view[0], view[4], view[8], // right
                ])
            );
            device.queue.writeBuffer(
                state.UBOs["up"],
                0,
                new Float32Array([
                    view[1], view[5], view[9], // up
                ])
            );


            
            const gui = payload.gui;
            const camera_pos = {
                x: 0.0,
                y: 0.0,
                z: -5.0
            }
            gui.add(camera_pos, 'x', -10.0, 10.0);
            gui.add(camera_pos, 'y', -10.0, 10.0);
            gui.add(camera_pos, 'z', -10.0, 10.0);

            /**
             *  Canvas 键鼠交互事件注册
             * 
             * */

            // canvas 注册鼠标交互事件
            canvasMouseInteraction(state, device);

            // canvas 注册键盘交互事件
            canvasKeyboardInteraction(state, device);


            setInterval(() => {

                const renderPassDescriptor = state.passDescriptors["render_particles"];

                renderPassDescriptor.colorAttachments[0].view = state.GPU_context
                    .getCurrentTexture()
                    .createView();

                const encoder = device.createCommandEncoder();

                /**
                 *  Simulation Pass
                 * */
                {
                    const pass = encoder.beginComputePass();
                    pass.setPipeline(state.Pipelines["simu_particles"]);
                    pass.setBindGroup(0, state.BindGroups["compute"]);
                    pass.dispatchWorkgroups(Math.ceil(state.particle_info["numParticles"] / 64));
                    pass.end();
                }


                /**
                 *  Render Pass
                 * */
                {
                    const pass = encoder.beginRenderPass(renderPassDescriptor);
                    pass.setPipeline(state.Pipelines["render_particles"]);
                    pass.setBindGroup(0, state.BindGroups["mvp_pack"]);
                    pass.setBindGroup(1, state.BindGroups["sample"]);
                    pass.setVertexBuffer(0, state.VBOs["particles"]);
                    pass.setVertexBuffer(1, state.VBOs["quad"]);
                    pass.draw(6, state.particle_info["numParticles"], 0, 0); // 四边形里面我只画一个三角形

                    pass.end();
                }

                device.queue.submit([encoder.finish()]);
            }, 25);
        }
    },
    state() {
        return {
            // 我們假定目前只有一個 canvas
            canvas: null,
            canvasFormat: null,
            // 指向當前GPU上下文，所以只需要一個 
            GPU_context: null,
            // 渲染管線可以有多條，我們使用一個對象來定義
            Pipelines: {},
            Pipeline_Layouts: {},
            // 各类纹理
            Textures: {},
            // VBO、UBO這些都可能有多個，所以同樣使用對象來定義
            VBOs: {},
            VBO_Layouts: {},
            IBOs: {},
            UBOs: {},
            Layouts: {},
            BindGroups: {},
            SBOs: {}, // Storage Buffer Object
            vertices_arr: {},
            indices_arr: {},  // 暂时不需要
            passDescriptors: {},
            simulationParams: {}, // 仿真运行参数

            particle_info: {},
            additional_info: {},
            prim_camera: {},
            mouse_info: {},
            keyboard_info: {},
        }
    },
    getters: {}
}
