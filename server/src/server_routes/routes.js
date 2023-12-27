
// fetch image 

const {
    read_instanced_texture,
    read_mip_instance
} = require("../fetch_img/fetch_img")


// 任务分发器，用于根据命令不同，将不同任务分发到各个处理函数
const service_distribution = function (socket, json_pack) {
    console.log(json_pack);

    let ret_promise = new Promise((resolve, reject) => {
        switch (json_pack.cmd) {
            case "fetch_instanced_texture":
                // read_instanced_texture();
                resolve(read_instanced_texture());
                break;
            case "fetch_mip_instance":
                // read_mip_instance(json_pack);
                resolve(read_mip_instance(json_pack));
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
