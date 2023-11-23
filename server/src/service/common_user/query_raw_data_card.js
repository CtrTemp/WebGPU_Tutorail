


const fs = require("fs")
// const csv = require("csvtojson")
const { generate_page_styled_json_M3P02 } = require("./sheet_generator/module03/M3P02_gen_sheet");
const { generate_page_styled_json_M3P03 } = require("./sheet_generator/module03/M3P03_gen_sheet");
const { generate_page_styled_json_M3P04 } = require("./sheet_generator/module03/M3P04_gen_sheet");
const { generate_page_styled_json_M3P05 } = require("./sheet_generator/module03/M3P05_gen_sheet");

// 进站线路filter
const filter_entrance_line = function (csv_data_list, line) {

    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "进站线路名称") {
            header_index = i;
            break;
        }
    }
    // 第二步将符合条件的条目进行刷选
    const len = csv_data_list.length;
    for (let i = 1; i < len; i++) {
        if (csv_data_list[i][header_index] == line) {
            filtered_list.push(csv_data_list[i]);
        }
    }

    console.log("filtered_list len = ", filtered_list.length);

    return filtered_list;
}


// 出站线路filter
const filter_exit_line = function (csv_data_list, line) {

    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "出站线路名称") {
            header_index = i;
            break;
        }
    }
    // 第二步将符合条件的条目进行刷选
    const len = csv_data_list.length;
    for (let i = 1; i < len; i++) {
        if (csv_data_list[i][header_index] == line) {
            filtered_list.push(csv_data_list[i]);
        }
    }

    console.log("filtered_list len = ", filtered_list.length);

    return filtered_list;
}

// 进/出站车站选择
const filter_station = function (csv_data_list, station) {
    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index_entrance = 0;
    let header_index_exit = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "进站车站名称") {
            header_index_entrance = i;
        }
        if (header[i] == "出站车站名称") {
            header_index_exit = i;
        }
    }

    // 第二步将符合条件的条目进行刷选
    const len = csv_data_list.length;
    for (let i = 1; i < len; i++) {
        if ((csv_data_list[i][header_index_entrance] == station) || (csv_data_list[i][header_index_exit] == station)) {
            filtered_list.push(csv_data_list[i]);
        }
    }

    console.log("filtered_list len = ", filtered_list.length);

    return filtered_list;
}


// 进站车站选择
const filter_station_O = function (csv_data_list, station) {
    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index_entrance = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "进站车站名称") {
            header_index_entrance = i;
        }
    }

    // 第二步将符合条件的条目进行刷选
    const len = csv_data_list.length;
    for (let i = 1; i < len; i++) {
        if (csv_data_list[i][header_index_entrance] == station) {
            filtered_list.push(csv_data_list[i]);
        }
    }

    console.log("filtered_list len = ", filtered_list.length);

    return filtered_list;
}



// 出站车站选择
const filter_station_D = function (csv_data_list, station) {
    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index_exit = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "出站车站名称") {
            header_index_exit = i;
        }
    }

    // 第二步将符合条件的条目进行刷选
    const len = csv_data_list.length;
    for (let i = 1; i < len; i++) {
        if (csv_data_list[i][header_index_exit] == station) {
            filtered_list.push(csv_data_list[i]);
        }
    }

    console.log("filtered_list len = ", filtered_list.length);

    return filtered_list;
}



// 将原始刷卡数据中的时间字符串 转换成 以分钟为单位的数字
const raw_time_str_to_minutes = function (date_time_str) {
    if (!date_time_str || date_time_str.length != 14) {
        return 0;
    }
    // 先取得后六位
    let time_str = date_time_str.substr(date_time_str.length - 6, 6);
    // console.log(time_str);
    let hour = parseInt(time_str.substr(0, 2));
    let min = parseInt(time_str.substr(2, 2));
    // let second = time_str.substr(4, 2);
    // console.log("hour = ", hour, "min = ", min);
    return min + hour * 60
}
// 将从filter传入的时间字符串 转换成 以分钟为单位的数字
const filter_time_range_str_to_minutes = function (time_str) {
    let hour = parseInt(time_str.split(":")[0]);
    let min = parseInt(time_str.split(":")[1]);
    // console.log("hour = ", hour, "min = ", min);
    return min + hour * 60
}

