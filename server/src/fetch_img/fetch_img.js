

const fs = require("fs")
const Blob = require("buffer")

function read_instanced_texture() {
    let ret_promise = new Promise((resolve, reject) => {
        // 从根目录开始结算
        fs.readdir("./src/fetch_img/img_instance", (err, files) => {
            if (err) {
                console.log("read data err = ", err);
            }
            else {
                console.log("files = ", files);
                // resolve(files);

                let url_arr = [];

                for (let i = 0; i < files.length; i++) {
                    const path = "./src/fetch_img/img_instance/" + files[i];
                    const file = fs.readFileSync(path);
                    // const file = fs.readFileSync(path);



                    // console.log("file = ", file);
                    // url_arr.push(file);
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