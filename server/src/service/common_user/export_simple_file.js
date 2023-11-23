const fs = require("fs")



const export_simple_file_to_page = function (json_pack) {

    console.log("ready to load server local files ", json_pack);
    let ret_promise = new Promise((resolve, reject) => {

        const file_path = "./src/AnnualReportFiles/" + json_pack.url;
        const name_arr = json_pack.url.split("/");
        const file_download_name = name_arr[0] + name_arr[1];
        // const data = fs.readFileSync("/home/ctrtemp/Documents/WebServer/rail_traffic/Round3/0321_/rail_traffic/src/AnnualReportFiles/Report01/2020.pdf");
        // 根目录相对为bin/www.js，相对于它进行向下索引相对目录
        const data = fs.readFileSync(file_path);

        const base64Data = Buffer.from(data).toString("base64");
        // const base64Data = Buffer.from(data).toString("binary");


        const ret_json_pack = {
            cmd: "req_file_return",
            flow_str: base64Data,
            file_download_name: file_download_name
        }
        resolve(ret_json_pack);
    });

    return ret_promise;
}

const export_simple_file_list_page = function (json_pack) {

    console.log("ready to give simple file list to page");

    // let read_file_promise = new Promise((resolve, reject) => {

    // })

    let files_list_obj = {};

    const annualReportRootDir = "./src/AnnualReportFiles";
    fs.readdir(annualReportRootDir, (err_root, annualReportNames) => {
        if (err_root) {
            console.log("current annual report file root dir has err");
            return;
        }
        annualReportNames.forEach((annualReportName) => {
            // console.log("dir = ", annualReportName);
            const layer1Dir = annualReportRootDir + "/" + annualReportName;
            files_list_obj[annualReportName] = {};

            fs.readdir(layer1Dir, (err_layer1, annualReoprtFileYears) => {
                if (err_layer1) {
                    console.log("current annual report file Name dir has err");
                    return;
                }
                files_list_obj[annualReportName]["list"] = [];
                annualReoprtFileYears.forEach(annualReoprtFileYear => {
                    console.log("annual report years = ", annualReportName, "/", annualReoprtFileYear);
                    let year_str = annualReoprtFileYear.replace(".pdf", '');
                    files_list_obj[annualReportName]["list"].push(year_str);
                })
                files_list_obj[annualReportName]["selected"] = files_list_obj[annualReportName]["list"][0];
            })
        })
    })



    let ret_promise = new Promise((resolve, reject) => {

        setTimeout(() => {
            console.log("files_list_obj = ", files_list_obj);

            const ret_json_pack = {
                cmd: "req_pdf_list_return",
                list: files_list_obj
            };

            resolve(ret_json_pack);

        }, 100);


    });


    return ret_promise;
}


const export_img_list_page = function (json_pack) {

    console.log("ready to give img list to page");

    let files_list_obj = {};

    const imgRootDir = `./src/assets/img/${json_pack.module}/${json_pack.index}`;
    fs.readdir(imgRootDir, (err_root, imgNames) => {
        if (err_root) {
            console.log("current img file root dir has err");
            return;
        }
        imgNames.forEach((imgName) => {
            // console.log("dir = ", imgName);
            const layer1Dir = imgRootDir + "/" + imgName;
            files_list_obj[imgName] = {};

            fs.readdir(layer1Dir, (err_layer1, imgs) => {
                if (err_layer1) {
                    console.log("current img file Name dir has err");
                    return;
                }
                files_list_obj[imgName]["list"] = {};
                imgs.forEach(img => {
                    // console.log("img name = ", layer1Dir + "/" + img);
                    const file_path = layer1Dir + "/" + img;
                    const image_style = img.split(".")[1];
                    const img_data = fs.readFileSync(file_path);
                    const base64Data = `data:image/${image_style};base64,` + Buffer.from(img_data).toString("base64");

                    let image_file_obj = {
                        file_base64: base64Data,
                    }
                    files_list_obj[imgName]["list"][img] = image_file_obj;
                })
                const keys = Object.keys(files_list_obj[imgName]["list"]);
                files_list_obj[imgName]["selected"] = keys[0];
            })
        })
    })


    let ret_promise = new Promise((resolve, reject) => {

        setTimeout(() => {
            // console.log("files_list_obj = ", files_list_obj);

            const ret_json_pack = {
                cmd: "req_img_list_return",
                index: json_pack.index,
                list: files_list_obj
            };

            resolve(ret_json_pack);

        }, 100);


    });


    return ret_promise;

}

module.exports = {
    export_img_list_page,
    export_simple_file_list_page,
    export_simple_file_to_page
}