const time_range_filter = function (csv_data_list, time_range) {
    // csv_data_list
    const entracne_time_filter = filter_time_range_str_to_minutes(time_range[0]);
    const exit_time_filter = filter_time_range_str_to_minutes(time_range[1]);

    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index_entrance_time = 0;
    let header_index_exit_time = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "进站时间") {
            header_index_entrance_time = i;
        }
        if (header[i] == "出站时间") {
            header_index_exit_time = i;
        }
    }

    const len = csv_data_list.length;
    for (let i = 0; i < len; i++) {
        const entrance_time_minutes = raw_time_str_to_minutes(csv_data_list[i][header_index_entrance_time]);
        const exit_time_minutes = raw_time_str_to_minutes(csv_data_list[i][header_index_exit_time]);
        if (entrance_time_minutes >= entracne_time_filter && exit_time_minutes < exit_time_filter) {
            filtered_list.push(csv_data_list[i]);
        }
    }
    // raw_time_str_to_minutes(csv_data_list[1][header_index_entrance_time]);
    // raw_time_str_to_minutes(csv_data_list[2][header_index_entrance_time]);

    // filter_time_range_str_to_minutes(time_range[0]);
    // filter_time_range_str_to_minutes(time_range[1]);


    return filtered_list;
}

const query_card = function (json_pack) {
    const root_dir = "./src/gis_data/shuakashuju/";
    const date = `${json_pack.filter.date[0]}-${json_pack.filter.date[1]}-${json_pack.filter.date[2]}`;
    const file_dir = root_dir + date + "/metro.csv";
    console.log("read raw card data file_dir = ", file_dir);
    // 判断路径中文件是否存在，如果不存在直接返回


    let ret_promise = new Promise((resolve, reject) => {
        fs.access(file_dir, fs.constants.F_OK, (err) => {
            if (err) {
                const ret_json_pack = {
                    cmd: "query_card_return_no_such_file",
                };
                resolve(ret_json_pack);
                return ret_promise;
            }
            else {
                // src/gis_data/shuakashuju/2022-03-09/metro.csv
                const csv_data = fs.readFileSync(file_dir);
                const raw_metro_card_list = new TextDecoder('utf-8').decode(csv_data).split('\r\n');
                console.log("length of this raw list = ", raw_metro_card_list.length);
                const len = raw_metro_card_list.length;
                for (let i = 0; i < len; i++) {
                    raw_metro_card_list[i] = raw_metro_card_list[i].split(',');
                }

                let filtered_list = raw_metro_card_list;
                let page_styled_json = {};
                const ret_json_pack = {
                    cmd: "query_card_return",
                    index: "",
                    page_styled_json: {}
                };

                switch (json_pack.index) {

                    case "M3P02":
                        // O station filter
                        if (json_pack.filter.O_station.active != "全体车站") {
                            filtered_list = filter_station_O(filtered_list, json_pack.filter.O_station.active)
                        }
                        // D station filter
                        if (json_pack.filter.D_station.active != "全体车站") {
                            filtered_list = filter_station_D(filtered_list, json_pack.filter.D_station.active)
                        }
                        filtered_list = time_range_filter(filtered_list, json_pack.filter.time_range);

                        page_styled_json = generate_page_styled_json_M3P02(filtered_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P02";
                        break;

                    case "M3P03":
                        if (json_pack.filter.line.active != "全体线路") {
                            filtered_list = filter_entrance_line(filtered_list, json_pack.filter.line.active);
                            filtered_list = filter_exit_line(filtered_list, json_pack.filter.line.active);
                        }
                        if (json_pack.filter.station.active != "全体车站") {
                            filtered_list = filter_station(filtered_list, json_pack.filter.station.active)
                        }
                        filtered_list = time_range_filter(filtered_list, json_pack.filter.time_range);

                        page_styled_json = generate_page_styled_json_M3P03(filtered_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P03";
                        break;
                    case "M3P04":
                        // O station filter
                        if (json_pack.filter.O_station.active != "全体车站") {
                            filtered_list = filter_station_O(filtered_list, json_pack.filter.O_station.active)
                        }
                        // D station filter
                        if (json_pack.filter.D_station.active != "全体车站") {
                            filtered_list = filter_station_D(filtered_list, json_pack.filter.D_station.active)
                        }
                        filtered_list = time_range_filter(filtered_list, json_pack.filter.time_range);

                        page_styled_json = generate_page_styled_json_M3P04(filtered_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P04";
                        break;

                    case "M3P05":
                        // O station filter
                        if (json_pack.filter.O_station.active != "全体车站") {
                            filtered_list = filter_station_O(filtered_list, json_pack.filter.O_station.active)
                        }
                        // D station filter
                        if (json_pack.filter.D_station.active != "全体车站") {
                            filtered_list = filter_station_D(filtered_list, json_pack.filter.D_station.active)
                        }
                        filtered_list = time_range_filter(filtered_list, json_pack.filter.time_range);

                        page_styled_json = generate_page_styled_json_M3P05(filtered_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P05";
                        break;


                    default:
                        console.log("query raw data card failed : no such page's file");
                }


                resolve(ret_json_pack);

            }
            // console.log(`${file} ${err ? '不存在' : '存在'}`);
        });
    })








    // let ret_promise = new Promise((resolve, reject) => {


    // });






    return ret_promise;
}



module.exports = {
    query_card
}
