
const { connectSQL_and_execSQL } = require("../../db/mysql")

/*
    帐号审核
    如果审核通过当前选中的用户申请，则创建这些帐号。
  * 首先要做的是将在审核表中的这些用户清除
  * 之后在当前用户表中插入这些用户
*/

const agree_user_request = function (json_pack) {
    console.log("accept_json_pack = ", json_pack);

    const account_unit = json_pack.user_info;



    const ret_json_pack = {
        cmd: "accept_user_account",
        account: json_pack.user_info.account,
        req_list_deleted: false,
        cur_list_inserted: false,
        new_account_info: {}
    }

    let ret_promise = new Promise((resolve, reject) => {

        const select_from_req_db_table = `select * from rail_account_req_info where account = '${account_unit.account}';`;
        connectSQL_and_execSQL(select_from_req_db_table).then(select_result => {

            const selected_unit = select_result[0];
            // console.log("selected result = ", selected_unit);
            ret_json_pack.new_account_info = selected_unit;

            // 删除申请用户列表，测试阶段先不进行删除
            const delete_from_req_db_table = `delete from rail_account_req_info where account = '${account_unit.account}';`;
            connectSQL_and_execSQL(delete_from_req_db_table).then(delete_result => {

                if (delete_result.affectedRows != 0) { // 从申请表中删除成功
                    ret_json_pack.req_list_deleted = true;


                    // 插入当前用户列表
                    const insert_intp_current_db_table = `insert into rail_current_account_info
                    (account,password,user_name, db_name, db_authority, req_time, passed_time, MongoDB_str, remarks)
                    VALUES
                    (
                        '${selected_unit.account}',
                        '${selected_unit.password}',
                        '${selected_unit.user_name}',
                        '${selected_unit.req_db}',
                        '${selected_unit.req_authority}',
                        '${selected_unit.req_time}',
                        '${Date.now()}',
                        '${'MongoDB_authentication_str'}',
                        '${selected_unit.remarks}'
                    );`

                    connectSQL_and_execSQL(insert_intp_current_db_table).then(insert_result => {
                        // console.log("insert_result = ", insert_result);
                        if (insert_result.affectedRows != 0) { // 成功导入用户信息表
                            ret_json_pack.cur_list_inserted = true;
                        }
                        resolve(ret_json_pack);
                    });
                }

                else {
                    resolve(ret_json_pack);
                }

            });

        });

    })

    return ret_promise;







    // // 群体用户账号通过
    // for (let i = 0; i < json_pack.req_list.length; i++) {
    //     const account_unit = json_pack.req_list[i];

    //     const select_from_req_db_table = `select * from rail_account_req_info where account = '${account_unit.account}';`;
    //     connectSQL_and_execSQL(select_from_req_db_table).then(select_result => {
    //         // console.log("exec_result = ", exec_result);
    //         const selected = select_result[0];

    //         const delete_from_req_db_table = `delete from rail_account_req_info where account = '${account_unit.account}';`;
    //         console.log("delect_sql = ", delete_from_req_db_table);
    //         connectSQL_and_execSQL(delete_from_req_db_table).then(exec_result => {
    //             console.log("exec_result = ", exec_result);
    //         });

    //         const insert_intp_current_db_table = `insert into rail_current_account_info
    //         (account,password,user_name, db_name, db_authority, req_time, passed_time, MongoDB_str, remarks)
    //         VALUES
    //         (
    //             '${account_unit.account}',
    //             '${account_unit.password}',
    //             '${account_unit.user_name}',
    //             '${selected.req_db}',
    //             '${account_unit.authority}',
    //             '${selected.req_time}',
    //             '${Date.now()}',
    //             '${'MongoDB_authentication_str'}',
    //             '${selected.remarks}'
    //         );`

    //         console.log(insert_intp_current_db_table);
    //         connectSQL_and_execSQL(insert_intp_current_db_table);
    //     });

    // }
}

