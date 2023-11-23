
const { MYSQL_CONFIG } = require("../db_config/config");//require 的方式好像不需要加 .js 来表示一个文件 但是对于import就是必须的

const mysql = require('mysql');


const connectSQL_and_execSQL = function (sql) {

    const connection = mysql.createConnection(MYSQL_CONFIG);

    // 开始链接
    connection.connect();


    const promise = new Promise((resolve, reject) => {

        connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
                // console.error("error = ", err);
                return;
            }
            resolve(result);
            // console.log("result", result);
        });

    });

    return promise;

}


module.exports = {
    connectSQL_and_execSQL
}
