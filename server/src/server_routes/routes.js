

// 一般用户提交注册申请
const { req_account } = require("../service/register/req_account");

// 用户登录
const { user_login } = require("../service/login/login");


// 共享编辑
const { import_to_mongodb, export_to_webpage, connect_to_mongodb, update_mongodb, update_sheet_mongodb
} = require("../service/common_user/shared_editing");

// 一般用户平台

const {
    link_mongodb,
    create_or_update_collection,
    export_collection_to_page,
} = require("../service/common_user/link_mongodb");

const {
    export_simple_file_to_page,
    export_simple_file_list_page,
    export_img_list_page,
} = require("../service/common_user/export_simple_file");

const {
    query_gis_data
} = require("../service/common_user/query_gis_data");

const {
    query_card
} = require("../service/common_user/query_raw_data_card");

const {
    query_ptv,
    query_multi_ptv
} = require("../service/common_user/query_raw_data_ptv");

// 管理员平台
const {
    agree_user_request,
    retreat_user_request,
    update_user_account,
    delete_user_account, } = require("../service/admin/admin")


// 超级管理员平台
const {
    create_admin_account,
    update_admin_account,
    delete_admin_account, } = require("../service/super_admin/super_admin")

// fetch image 

const {
    read_instanced_texture
} = require("../fetch_img/fetch_img")


// 任务分发器，用于根据命令不同，将不同任务分发到各个处理函数
const service_distribution = function (socket, json_pack) {
    console.log(json_pack);
    let pack;
    let import_export_Model;

    let ret_promise = new Promise((resolve, reject) => {
        switch (json_pack.cmd) {
            case "register":                // 注册
                req_account(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "login":                   // 登录
                user_login(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack)
                });
                break;
            case "link_mongodb":            // 一般用户
                link_mongodb(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "insert_lucky_to_mongodb":  // 一般用户
                create_or_update_collection(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "req_lucky":               // 一般用户
                export_collection_to_page(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "req_file":               // 一般用户（文件下载）
                export_simple_file_to_page(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "req_pdf_list":               // 一般用户（文件列表申请）
                export_simple_file_list_page(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "query_card":               // 一般用户（原始刷卡数据申请）
                query_card(json_pack).then(ret_json_pack => {
                    console.log("ret json pack = ", ret_json_pack);
                    if (ret_json_pack.cmd == "query_card_return_no_such_file") {
                        resolve(ret_json_pack);
                    }

                    else if (ret_json_pack.page_styled_json[0].body.length == 0) {
                        ret_json_pack.cmd = "query_card_return_void_query_result";
                    }
                    resolve(ret_json_pack);
                });
                break;
            case "query_ptv":               // 一般用户（单一文件ptv导出数据申请）
                query_ptv(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "query_multi_ptv":               // 一般用户（多文件ptv导出数据申请）
                query_multi_ptv(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case 'gis':
                query_gis_data(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;


            // 共享编辑
            //
            //
            case "init_sheet":                 // 初始化表格
                import_export_Model = connect_to_mongodb(json_pack.page_index);
                export_to_webpage(socket, import_export_Model).then(ret_json => {
                    console.log(ret_json) //打印测试
                    let init_pack = {
                        cmd: "init",
                        json: ret_json,
                        page_index: json_pack.page_index
                    }
                    resolve(init_pack);

                    // 将数据返回给前端
                    // socket.sendText(JSON.stringify(init_pack));
                });
                break;
            case "update_sheet":               // 更新后端表格
                import_export_Model = connect_to_mongodb(json_pack.page_index);

                pack = json_pack.json;
                // 首先点对点query后更新数据库（避免大面积删改）
                update_mongodb([pack], import_export_Model);

                // 暂时不进行广播
                // 之后进行全体页面广播
                socket.server.connections.forEach((conn) => {
                    let boardcast_pack = {
                        cmd: "update",
                        json: [pack],
                        page_index: json_pack.page_index
                    }
                    conn.sendText(JSON.stringify(boardcast_pack));
                })
                break;
            case "upload_sheet":               // 使用上传的表格，替换后端表格
                import_export_Model = connect_to_mongodb(json_pack.page_index);

                console.log("upload_sheet");
                pack = json_pack.json;
                // 首先点对点query后更新数据库（避免大面积删改）
                update_sheet_mongodb(pack, import_export_Model);

                // 之后进行全体页面广播
                socket.server.connections.forEach((conn) => {
                    let boardcast_pack = {
                        cmd: "upload",
                        json: pack,
                        page_index: json_pack.page_index
                    }
                    conn.sendText(JSON.stringify(boardcast_pack));
                })
                break;

            case "accept_user_account":      // 管理员 : 同意用户账户申请
                agree_user_request(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "retreat_user_account":    // 管理员 : 驳回用户账户申请
                retreat_user_request(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "update_user_account":     // 管理员
                update_user_account(json_pack);
                break;
            case "delete_user_account":     // 管理员 ： 删除账户
                delete_user_account(json_pack).then(ret_json_pack => {
                    resolve(ret_json_pack);
                });
                break;
            case "create_admin_account":    // 超级管理员
                create_admin_account(json_pack);
                break;
            case "update_admin_account":    // 超级管理员
                update_admin_account(json_pack);
                break;
            case "delete_admin_account":    // 超级管理员
                delete_admin_account(json_pack);
                break;
            case "test":
                resolve({ test: "test_temp_from_server" });
                break;

            case "fetch_instanced_texture":
                // read_instanced_texture();
                resolve(read_instanced_texture());
                break;

            default:
                console.log("Missing: CMD out of range");
        }
    })


    return ret_promise;

}


module.exports = {
    service_distribution,
}
