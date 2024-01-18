const fs = require("fs")


function read_description_json(json_path) {
    let ret_promise = new Promise((resolve, reject) => {

        const file = fs.readFileSync(json_path);

        const obj = JSON.parse(file)

        resolve(obj);

    });

    return ret_promise;
}





function read_layout2_json(json_path) {
    let ret_promise = new Promise((resolve, reject) => {

        const file = fs.readFileSync(json_path);

        const obj = JSON.parse(file)

        resolve(obj);

    });

    return ret_promise;
}



module.exports = {
    read_description_json,
}

