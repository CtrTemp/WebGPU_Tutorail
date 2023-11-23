


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

    return filtered_list;
}


const filter_time_range = function () { }


const collect_line_list = function (list) {

    const len = list.length;
    let line_list = {};

    const header = list[0];

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "运营线路") {
            header_index = i;
            break;
        }
    }

    line_list[list[1][header_index]] = {}
    for (let i = 1; i < len; i++) {

        if (!(list[i][header_index] in line_list)) {
            line_list[list[i][header_index]] = {};
        }
    }
    // console.log("done, line = ", Object.keys(line_list));
    return line_list
}


const compute_line_item_para = function (line, list, time_range) {
    const header = list[0];

    // 第一步确定当前要查找的项在表头中的位序
    let header_index = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "运营线路") {
            header_index = i;
            break;
        }
    }
    let header_index_entrance = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "进站量（人次）") {
            header_index_entrance = i;
            break;
        }
    }
    let header_index_passenger = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "上车量（人次）") {
            header_index_passenger = i;
            break;
        }
    }

    let len = list.length;
    let line_unit = [];
    line_unit.push(line); // 运营线路
    line_unit.push(`${time_range[0]}~${time_range[1]}`); // 时段
    line_unit.push(0); // 进站量
    line_unit.push(0); // 客运量
    line_unit.push(0); // 换乘量
    for (let i = 1; i < len; i++) {
        if (list[i][header_index] == line) {
            line_unit[2] += parseInt(list[i][header_index_entrance]);
            line_unit[3] += parseInt(list[i][header_index_passenger]);
        }
    }

    line_unit[4] += line_unit[2];
    line_unit[4] += line_unit[3];

    // console.log("computed unit = ", line_unit);
    return line_unit;
}

const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "线路进站客运量",
        sheet_width: 1500
    }
    const header_txt_list = ["运营线路", "时段", "进站量", "客运量", "换乘量"];
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


const gen_body = function (computed_list) {

    const index_map = [0, 1, 2, 3, 4];
    // 去掉第一行表头
    let ret_body_list = [];
    for (let i = 0; i < computed_list.length; i++) {
        let body_item = {
            id: i,
            unit: []
        }
        for (let j = 0; j < index_map.length; j++) {
            body_item.unit.push({
                data: {
                    value: computed_list[i][index_map[j]]
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

const list_filter_M3P07 = function (raw_ptv_list, filter) {

    let filtered_list = raw_ptv_list;
    if (filter.line.active != "全体线路") {
        filtered_list = filter_line(filtered_list, filter.line.active);
    }

    return filtered_list;
}

const compute_list_M3P07 = function (filtered_list, filter) {

    const line_name_list = Object.keys(collect_line_list(filtered_list));

    let computed_list = [];
    for (let i = 0; i < line_name_list.length; i++) {
        computed_list.push(compute_line_item_para(line_name_list[i], filtered_list, filter.time_range));
    }
    return computed_list;

}

const generate_page_styled_json_M3P07 = function (raw_ptv_list, filter) {

    let filtered_list = list_filter_M3P07(raw_ptv_list, filter);

    let computed_list = compute_list_M3P07(filtered_list, filter);

    // console.log("computed_list = ", computed_list);

    let page_styled_json = [{
        header: gen_header(),
        body: gen_body(computed_list)
    }];

    // return {};
    return page_styled_json;
}



module.exports = {
    list_filter_M3P07,
    compute_list_M3P07,
    generate_page_styled_json_M3P07
}
