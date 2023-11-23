const ws = require("nodejs-websocket");
const { socket_server_handler } = require("../app");
// const {
//     query_connection,
//     end_connection,
//     execSQL
// } = require("./sql_exec")



const server = ws.createServer(socket_server_handler);


// 监听3008端口
server.listen(3008, () => {
    console.log("connected...");
    console.log("Listening on port 3008...");
});
