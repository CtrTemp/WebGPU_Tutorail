

const fs = require("fs")

function read_instanced_texture() {
    let ret_promise = new Promise((resolve, reject) => {
        fs.readdir("./img_instance", (err, files) => {
            if (err) {
                console.log("read data err");
            }
            else {
                console.log("files = ", files);
                resolve(files);
            }
        });
    })

    return ret_promise;
}

read_instanced_texture();


module.exports = { read_instanced_texture }