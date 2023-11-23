
const {
    connect_to_remote_mongodb,
    import_to_mongodb,
} = require("../../db/mongodb")

const link_mongodb = function () {
    console.log("prepare to link mongodb");

    const ret_promise = new Promise((resolve, reject) => {
        resolve("void");
    })


    return ret_promise;
}


const create_or_update_collection = function (json_pack) {

    console.log("json_pack = ", json_pack);

    const module = json_pack['db_info']['db_root'];
    const collection = json_pack['db_info']['db_collection'];

    // 索引到当前collection
    const mongodb_module = connect_to_remote_mongodb(`${module}_db_user`, '1woshicui999', module, collection);
    const insert_json_file = {
        info: json_pack['db_info'],
        content: json_pack['content']
    };

    // 清空当前 collection 之后 再插入新文档
    mongodb_module.remove({}, () => {
        console.log("remove done");
        import_to_mongodb(insert_json_file, mongodb_module);
    });

    console.log("prepare to link mongodb");

    const ret_promise = new Promise((resolve, reject) => {
        resolve("void");
    })


    return ret_promise;
}


// 从后端取数据库数据, 发往前端
const export_collection_to_page = function (json_pack) {

    console.log("json_pack = ", json_pack);

    const module = json_pack['db_info']['db_root'];
    const collection = json_pack['db_info']['db_collection'];

    // 索引到当前collection
    const mongodb_module = connect_to_remote_mongodb(`${module}_db_user`, '1woshicui999', module, collection);


    const ret_promise = new Promise((resolve, reject) => {
        mongodb_module.findOne({}, function (err, data) {
            let ret_pack = data.json_data;
            ret_pack["cmd"] = "user";
            resolve(ret_pack);
        });
    })

    return ret_promise;
}



module.exports = {
    link_mongodb,
    create_or_update_collection,
    export_collection_to_page
}

