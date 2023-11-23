



// 运营车站选择
const filter_station = function (csv_data_list, line) {
    const filtered_list = [];
    const header = csv_data_list[0];
    // 记得先添加表头
    filtered_list.push(header);

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "运营车站") {
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

// 运营线路选择
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


const filter_time_range = function () { }



const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "车站进站客运量",
        sheet_width: 1500
    }
    const header_txt_list = ["运营车站", "运营线路", "时段", "进站量", "客运量"];
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


const gen_body = function (raw_list, time_range) {

    raw_list.shift();
    const index_map = [1, 2, -1, 4, 3];
    // 去掉第一行表头
    let ret_body_list = [];
    for (let i = 0; i < raw_list.length; i++) {
        let body_item = {
            id: i,
            unit: []
        }
        for (let j = 0; j < index_map.length; j++) {
            body_item.unit.push({
                data: {
                    value: index_map[j] == -1 ? `${time_range[0]}~${time_range[1]}` : raw_list[i][index_map[j]]
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


const generate_page_styled_json_M3P06 = function (raw_ptv_list, filter) {


    let filtered_list = raw_ptv_list;
    if (filter.station.active != "全体车站") {
        filtered_list = filter_station(filtered_list, filter.station.active);
    }
    if (filter.line.active != "全体线路") {
        filtered_list = filter_line(filtered_list, filter.line.active);
    }
    // filtered_list = filter_exit_line(filtered_list, "M2");


    let page_styled_json = [{
        header: gen_header(),
        body: gen_body(filtered_list, filter.time_range)
    }];

    // return {};
    return page_styled_json;
}



module.exports = {
    generate_page_styled_json_M3P06
}
