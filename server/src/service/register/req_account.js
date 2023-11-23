
const { connectSQL_and_execSQL } = require("../../db/mysql")


const req_account = function (json_pack) {

    let ret_json_pack = {};
    ret_json_pack.cmd = "register";

    console.log("json_pack = ", json_pack);


    const sql_find_current_storage = `select * from rail_current_account_info where account = '${json_pack.user_info.account}'`;
    const sql_find_req_storage = `select * from rail_account_req_info where account = '${json_pack.user_info.account}'`;

    const ret_promise = new Promise((resolve, reject) => {
        connectSQL_and_execSQL(sql_find_current_storage).then(exec_result_current => {
            if (exec_result_current.length != 0) {
                console.log("该帐号已被注册");
                ret_json_pack.allow = false;
                ret_json_pack.alert = "该帐号已被注册，请修改注册帐号";
                // 解析promise并返回
                resolve(ret_json_pack);
            }
            else {
                connectSQL_and_execSQL(sql_find_req_storage).then(exec_result_req => {
                    if (exec_result_req.length != 0) {
                        console.log("该帐号已提交过用户申请，注意审批");
                        ret_json_pack.allow = false;
                        ret_json_pack.alert = "该帐号已提交过用户申请，请联系管理员审批; 如果您未曾提交过该帐号，考虑更换用户帐号";
                    }
                    else {
                        // 开始 json_pack 信息审批，合法性检测
                        if (json_pack.user_info.password != json_pack.user_info.passwordConfirm) {
                            ret_json_pack.allow = false;
                            ret_json_pack.alert = "两次密码输入不匹配";
                        }
                        // else if (json_pack.user_info.reqAuthority.active != "user") {
                        //     ret_json_pack.allow = false;
                        //     ret_json_pack.alert = "申请权限等级只能为user";
                        // }
                        else {
                            // 到这一步，之前的语法检测全部通过
                            ret_json_pack["user_info"] = json_pack.user_info;
                            ret_json_pack.allow = true;
                            ret_json_pack.alert = "注册成功";
                            // 为数据库的审核申请表插入一条记录
                            const insert_sql = `INSERT INTO rail_account_req_info(
                                account,
                                password,
                                user_name,
                                req_db,
                                req_authority,
                                req_time,
                                remarks
                            )
                            VALUES (
                                '${json_pack.user_info.account}',
                                '${json_pack.user_info.password}',
                                '${json_pack.user_info.userName}',
                                '${json_pack.user_info.dataBase}',
                                '${json_pack.user_info.reqAuthority.active}',
                                '${Date.now()}',
                                '${json_pack.user_info.remarks}'
                                );`;

                            connectSQL_and_execSQL(insert_sql);

                        }
                    }

                    // 解析promise并返回
                    resolve(ret_json_pack);
                })
            }

        })
    })

    return ret_promise;

}


module.exports = { req_account }