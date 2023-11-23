// const { login_info_record } = require("./src/server_routes/routes")
const { service_distribution } = require("./src/server_routes/routes");


const socket_server_handler = function (socket) {

    socket.on("text", function (data_pack) {

        // JSON 数据包解析
        console.log(data_pack, typeof data_pack);
        const json_pack = JSON.parse(data_pack);
        // 打印查看当前 指令
        console.log("CMD = ", json_pack.cmd);


        // 进入Router，进行业务发配
        service_distribution(socket, json_pack).then(send_data => {
            // console.log("send_data = ", send_data); // 数据库操作完毕后，返回数据库端发回前端的数据
            socket.sendText(JSON.stringify(send_data));
        });

    });

    //   socket.sendText("服务器端收到客户端发来的消息" + str + count++);

    socket.on("error", () => {
        console.log("err");
    });

}


module.exports = { socket_server_handler }
