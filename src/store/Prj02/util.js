const fs = require("fs")
// import fs from "fs"

async function read_files_from_dir() {

    // const files = require.context("../../assets/img/img_instance", false, /\.png$/).keys();

    // console.log("files.len = ", files.length);
    // for (let i = 0; i < files.length; i++) {
    //     const root_dir = "../../assets/img/img_instance";
    //     const file_path = root_dir + files[i].substr(1);

    //     // 为何不允许导入本地路径》！？？
    //     // 使用字符串直接输入可以，但不允许动态使用字符串？？？
    //     console.log("file path = ", file_path);
    //     let path = '@/assets/img/webgpu.png';
    //     // CPU 端读入图片，并创建bitmap
    //     // const response = await fetch(
    //     //     new URL(file_path, import.meta.url)
    //     //     // new URL('../../assets/img/eye.jpeg', import.meta.url).toString()
    //     // );

    //     // let url = require("@/assets/img/webgpu.png");
    //     // let url = require(path);


    //     // console.log("url = ", url);
    //     // fetch(new URL(file_path, import.meta.url)).then(response=>{
    //     //     console.log(response);
    //     // })
    //     // const imageBitmap = await createImageBitmap(await response.blob());

    // }

}


function dataURL2Blob(dataUrl) {
    const bsArr = dataUrl.split(',')
    const pattern = /^data:(.*?)(;base64)/
    const type = bsArr[0].match(pattern)[1]
    const dataStr = atob(bsArr[1])
    const len = dataStr.length
    const uint8Array = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        uint8Array[i] = dataStr.charCodeAt(i)
    }

    return new Blob([uint8Array], { type })
}


export { read_files_from_dir, dataURL2Blob }