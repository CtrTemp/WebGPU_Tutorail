

const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "客流平均在站时间查询统计表",
        sheet_width: 1200
    }
    const header_txt_list = ["O运营车站", "D运营车站", "时段", "平均在站时间（分钟）"];
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
                    value: j == 3 ? merged_list[i][j].toFixed(2) : merged_list[i][j]
                },
                type: j == 3 ? "num" : "string",
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

const gen_body_all = function (filtered_list, time_range) {

    let avg_time_sum = 0;
    for (let i = 1; i < filtered_list.length; i++) {
        avg_time_sum += compute_inline_time(filtered_list[i][5], filtered_list[i][10]);

    }
    const avg_time = avg_time_sum / (filtered_list.length - 1);

    const val_list = ["全体车站", "全体车站", `${time_range[0]}~${time_range[1]}`, avg_time]

    let ret_body_list = [];
    let body_item = {
        id: 0,
        unit: []
    }
    for (let j = 0; j < val_list.length; j++) {
        body_item.unit.push({
            data: {
                value: j == 3 ? val_list[j].toFixed(2) : val_list[j]
            },
            type: j == 3 ? "num" : "string",
            style: {
                flex: 1,
                color: "#000000"
            }
        })
    }
    ret_body_list.push(body_item);

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


const time_str_to_min_float = function (time_str) {
    const hour = parseFloat(time_str.substr(0, 2));
    const min = parseFloat(time_str.substr(2, 2));
    const second = parseFloat(time_str.substr(4, 2));
    const global_min = hour * 60 + min + second / 60;


    return global_min;
}

const compute_inline_time = function (str1, str2) {
    const entrance_time_str = (str1.substr(str1.length - 6, str1.length));
    const exit_time_str = (str2.substr(str2.length - 6, str2.length));

    const entrance_time = time_str_to_min_float(entrance_time_str);
    const exit_time = time_str_to_min_float(exit_time_str);

    // console.log(entrance_time, exit_time);

    return exit_time - entrance_time;
}

const compute_station_pair_item = function (list, station_pair, time_range) {
    const len = list.length;
    let ret_unit = [];
    // 相同的 O_station 以及 D_station 认定为同一数据条目

    const header = list[0];
    // 索引 OD
    let header_index_O = 0;
    let header_index_D = 0;
    let header_index_entrance_time = 0;
    let header_index_exit_time = 0;
    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "进站车站名称") {
            header_index_O = i;
        }
        if (header[i] == "出站车站名称") {
            header_index_D = i;
        }
        if (header[i] == "进站时间") {
            header_index_entrance_time = i;
        }
        if (header[i] == "出站时间") {
            header_index_exit_time = i;
        }
    }

    // 初始化数据条目
    const O_station = station_pair.split("-")[0];
    const D_station = station_pair.split("-")[1];

    ret_unit.push(O_station); // O_station
    ret_unit.push(D_station); // D_station
    ret_unit.push(`${time_range[0]} ~ ${time_range[1]}`); // 时段
    ret_unit.push(0); // 平均在站时间


    let counter = 0;
    // 进站量、出栈量统计
    for (let i = 0; i < len; i++) {
        if ((O_station == list[i][header_index_O]) && (D_station == list[i][header_index_D])) {
            let time_1 = list[i][header_index_entrance_time];
            let time_2 = list[i][header_index_exit_time];
            ret_unit[3] = ret_unit[3] + compute_inline_time(time_1, time_2);
            counter++;
        }
    }
    ret_unit[3] /= counter;
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

    // compute_station_pair_item(filtered_list, station_pair_list[0]);

    // const str1 = "20220911073521";
    // const str2 = "20220911092101";
    // compute_inline_time(str1, str2);

    for (let i = 0; i < station_pair_list.length; i++) {
        const item = compute_station_pair_item(filtered_list, station_pair_list[i], filter.time_range);
        // 防止在站时间小于0
        if (item[3] < 0) { continue; }
        merged_list.push(item);
    }


    merged_list = merged_list.sort((a, b) => {
        return b[3] - a[3];
    })

    return merged_list;
}


const generate_page_styled_json_M3P05 = function (filtered_list, filter) {


    if (filter.O_station[0] == "全体车站" && filter.D_station[0] == "全体车站") {
        return [
            {
                header: gen_header(),
                body: gen_body_all(filtered_list, filter.time_range)
            }
        ]
    }

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
    generate_page_styled_json_M3P05
}
