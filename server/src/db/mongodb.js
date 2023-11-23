
const mongoose = require('mongoose')
const Schema = mongoose.Schema



// const connect_to_mongodb = function (url) {

//     mongoose.connect(url);


//     var db = mongoose.connection;

//     db.on('error', console.error.bind(console, 'connection error:'));
//     db.once('open', function () {

//     });

//     const Schema = mongoose.Schema
//     const jsonSchema = new Schema({
//         json_data: Object
//     });


//     let date = Date.now();

//     const import_export_Model = mongoose.model(date, jsonSchema, "test_sheets");

//     return import_export_Model

// }



const connect_to_remote_mongodb = function (user_name, password, module, collection) {

    const connect_url = `mongodb://${user_name}:${password}@43.143.168.177:29999/${module}`;

    console.log("connect_url = ", connect_url);

    const conn = mongoose.createConnection(connect_url);
    


    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function () {
        console.log("sss");
    });

    const Schema = mongoose.Schema
    const jsonSchema = new Schema({
        json_data: Object
    });


    let date = Date.now();

    // 如果这个collection不存在则创建它, 如果存在则链接到它
    const import_export_Model = conn.model(date, jsonSchema, collection);

    return import_export_Model
}


const import_to_mongodb = function (json_file, import_Model) {

    console.log("json to be import = ", json_file);
    // 在这里将使用 mongoess 的API将json_file导入到数据库中


    // 执行以下语句相当于在表下插入特定的对象
    import_Model.create({
        json_data: json_file
    }, err => {
        if (!err) {//如果没有报错，则执行下面的语句
            console.log("json file imported sucessfully");
        }
    })

}

const clear_one_mongodb_collection = function(Model){

    Model.deleteOne();

}

const export_to_webpage = function (socket, export_Model) {

    let ret_json = {}

    export_Model.findOne({}, function (err, data) {
        // console.log(data.json_data)
        // 这里返回整张表
        // 下一步是将得到的json数据返回给前端
        socket.sendText(JSON.stringify(data.json_data))

    });

    return ret_json;
}



module.exports = {
    connect_to_remote_mongodb,
    export_to_webpage,
    import_to_mongodb,
    clear_one_mongodb_collection,
}
