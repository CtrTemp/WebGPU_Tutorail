// import { connect_to_remote_mongodb, import_to_mongodb } from "./mongodb.js"


const {
    connect_to_remote_mongodb,
    import_to_mongodb,
} = require("./mongodb.js")


const lucky_json = require("../../client/src/store/demo/data/template_lucky.json")




const user_name = "module01_db_user";
const password = "1woshicui999";
const target_module = "module01"
const collection = "page01"

const Import_Module = connect_to_remote_mongodb(user_name, password, target_module, collection);



// 清空当前 collection 之后 再插入新文档
Import_Module.remove({}, () => {
    console.log("remove done");
    const insert_info = {
        info: {
            db_root: "module01",
            db_collection: "page01"
        },
        content: lucky_json
    };
    import_to_mongodb(insert_info, Import_Module);
    console.log("import lucky done");
});




