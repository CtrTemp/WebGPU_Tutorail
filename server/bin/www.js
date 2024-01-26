const ws = require("nodejs-websocket");
const { socket_server_handler } = require("../app");

const fs = require("fs")


const server = ws.createServer(socket_server_handler);


// 监听3008端口
server.listen(3008, () => {
    console.log("connected...");
    console.log("Listening on port 3008...");
    // const test_filepath  = "H:/Data/PKU/WebGPU/PicSet/COVID-19-VIS/check_file_cnt.py";
    // const test_filepath  = "D:/Data/PKU/WebGPU/PicSet/COVID-19-VIS/quad_img/x256/70a4d042597b8afe671db833ad3d4f77.png";
    // console.log(fs.existsSync(test_filepath));
});
