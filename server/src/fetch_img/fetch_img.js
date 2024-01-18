const fs = require("fs")

const {
    read_description_json
} = require("./fetch_json")


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

            const read_dir = `../../../data_set/mip_img/mip${idx}`;
            fs.readdir(read_dir, (err, files) => {
                if (err) {
                    console.log("read data err = ", err);
                }
                else {
                    let url_arr = [];
                    // console.log("files = ", files);
                    for (let j = 0; j < mip_info_arr[idx]; j++) {

                        const path = `../../../data_set/mip_img/mip${idx}/` + files[j];
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







/**
 *  根据所需要的图片数据，在数据集中获取特定 Quad Instance 方格图片
 * */

function recursive_read_quad_instance(idx, edge, mip_info_arr, ret_arr) {

    if (idx == edge) {
        return new Promise((resolve, reject) => {
            resolve({});
        });
    }

    let ret_promise = new Promise((resolve, reject) => {

        recursive_read_quad_instance(idx + 1, edge, mip_info_arr, ret_arr).then(() => {
            const quad_level = 4096 / Math.pow(2, idx) / 4;
            // console.log("idx = ", idx);
            let quad_str = quad_level.toString();
            if (quad_level < 10) {
                quad_str = "0" + quad_str;
            }
            // console.log("quad_str = ", quad_str);

            if (quad_level < 1 || quad_level > 64) {
                ret_arr.push([]);
                resolve([]);
            }

            else {
                const read_dir = `../../../data_set/quad_img/x${quad_str}`;
                // console.log("read_dir = ", read_dir);
                // resolve({});
                fs.readdir(read_dir, (err, files) => {
                    if (err) {
                        console.log("read data err = ", err);
                    }
                    else {
                        let url_arr = [];
                        // console.log("files = ", files);
                        for (let j = 0; j < mip_info_arr[idx]; j++) {

                            const path = `../../../data_set/quad_img/x${quad_str}/` + files[j];
                            const file = fs.readFileSync(path);

                            url_arr.push(file.toString("base64"));
                        }
                        ret_arr.push(url_arr);
                        resolve(url_arr);
                    }
                });
            }

        })
    });

    // console.log("return idx = ", idx);

    return ret_promise;
}

/**
 *  读取 quad_img 图片方格
 * */
async function read_quad_instance(json_pack) {

    const mip_info_arr = json_pack.mip_info["arr"];
    // console.log("mip_info_arr = ", mip_info_arr);
    let ret_arr = [];

    let ret_promise = new Promise((resolve, reject) => {
        recursive_read_quad_instance(0, 13, mip_info_arr, ret_arr).then(() => {
            // console.log("ret_arr = ", ret_arr);
            ret_arr.reverse();
            const ret_back_info_pack = {
                cmd: "quad_texture_pack",
                quadBitMaps: ret_arr,
            };
            resolve(ret_back_info_pack);
        });
    });

    return ret_promise;
}





function read_large_texture(root_dir, ret_arr) {


    let ret_promise = new Promise((resolve, reject) => {

        fs.readdir(root_dir, (err, files) => {
            if (err) {
                console.log("read data err = ", err);
            }
            else {
                // console.log("files = ", files);
                for (let i = 0; i < files.length; i++) {

                    const path = root_dir + files[i];
                    const file = fs.readFileSync(path);

                    ret_arr.push(file.toString("base64"));

                    // console.log(url_arr);
                }

                resolve([]);

            }

        });

    });

    // console.log("return idx = ", idx);

    return ret_promise;
}




async function read_big_pre_fetch_img(json_pack) {

    const large_quad_root_dir = "../../../data_set/large/"
    const description_json_path = "../../../data_set/large_quad.json"

    let ret_arr = [];

    const description_json = await read_description_json(description_json_path);
    await read_large_texture(large_quad_root_dir, ret_arr)
    console.log("mark");

    let ret_promise = new Promise((resolve, reject) => {
        // read_large_texture(large_quad_root_dir, ret_arr).then(() => {
        //     // console.log("ret_arr = ", ret_arr);
        //     // ret_arr.reverse();
        //     read_description_json(description_json_path).then(description_json => {
        //         console.log("read done");
        //         const ret_back_large_info_pack = {
        //             cmd: "large_texture_pack",
        //             largeBitMaps: ret_arr,
        //             description_json: description_json
        //         };
        //         resolve(ret_back_large_info_pack);
        //     })
        // });

        const ret_back_large_info_pack = {
            cmd: "large_texture_pack",
            largeBitMaps: ret_arr,
            description_json: description_json
        };
        resolve(ret_back_large_info_pack);
    });

    return ret_promise;
}



module.exports = {
    read_instanced_texture,
    read_mip_instance,
    read_quad_instance,
    read_big_pre_fetch_img
}