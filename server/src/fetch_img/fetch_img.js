const fs = require("fs")
const Blob = require("buffer")

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

                for (let i = 0; i < files.length; i++) {
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


module.exports = { read_instanced_texture }