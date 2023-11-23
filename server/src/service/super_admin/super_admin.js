
/*
    帐号创建
    直接在当前用户表中创建管理员账户
*/

const create_admin_account = function (json_pack) {

}


/*
    帐号管理
    更新admin用户信息（数据库删表，读当前页面信息，重写数据库）
*/
const update_admin_account = function (json_pack) {
    refresh_admin_account(json_pack);
}

/*
    帐号管理
    删除对应admin帐号，管理方式同上
*/
const delete_admin_account = function (json_pack) {
    refresh_admin_account(json_pack);
}


/*
    帐号管理
    数据库刷新：数据库删表，读当前页面信息，重写数据库
*/ 
const refresh_admin_account = function (json_pack) {

}


module.exports = {
    create_admin_account,
    update_admin_account,
    delete_admin_account,
}
