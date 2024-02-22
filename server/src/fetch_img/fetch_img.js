const fs = require("fs")

const {
    read_description_json
} = require("./fetch_json")

const filename_map = require("../filename_map");
const img_info_arr = require("../img_set_description_arr");

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
                    // const file = fs.readFileSync(path);


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



function read_instance_in_single_mip_level(mip_val, single_mip_arr, data_pack_volume) {

    if (mip_val <= 1 || mip_val >= 6) {
        return [];
    }
    // console.log("map len = ", filename_map.map.length);
    // console.log("single_mip_arr len = ", single_mip_arr.length);

    const cur_pic_len = single_mip_arr.length;
    const quad_level = 4096 / Math.pow(2, mip_val) / 4; // Mip5 对应 32*32 文件夹

    let quad_str = quad_level.toString();
    if (quad_level < 10) {
        quad_str = "0" + quad_str;
    }

    // const root_dir = `../../../data_set/quad_img/x${quad_str}/`;  // 本地 D 盘 10k 数据集
    // const root_dir = `D:/Data/PKU/WebGPU/PicSet/COVID-19-VIS/quad_img/x${quad_str}/`;  // 移动硬盘（注意盘号可能会发生改变） 300k 数据集
    const root_dir = `../../../../../../../../Data/PKU/WebGPU/PicSet/COVID-19-VIS/quad_img/x${quad_str}/`;  // 移动硬盘（注意盘号可能会发生改变） 300k 数据集



    let url_arr = [];


    while (single_mip_arr.length != 0) {
        /**
         *  这里默认pop()最后一个元素，可以尝试使用数组任意元素删除的操作，虽然时间复杂度更高，
         * 但好在数组不会那么长，所以耗时也不会太久
         * */
        // const pic_idx = single_mip_arr.pop(); // 顺序操作

        const rand_idx = Math.floor(Math.random() * single_mip_arr.length);
        const pic_idx = single_mip_arr[rand_idx];
        single_mip_arr.splice(rand_idx, 1);


        const file_path = root_dir + filename_map.map[pic_idx];
        if (fs.existsSync(file_path)) {
            const file = fs.readFileSync(file_path);
            url_arr.push({
                pic_idx: pic_idx,
                file_url: file.toString("base64"),
            });
            data_pack_volume.val--;
            if (data_pack_volume.val == 0) {
                break;
            }
        }
    }

    // for (let i = 0; i < cur_pic_len; i++) {
    //     const pic_idx = single_mip_arr[i];


    // }

    // console.log("url_arr = ", url_arr);
    return url_arr;
}


/**
 *  读取 quad_img 图片方格
 * */
async function read_quad_instance(json_pack, socket) {


    let data_pack_volume = { val: 50 }; // 限制一个数据包最多传输50张图片（该方式传参相当于传引用）
    // const mip_info_arr = json_pack.mip_info["arr"];
    let mip_index_arr = json_pack.mip_info;

    let flag = false;
    for (let i = 0; i < mip_index_arr.length; i++) {
        if (mip_index_arr[i] != 0) {
            flag = true;
            break;
        }
    }

    if (flag == false) {
        return;
    }

    // console.log("mip_info_arr = ", mip_index_arr);
    let ret_arr = [];

    let fetch_bitmap_cnt = 0;


    for (let i = 0; i < mip_index_arr.length; i++) {
        const arr = read_instance_in_single_mip_level(i, mip_index_arr[i], data_pack_volume);
        // console.log("data_pack_volume = ", data_pack_volume);
        fetch_bitmap_cnt += arr.length;
        ret_arr.push(arr);
    }
    // console.log("mip_info_arr = ", json_pack.mip_info);

    const cmd_pack = {
        cmd: "quad_texture_pack",
        quadBitMaps: ret_arr,
    };
    socket.sendText(JSON.stringify(cmd_pack));



    console.log("fetch_bitmap_cnt = ", fetch_bitmap_cnt);


    // 尝试设置一个定时器查看效果：

    setTimeout(() => {
        read_quad_instance(json_pack, socket); // 递归调用
    }, 500);

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

    // const large_quad_root_dir = "../../../data_set/large/"
    // const large_quad_root_dir = "../../../data_set/large_16_16/"    // 300k
    const large_quad_root_dir = "../../../data_set/large_08_08/"    // 300k 
    // const large_quad_root_dir = "../../../data_set/large_8x8_10k/"



    // const description_json_path = "../../../data_set/large_quad.json"
    // const description_json_path = "../../../data_set/large_quad_dict.json"
    // const description_json_path = "../../../data_set/large_quad_dict-300k.json" // 300k 32*32
    // const description_json_path = "../../../data_set/large_quad_dict_16.json"   // 300k dict
    // const description_json_path = "../../../data_set/large_quad_dict_08.json"   // 300k dict
    const description_json_path = "../../../data_set/large_quad_arr_08.json"   // 300k arr
    // const description_json_path = "../../../data_set/large_quad_arr_10k_8x8.json" // 10k arr

    let ret_arr = [];

    const description_json = await read_description_json(description_json_path);
    await read_large_texture(large_quad_root_dir, ret_arr)
    console.log("mark texture read in");

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




async function read_single_raw_image(json_pack, socket) {

    const file_idx = json_pack["idx"];
    const file_name = filename_map.map[file_idx];
    const file_info = img_info_arr.arr[file_idx];
    // G:\Code\PKU\WebGPU\WebGPU_Browser\240213_detail_view_and_optimize_fisheye\WebGPU_Tutorial\server\src\fetch_img
    // const root_dir = `D:/Data/PKU/WebGPU/PicSet/COVID-19-VIS/covid_charts-300k/`;  // 移动硬盘（注意盘号可能会发生改变） 300k 数据集
    const root_dir = `../../../../../../../../Data/PKU/WebGPU/PicSet/COVID-19-VIS/covid_charts-300k/`;  // 移动硬盘（注意盘号可能会发生改变） 300k 数据集
    const file_path = root_dir + file_name;


    const file = fs.readFileSync(file_path);
    const trans_url = file.toString("base64");

    // console.log("trans_url = ", trans_url);

    const ret_back_single_raw_img = {
        cmd: "single_raw_img",
        img_url: trans_url,
        img_info: file_info,
    };


    socket.sendText(JSON.stringify(ret_back_single_raw_img));

}



module.exports = {
    read_instanced_texture,
    read_mip_instance,
    read_quad_instance,
    read_big_pre_fetch_img,
    read_single_raw_image,
}