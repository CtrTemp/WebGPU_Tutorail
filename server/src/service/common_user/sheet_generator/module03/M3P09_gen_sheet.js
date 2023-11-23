



// 运营线路筛选
const filter_line = function (csv_data_list, line) {
    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "运营线路") {
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

// 运营线路方向筛选
const filter_direction = function (csv_data_list, direction) {

    let dir_char = ">";
    if (direction == "下行") {
        dir_char = "<";
    }

    const filtered_list = [];
    const header = csv_data_list[0];
    console.log("header = ", header);
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "方向") {
            header_index = i;
            break;
        }
    }

    // 第二步将符合条件的条目进行刷选
    const len = csv_data_list.length;
    for (let i = 1; i < len; i++) {
        if (csv_data_list[i][header_index] == dir_char) {
            filtered_list.push(csv_data_list[i]);
        }
    }

    console.log("filtered_list len = ", filtered_list.length);

    return filtered_list;
}


const filter_time_range = function () { }



const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "换乘站分项换乘量表",
        sheet_width: 1500
    }
    const header_txt_list = ["日期", "时段", "运营线路", "运营方向", "运营车站序号", "运营车站名", "断面客流（人次）"];
    for (let i = 0; i < header_txt_list.length; i++) {
        let header_unit = {
            type: "item",
            index: i,
            value: {
                icon: "",
                txt: header_txt_list[i]
            },
            style: {
                flex: 1
            },
            sort: false
        }
        header_obj.header_list.push(header_unit);
    }

    return header_obj;
}


const gen_body = function (raw_list, filter) {

    raw_list.shift();
    const index_map = [-2, -1, 0, 1, 2, 3, 4];
    // 去掉第一行表头
    let ret_body_list = [];
    for (let i = 0; i < raw_list.length; i++) {
        let body_item = {
            id: i,
            unit: []
        }
        for (let j = 0; j < index_map.length; j++) {
            let str_val = ""
            if (index_map[j] == -2) {
                str_val = `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`
            }
            else if (index_map[j] == -1) {
                str_val = `${filter.time_range[0]}~${filter.time_range[1]}`
            }
            else {
                str_val = raw_list[i][index_map[j]]
            }
            body_item.unit.push({
                data: {
                    value: str_val
                },
                type: "string",
                style: {
                    flex: 1,
                    color: "#000000"
                }
            })
        }
        ret_body_list.push(body_item);
    }

    return ret_body_list;
}


const list_filter_M3P09 = function (raw_ptv_list, filter) {

    let filtered_list = raw_ptv_list;
    if (filter.line.active != "全体线路") {
        filtered_list = filter_line(filtered_list, filter.line.active);
    }
    if (filter.direction.active != "上/下行") {
        filtered_list = filter_direction(filtered_list, filter.direction.active);
    }

    return filtered_list;
}

const generate_page_styled_json_M3P09 = function (raw_ptv_list, filter) {

    let filtered_list = list_filter_M3P09(raw_ptv_list, filter);

    let page_styled_json = [{
        header: gen_header(),
        body: gen_body(filtered_list, filter)
    }];

    return page_styled_json;
}



module.exports = {
    list_filter_M3P09,
    generate_page_styled_json_M3P09
}
