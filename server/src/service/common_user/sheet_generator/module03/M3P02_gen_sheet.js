

const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "站间OD量查询统计表",
        sheet_width: 1200
    }
    const header_txt_list = ["O运营车站", "D运营车站", "时段", "OD量（人次）"];
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

const gen_body = function (merged_list) {
    let ret_body_list = [];
    for (let i = 0; i < merged_list.length; i++) {
        let body_item = {
            id: i,
            unit: []
        }
        for (let j = 0; j < merged_list[i].length; j++) {
            body_item.unit.push({
                data: {
                    value: merged_list[i][j]
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

const collect_station_OD_pair = function (list) {
    const len = list.length;
    let station_list = {};
    const header = list[0];

    let header_index_O = 0;
    let header_index_D = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "进站车站名称") {
            header_index_O = i;
        }
        if (header[i] == "出站车站名称") {
            header_index_D = i;
        }
    }

    // if()
    let init_od_pair_str = list[1][header_index_O] + "-" + list[1][header_index_D];
    station_list[init_od_pair_str] = {};
    for (let i = 1; i < len; i++) {

        let od_pair_temp = list[i][header_index_O] + "-" + list[i][header_index_D];

        if (!(od_pair_temp in station_list)) {
            station_list[od_pair_temp] = {};
        }
    }

    // console.log("done, station = ", Object.keys(station_list));
    return station_list;
}

const compute_station_pair_item = function (list, station_pair, time_range) {
    const len = list.length;
    let ret_unit = [];
    // 相同的 O_station 以及 D_station 认定为同一数据条目

    const header = list[0];
    // 索引 OD
    let header_index_O = 0;
    let header_index_D = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "进站车站名称") {
            header_index_O = i;
        }
        if (header[i] == "出站车站名称") {
            header_index_D = i;
        }
    }


    // 初始化数据条目
    const O_station = station_pair.split("-")[0];
    const D_station = station_pair.split("-")[1];

    ret_unit.push(O_station); // O_station
    ret_unit.push(D_station); // D_station
    ret_unit.push(`${time_range[0]} ~ ${time_range[1]}`); // 时段
    ret_unit.push(0); // OD 量

    // 进站量、出栈量统计
    for (let i = 0; i < len; i++) {
        if ((O_station == list[i][header_index_O]) && (D_station == list[i][header_index_D])) {
            ret_unit[3] = ret_unit[3] + 1;
        }
    }

    // console.log("ret_list = ", ret_unit);
    return ret_unit;
}


const merge_list = function (filtered_list, filter) {
    console.log("start to merge_list", filtered_list.length);
    let merged_list = [];

    if (filtered_list.length <= 1) {
        return merged_list;
    }
    // 第一步先收集所有站点、所有线路
    let station_pair_list = Object.keys(collect_station_OD_pair(filtered_list));

    for (let i = 0; i < station_pair_list.length; i++) {
        const item = compute_station_pair_item(filtered_list, station_pair_list[i], filter.time_range);
        if (item[3] < 0) { continue; }
        merged_list.push(item);
    }


    merged_list = merged_list.sort((a, b) => {
        return b[3] - a[3];
    })
    // console.log("merged_list = ", merged_list);

    return merged_list;
}


const generate_page_styled_json_M3P02 = function (filtered_list, filter) {
    let merged_list = merge_list(filtered_list, filter);
    // 生成表头、表身
    const page_styled_json = [
        {
            header: gen_header(),
            body: gen_body(merged_list)
        }
    ]
    return page_styled_json;
}

module.exports = {
    generate_page_styled_json_M3P02
}
