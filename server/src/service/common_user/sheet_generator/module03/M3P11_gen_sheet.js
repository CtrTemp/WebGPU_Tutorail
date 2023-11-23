

const { list_filter_M3P07, compute_list_M3P07 } = require("./M3P07_gen_sheet");



const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "线路运营其他客流指标表",
        sheet_width: 1500
    }
    const header_txt_list = ["指标", "查询值", "单位"];
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


const gen_body = function (raw_list, filter, val_set) {

    const index_set = [
        "日期",
        "时段",
        "运营线路",
        "运营里程",
        "客运量",
        "进站量",
        "客运强度", //
        "客运周转量", //
        "平均运距", //
    ];


    const unit_set = [
        "--",
        "--",
        "--",
        "km",
        "万人次",
        "万人次",
        "万人次/公里",
        "乘次公里",
        "公里/万人次"
    ];

    const body_set = [];
    body_set.push(index_set);
    body_set.push(val_set);
    body_set.push(unit_set);

    // 去掉第一行表头
    let ret_body_list = [];
    for (let i = 0; i < index_set.length; i++) {
        let body_item = {
            id: i,
            unit: []
        }
        for (let j = 0; j < body_set.length; j++) {
            let str_val = body_set[j][i];
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

// 获取所选线路 客运量 和 进站量
const get_line_mileage = function (person_kilometers_ptv_list, line_distance_list, raw_filter) {

    // console.log("distance list = ", line_distance_list);

    const line = raw_filter.line.active;

    // 周转量表 （作为线路名字和序号的对应表）
    let header_index_personKilo = 0;
    let header_index_line_seq_ptv = 0;
    let header_index_line_name_ptv = 0;

    const ptv_header = person_kilometers_ptv_list[0];

    // ptv列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (ptv_header[i] == "运营线路") {
            header_index_line_seq_ptv = i;
        }
        if (ptv_header[i] == "对应线路名称") {
            header_index_line_name_ptv = i;
        }
        if (ptv_header[i] == "客运周转量（乘次公里）") {
            header_index_personKilo = i;
        }
    }

    const distance_header = line_distance_list[0];
    let header_index_distance = 0;
    let header_index_line_name_distance = 0;

    // distance列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (distance_header[i] == "线路名称") {
            header_index_line_name_distance = i;
        }
        if (distance_header[i] == "线路长度") {
            header_index_distance = i;
        }
    }

    let line_name = ""
    let personKilo = 0; // 周转量
    // 第一步找到 线路标号 对应的 线路名称
    for (let i = 1; i < person_kilometers_ptv_list.length; i++) {
        if (person_kilometers_ptv_list[i][header_index_line_seq_ptv] == line) {
            line_name = person_kilometers_ptv_list[i][header_index_line_name_ptv];
            personKilo = person_kilometers_ptv_list[i][header_index_personKilo];
            break;
        }
    }

    let distance = 0;   // 线路长度
    for (let i = 1; i < line_distance_list.length; i++) {
        if (line_distance_list[i][header_index_line_name_distance] == line_name) {
            distance = line_distance_list[i][header_index_distance];
            break;
        }
    }

    // console.log("final line distance = ", distance);

    return distance;

}

const get_line_passenger_volume_entry_volume = function (operating_station_ptv_list, raw_filter) {
    const line = raw_filter.line.active;

    // 客运量表
    const filter_M3P07 = raw_filter;
    const filtered_list = list_filter_M3P07(operating_station_ptv_list, raw_filter);
    const computed_list = compute_list_M3P07(filtered_list, filter_M3P07);


    let passenger_volume = computed_list[0][3];
    let entry_volume = computed_list[0][2];
    // console.log("进站量：", entry_volume);
    // console.log("客运量：", passenger_volume);
    return [passenger_volume, entry_volume];
}

