
const mongoose = require('mongoose');

const connect_to_mongodb = function (page_index) {
    let m = new mongoose.Mongoose();

    m.connection.close()
    url = "mongodb://" + page_index.db_root + "_db_user:1woshicui999@43.143.168.177:29999/" + page_index.db_root;
    m.connect(url);

    var db = m.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log("server-database connected sucessfully")
     });

    // 第一步先创建一个Schema对象（对应的是数据库级别）
    // 注意，这里的Schema是对之后表单的一个限制，必须要加
    let Schema = m.Schema
    let jsonSchema = new Schema({
        // table_name: String, // 可以用这个作为表名 是否有必要？
        json_data: Object
    });

    // 创建Model对象
    // 这里 imported_json 对应的是表名（tables）
    // 注意，没有表的话会新创建一张表，否则会在该表之后进行追加
    // 故以下这句表达式是：创建表 或 索引到特定的表
    m.connection.models = {}
    m.models = {}
    let import_export_Model = m.model(page_index.db_collection, jsonSchema);
    console.log('model', import_export_Model)

    console.log("server-mongodb connected successfully");

    return import_export_Model;
}


// 完全创建一个新的表格，或者要刷新整张表格的时候使用这个函数
const import_to_mongodb = function (json_file, import_Model) {

    // 先对表格进行一次清空
    import_Model.remove({}, function (err) {
        if (!err) {
            console.log("removed");
        }
    })
    // 之后导入要存入的新数据
    import_Model.create({
        json_data: json_file
    }, err => {
        if (!err) {//如果没有报错，则执行下面的语句
            console.log("json file imported sucessfully");
        }
    })
    // let sheet = new import_Model({
    //     json_data: json_file
    // })
    // sheet.save();
}

const export_to_webpage = function (socket, export_Model) {

    const data_promise = new Promise((resolve, reject) => {
        export_Model.find({}, function (err, data) {
            // console.log('-------------------------------export_to_webpage-------------------------------')
            data = data.map(d => d.json_data.content)
            resolve(data);
        });
    })

    return data_promise
}

// 这个函数用于点对点更新数据库，仅传入需要更新的数据
const update_mongodb = function (new_data_arr, update_Model) {

    // 更新数据库数据

    for (let i = 0; i < new_data_arr.length; i++) {
        // 在这里执行对目标数据库中数据更新的功能（这个支持一次更新多条数据）
        const update_data_unit = new_data_arr[i];

        const query_obj = {};
        query_obj["json_data.content.sheet_id"] = update_data_unit.sheet_id;

        const doc_update_obj = {};
        const set_obj = {};
        set_obj[`json_data.content.${update_data_unit.sheet_year}.sheets.0.data.${update_data_unit.row}.${update_data_unit.col}`] = update_data_unit.value;
        doc_update_obj["$set"] = set_obj;

        update_Model.updateMany(query_obj, doc_update_obj,
            function (err, result) {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log(result)
                }
            })
    }
}


// 这个函数用于点对点更新数据库，仅传入需要更新的一张表
const update_sheet_mongodb = function (json, update_Model) {

    // 更新数据库数据
    console.log('update_sheet_mongodb')

    const query_obj = {};
    query_obj["json_data.content.sheet_id"] = json.sheet_id;

    const doc_update_obj = {};
    const set_obj = {};
    set_obj[`json_data.content.${json.sheet_year}`] = json.json;
    doc_update_obj["$set"] = set_obj;

    update_Model.updateOne(query_obj, doc_update_obj,
        function (err, result) {
            if (err) {
                console.log(err)
            }
            else {
                console.log(result)
            }
        })
}

module.exports = {
    import_to_mongodb,
    export_to_webpage,
    connect_to_mongodb,
    update_mongodb,
    update_sheet_mongodb
}

