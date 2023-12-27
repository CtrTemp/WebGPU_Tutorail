const fs = require("fs")
const Blob = require("buffer");

/**
 *  读取特定的图片文件
 * */
function read_instanced_texture() {
    let ret_promise = new Promise((resolve, reject) => {
        // 从根目录开始结算
        fs.readdir("./src/assets/img", (err, files) => {
            if (err) {
                console.log("read data err = ", err);
            }
            else {
                console.log("files = ", files);

                let url_arr = [];

                // for (let i = 0; i < files.length; i++) {
                for (let i = 0; i < 5; i++) {
                    const path = "./src/assets/img/" + files[i];
                    const file = fs.readFileSync(path);


                    url_arr.push(file.toString("base64"));
                }

                let cmd_pack = {
                    cmd: "instanced_texture_pack",
                    arr: url_arr,
                }
                resolve(cmd_pack);
            }
        });
    })

    return ret_promise;
}


/**
 *  根据所需要的图片数据，在数据集中获取特定MipLevel的图片
 * */

function recursive_read_file(idx, edge, mip_info_arr, ret_arr) {

    if (idx == edge) {
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }

    let ret_promise = new Promise((resolve, reject) => {

        recursive_read_file(idx + 1, edge, mip_info_arr, ret_arr).then(() => {

            const read_dir = `../../../data_set/mip${idx}`;
            fs.readdir(read_dir, (err, files) => {
                if (err) {
                    console.log("read data err = ", err);
                }
                else {
                    let url_arr = [];
                    // console.log("files = ", files);
                    for (let j = 0; j < mip_info_arr[idx]; j++) {

                        const path = `../../../data_set/mip${idx}/` + files[j];
                        const file = fs.readFileSync(path);

                        url_arr.push(file.toString("base64"));
                    }
                    ret_arr.push(url_arr);
                    resolve(url_arr);
                }
            });
        })
    });

    // console.log("return idx = ", idx);

    return ret_promise;
}

async function read_mip_instance(json_pack) {
    const mip_info_arr = json_pack.mip_info["arr"];
    // console.log("mip_info_arr = ", mip_info_arr);
    let ret_arr = [];

    let ret_promise = new Promise((resolve, reject) => {
        recursive_read_file(0, 13, mip_info_arr, ret_arr).then(() => {
            // console.log("ret_arr = ", ret_arr);
            ret_arr.reverse();
            const ret_back_info_pack = {
                cmd: "mip_texture_pack",
                mipBitMaps: ret_arr,
            };
            resolve(ret_back_info_pack);
        });
    });

    return ret_promise;
}

module.exports = { read_instanced_texture, read_mip_instance }