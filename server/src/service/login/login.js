
const { connectSQL_and_execSQL } = require("../../db/mysql")
const { connect_to_remote_mongodb, export_to_webpage } = require("../../db/mongodb")

/*
    用户登录，在数据库中与前端发来的信息进行比对，进行认证
*/

const user_login = function (json_pack) {

    const ret_json_pack = {};
    ret_json_pack.cmd = "login";

    // 第一步先根据帐号确定是否有此用户
    // console.log("json_pack = ", json_pack);
    // 根据用户帐号执行 query
    const sql_find = `select * from rail_current_account_info where account = ${json_pack.account}`;


    const ret_promise = new Promise((resolve, reject) => {
        connectSQL_and_execSQL(sql_find).then(exec_result => {

            if (exec_result.length == 0) { // 没有该帐号，应该禁止登录，返回一个提示
                console.log("account doesn't exist");
                ret_json_pack.allow = false;
                ret_json_pack.alert = "对应帐号用户不存在";
            }

            else { // 账户存在，允许登录，返回一个提示
                console.log("account exists");

                // 首先对账户密码进行验证
                // console.log("query password = ", exec_result[0].password);
                // console.log("input password = ", json_pack.password);


                // console.log("query user_name = ", exec_result[0].user_name);
                // console.log("input user_name = ", json_pack.user_name);

                if (exec_result[0].password != json_pack.password) {
                    ret_json_pack.allow = false;
                    ret_json_pack.alert = "用户密码错误";
                }

                // 暂不核对用户名
                // else if (exec_result[0].user_name != json_pack.user_name) {
                //     ret_json_pack.allow = false;
                //     ret_json_pack.alert = "用户名与帐号不匹配";
                // }

                // 下一步判申请登入的权限是否合格？
                else {
                    ret_json_pack.authority = exec_result[0].db_authority; // 实际可以访问的最高权限

                    if (exec_result[0].db_authority == "super_admin") {
                        ret_json_pack.allow = true;
                    }
                    else if (exec_result[0].db_authority == "admin") {
                        if (json_pack.authority == "super_admin") {
                            ret_json_pack.allow = false;
                            ret_json_pack.alert = "权限不合格，请检测登入身份";
                        }
                        else {
                            ret_json_pack.allow = true;
                        }
                    }
                    else if (exec_result[0].db_authority == "user" || exec_result[0].db_authority == "staff" || exec_result[0].db_authority == "clerk") {
                        if (json_pack.authority == "user") {
                            ret_json_pack.allow = true;
                        }
                        else {
                            ret_json_pack.allow = false;
                            ret_json_pack.alert = "权限不合格，请检测登入身份";
                        }
                    }
                }

            }


            ret_json_pack.login_authority = json_pack.authority; // 将以哪种权限访问
            // 以下根据访问权限，到对应的数据库表中取数据（为之后的页面渲染用）

            if (ret_json_pack.allow == true) {

                ret_json_pack.data_list = {};

                if (json_pack.authority == "super_admin") {
                    const fetch_sql = `select * from rail_current_account_info where db_authority = 'admin';`;
                    connectSQL_and_execSQL(fetch_sql).then(fetch_result => {
                        ret_json_pack.data_list.current_account = fetch_result;
                        resolve(ret_json_pack);
                    })
                }
                else if (json_pack.authority == "admin" || (json_pack.authority == "user" && (exec_result[0].db_authority == "admin" || exec_result[0].db_authority == "super_admin"))) {
                    const fetch_sql_current = `select * from rail_current_account_info;`;
                    connectSQL_and_execSQL(fetch_sql_current).then(fetch_result_current => {
                        ret_json_pack.data_list.current_account = fetch_result_current;
                        const fetch_sql_request = `select * from rail_account_req_info;`;
                        connectSQL_and_execSQL(fetch_sql_request).then(fetch_result_request => {
                            ret_json_pack.data_list.request_account = fetch_result_request;
                            resolve(ret_json_pack);
                            console.log("ret_json_pack = ", ret_json_pack);
                        });
                    });

                }
                else if (json_pack.authority == "user") { // 以下开始登录
                    // ret_json_pack.login_info = {
                    //     account:exec_result[0].account,
                    //     password: exec_result[0].password,
                    //     user_name: exec_result[0].user_name,
                    //     db_name: exec_result[0].db_name
                    // }
                    const login_url = `mongodb://${'luckysheet_db_user_ctr'}:${exec_result[0].password}@43.143.168.177:29999/${exec_result[0].db_name}`;
                    console.log(login_url);
                    const import_export_Model = connect_to_remote_mongodb('luckysheet_db_user_ctr', '1woshicui999', 'luckysheet', 'test_sheets');
                    console.log("module = ", import_export_Model);
                    import_export_Model.findOne({}, function (err, data) {
                        if (err) {
                            console.log("err = ", err)
                        } else {
                            console.log("data = ", data);
                        }
                    });
                    resolve(ret_json_pack);
                }
            }
            else {

                resolve(ret_json_pack);
            }

        })
    });


    return ret_promise;

}



module.exports = {
    user_login,
}