// 所选线路 客运强度 计算
const compute_transport_instensity = function (person_kilometers_ptv_list, operating_station_ptv_list, line_distance_list, raw_filter) {
    const line = raw_filter.line.active;

    // 客运量表
    const filter_M3P07 = raw_filter;
    const filtered_list = list_filter_M3P07(operating_station_ptv_list, raw_filter);
    const computed_list = compute_list_M3P07(filtered_list, filter_M3P07);

    // console.log("filtered_list = ", computed_list);

    // 周转量表 （作为线路名字和序号的对应表）
    let header_index_personKilo = 0;
    let header_index_line_seq_ptv = 0;
    let header_index_line_name_ptv = 0;

    const ptv_header = person_kilometers_ptv_list[0];

    // ptv列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (ptv_header[i] == "运营线路") {
            header_index_line_seq_ptv = i;
        }
        if (ptv_header[i] == "对应线路名称") {
            header_index_line_name_ptv = i;
        }
        if (ptv_header[i] == "客运周转量（乘次公里）") {
            header_index_personKilo = i;
        }
    }

    const distance_header = line_distance_list[0];
    let header_index_distance = 0;
    let header_index_line_name_distance = 0;

    // distance列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (distance_header[i] == "线路名称") {
            header_index_line_name_distance = i;
        }
        if (distance_header[i] == "线路长度") {
            header_index_distance = i;
        }
    }


    let line_name = ""
    let personKilo = 0; // 周转量
    // 第一步找到 线路标号 对应的 线路名称
    for (let i = 1; i < person_kilometers_ptv_list.length; i++) {
        if (person_kilometers_ptv_list[i][header_index_line_seq_ptv] == line) {
            line_name = person_kilometers_ptv_list[i][header_index_line_name_ptv];
            personKilo = person_kilometers_ptv_list[i][header_index_personKilo];
            break;
        }
    }

    let distance = 0;   // 线路长度
    for (let i = 1; i < line_distance_list.length; i++) {
        if (line_distance_list[i][header_index_line_name_distance] == line_name) {
            distance = line_distance_list[i][header_index_distance];
            break;
        }
    }

    let passenger_volume = computed_list[0][3];

    // console.log("ret val = ", line_name, parseFloat(personKilo), distance, passenger_volume);

    // 单位是 万人次/km 需要除以 10000
    const computed_val = (passenger_volume / distance / 10000).toFixed(3);

    return computed_val;
}


// 所选线路 客运周转量 获取
const get_passenger_person_kilometers = function (person_kilometers_ptv_list, raw_filter) {

    const line = raw_filter.line.active;
    // console.log("person_kilometers_ptv_list = ", person_kilometers_ptv_list);

    // 首先索引header    
    const header = person_kilometers_ptv_list[0];

    let header_index_personKilo = 0;
    let header_index_line = 0;
    for (let i = 0; i < header.length; i++) {
        if (header[i] == "运营线路") {
            header_index_line = i;
        }
        if (header[i] == "客运周转量（乘次公里）") {
            header_index_personKilo = i;
        }
    }

    let ret_val = "null";
    const len = person_kilometers_ptv_list.length;
    for (let i = 0; i < len; i++) {
        if (person_kilometers_ptv_list[i][header_index_line] == line) {
            ret_val = parseFloat(person_kilometers_ptv_list[i][header_index_personKilo]).toFixed(2);
        }
    }

    return ret_val;
}

// 所选线路 平均运距 计算
const compute_avg_distance = function (person_kilometers_ptv_list, operating_station_ptv_list, raw_filter) {
    const line = raw_filter.line.active;

    // 客运量表
    const filter_M3P07 = raw_filter;
    const filtered_list = list_filter_M3P07(operating_station_ptv_list, raw_filter);
    const computed_list = compute_list_M3P07(filtered_list, filter_M3P07);

    // 周转量表 （作为线路名字和序号的对应表）
    let header_index_personKilo = 0;
    let header_index_line_seq_ptv = 0;
    let header_index_line_name_ptv = 0;

    const ptv_header = person_kilometers_ptv_list[0];

    // ptv列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (ptv_header[i] == "运营线路") {
            header_index_line_seq_ptv = i;
        }
        if (ptv_header[i] == "对应线路名称") {
            header_index_line_name_ptv = i;
        }
        if (ptv_header[i] == "客运周转量（乘次公里）") {
            header_index_personKilo = i;
        }
    }

    let line_name = ""
    let personKilo = 0; // 周转量
    // 第一步找到 线路标号 对应的 线路名称
    for (let i = 1; i < person_kilometers_ptv_list.length; i++) {
        if (person_kilometers_ptv_list[i][header_index_line_seq_ptv] == line) {
            line_name = person_kilometers_ptv_list[i][header_index_line_name_ptv];
            personKilo = person_kilometers_ptv_list[i][header_index_personKilo];
            break;
        }
    }

    let passenger_volume = computed_list[0][3];

    const computed_val = (personKilo / passenger_volume).toFixed(3);

    return computed_val;
}


