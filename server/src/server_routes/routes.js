
// fetch image 

const {
    read_instanced_texture,
    read_mip_instance,
    read_quad_instance,
    read_big_pre_fetch_img,
    read_single_raw_image,
} = require("../fetch_img/fetch_img")

let cnt = 0;

// 任务分发器，用于根据命令不同，将不同任务分发到各个处理函数
const service_distribution = function (socket, json_pack) {
    // console.log(json_pack);
    console.log(cnt++);


    let ret_promise = new Promise((resolve, reject) => {
        switch (json_pack.cmd) {
            case "void":
                const test_void_ret_info = {
                    cmd: "void_ret_pack",
                    pack: []
                };
                resolve(test_void_ret_info);
                break;
            case "sys_startup_prefetch":            // 系统启动时候首次取的数据
                resolve(read_big_pre_fetch_img());
                break;
            case "fetch_instanced_texture":
                // read_instanced_texture();
                resolve(read_instanced_texture());
                break;
            case "fetch_mip_instance":
                // read_mip_instance(json_pack);
                resolve(read_mip_instance(json_pack));
                break;
            case "fetch_quad_instance":
                // resolve();
                read_quad_instance(json_pack, socket);
                break;
            case "fetch_single_img":
                read_single_raw_image(json_pack, socket);
                break;
            default:
                console.log("Missing: CMD out of range");
        }
    })

    return ret_promise;
}


module.exports = {
    service_distribution,
}