/*
    帐号审核
    如果驳回这些选中的用户申请，
* 将审核表中的这些用户清除
* （可选）发送通知，告知用户申请已被驳回。
*/
const retreat_user_request = function (json_pack) {
    console.log("retreat_json_pack = ", json_pack);
    const retreat_from_req_db_table = `delete from rail_account_req_info where account = '${json_pack.user_info.account}';`;

    const ret_json_pack = {
        cmd: "retreat_user_account",
        account: json_pack.user_info.account,
        retreated: false
    }

    let ret_promise = new Promise((resolve, reject) => {
        connectSQL_and_execSQL(retreat_from_req_db_table).then(result => {
            console.log("result = ", result.affectedRows);
            if (result.affectedRows != 0) { // 说明驳回成功
                ret_json_pack.retreated = true;
                console.log("sucessfully retreated account");
            }
            resolve(ret_json_pack);
        })
    });

    return ret_promise;
}


/*
    帐号管理
    将当前更新过的数据在原数据库重写一次
    （这里直接考虑删表后刷新？）
    （或者考虑使用全局变量记录更新）
*/
const update_user_account = function (json_pack) {
    // refresh_user_account(json_pack);
    console.log("update_json_pack = ", json_pack);

    // 更新的原则是先删除后插入
    const delete_from_cur_db_table = `delete from rail_current_account_info where account = '${json_pack.user_info.account}';`;


    const ret_json_pack = {
        cmd: "update_user_account",
        account: json_pack.user_info.account,
        deleted: false
    }

    const select_from_req_db_table = `select * from rail_current_account_info where account = '${json_pack.user_info.account}';`;
    connectSQL_and_execSQL(select_from_req_db_table).then(select_result => {

        const selected_unit = select_result[0];
        // console.log("selected unit = ", selected_unit);

        let ret_promise = new Promise((resolve, reject) => {
            connectSQL_and_execSQL(delete_from_cur_db_table).then(result => {
                console.log("delete result = ", result);
                if (result.affectedRows != 0) { // 说明删除成功
                    ret_json_pack.deleted = true;

                    // 插入当前用户列表
                    const insert_intp_current_db_table = `insert into rail_current_account_info
                        (account,password,user_name, db_name, db_authority, req_time, passed_time, MongoDB_str, remarks)
                        VALUES
                        (
                            '${json_pack.user_info.account}',
                            '${json_pack.user_info.password}',
                            '${json_pack.user_info.user_name}',
                            '${'luckysheet'}',
                            '${json_pack.user_info.authority}',
                            '${selected_unit.req_time}',
                            '${selected_unit.passed_time}',
                            '${selected_unit.MongoDB_str}',
                            '${json_pack.user_info.remarks}'
                        );`
                    connectSQL_and_execSQL(insert_intp_current_db_table)

                }
                resolve(ret_json_pack);
            })
        })
    })







    // return ret_promise;

}

/*
    帐号管理
    删除帐号，管理方式同上（删表后根据页面信息重写一次数据库）
*/
const delete_user_account = function (json_pack) {
    console.log("delete_json_pack = ", json_pack);
    const delete_from_cur_db_table = `delete from rail_current_account_info where account = '${json_pack.user_info.account}';`;

    const ret_json_pack = {
        cmd: "delete_user_account",
        account: json_pack.user_info.account,
        deleted: false
    }

    // 测试阶段先注销这个，使其不会真正删除用户信息

    let ret_promise = new Promise((resolve, reject) => {
        connectSQL_and_execSQL(delete_from_cur_db_table).then(result => {
            // console.log("delete result = ", result);
            if (result.affectedRows != 0) { // 说明删除成功
                ret_json_pack.deleted = true;
            }
            resolve(ret_json_pack);
        })
    })


    return ret_promise;
}


/*
    帐号管理
    通用表刷新，
    删除原数据库，再根据页面信息重写数据库
*/
const refresh_user_account = function (json_pack) {

}

module.exports = {
    agree_user_request,
    retreat_user_request,
    update_user_account,
    delete_user_account,
}