// 所选线路 负荷强度 计算
const compute_load_intensity = function (person_kilometers_ptv_list, line_distance_list, raw_filter) {
    const line = raw_filter.line.active;

    // 周转量表 （作为线路名字和序号的对应表）
    let header_index_personKilo = 0;
    let header_index_line_seq_ptv = 0;
    let header_index_line_name_ptv = 0;

    const ptv_header = person_kilometers_ptv_list[0];

    // ptv列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (ptv_header[i] == "运营线路") {
            header_index_line_seq_ptv = i;
        }
        if (ptv_header[i] == "对应线路名称") {
            header_index_line_name_ptv = i;
        }
        if (ptv_header[i] == "客运周转量（乘次公里）") {
            header_index_personKilo = i;
        }
    }

    const distance_header = line_distance_list[0];
    let header_index_distance = 0;
    let header_index_line_name_distance = 0;

    // distance列表表头查找
    for (let i = 0; i < ptv_header.length; i++) {
        if (distance_header[i] == "线路名称") {
            header_index_line_name_distance = i;
        }
        if (distance_header[i] == "线路长度") {
            header_index_distance = i;
        }
    }


    let line_name = ""
    let personKilo = 0; // 周转量
    // 第一步找到 线路标号 对应的 线路名称
    for (let i = 1; i < person_kilometers_ptv_list.length; i++) {
        if (person_kilometers_ptv_list[i][header_index_line_seq_ptv] == line) {
            line_name = person_kilometers_ptv_list[i][header_index_line_name_ptv];
            personKilo = person_kilometers_ptv_list[i][header_index_personKilo];
            break;
        }
    }

    let distance = 0;   // 线路长度
    for (let i = 1; i < line_distance_list.length; i++) {
        if (line_distance_list[i][header_index_line_name_distance] == line_name) {
            distance = line_distance_list[i][header_index_distance];
            break;
        }
    }

    const computed_val = (parseFloat(personKilo) / distance / 10000).toFixed(3);

    return computed_val;
}


const generate_page_styled_json_M3P11 = function (raw_ptv_list, filter, line_distance_list) {

    // console.log("line distance list = ", line_distance_list);

    const val_set = [
        `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`,
        `${filter.time_range[0]}~${filter.time_range[1]}`,
        `${filter.line.active}`,
        0,  // 运营里程
        0,  // 客运量
        0,  // 进站量
        0,  // 客运强度
        0,  // 客运周转量
        0   // 平均运距
    ];

    let filtered_list = raw_ptv_list;

    val_set[3] = get_line_mileage(raw_ptv_list["qitazhibiao"], line_distance_list, filter);

    let passenger_volume_AND_entry_volume = get_line_passenger_volume_entry_volume(raw_ptv_list["yunyingchezhan"], filter);
    val_set[4] = passenger_volume_AND_entry_volume[0];
    val_set[5] = passenger_volume_AND_entry_volume[1];


    val_set[6] = compute_transport_instensity(raw_ptv_list["qitazhibiao"], raw_ptv_list["yunyingchezhan"], line_distance_list, filter);
    val_set[7] = get_passenger_person_kilometers(raw_ptv_list["qitazhibiao"], filter);
    val_set[8] = compute_avg_distance(raw_ptv_list["qitazhibiao"], raw_ptv_list["yunyingchezhan"], filter);
    let page_styled_json = [{
        header: gen_header(),
        body: gen_body(filtered_list, filter, val_set)
    }];

    return page_styled_json;
}



module.exports = {
    generate_page_styled_json_M3P11
}
