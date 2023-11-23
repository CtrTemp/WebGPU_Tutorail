

const gen_header = function () {
    let header_obj = {
        header_list: [],
        sheet_init_year: "2022",
        sheet_title: "运营车站进出站量查询统计表",
        sheet_width: 1200
    }
    const header_txt_list = ["运营线路", "运营车站", "时段", "进站量（人次）", "出站量（人次）", "票种"];
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
                    // flex: (j == 3 || j == 4) ? 0.5 : 1,
                    flex: 1,
                    color: "#000000"
                }
            })
        }
        ret_body_list.push(body_item);
    }

    return ret_body_list;
}

// const judge_equal = function (i1, i2) {
//     return ((i1[2] == i2[2]) && (i1[4] == i2[4]) && (i1[7] == i2[7]) && (i1[9] == i2[9]))
// }

const collect_station_list = function (list) {
    const len = list.length;
    let station_list = {};
    // if()
    station_list[list[1][4]] = {}
    for (let i = 1; i < len; i++) {

        if (!(list[i][2] in station_list)) {
            station_list[list[i][4]] = {};
        }
        if (!(list[i][7] in station_list)) {
            station_list[list[i][9]] = {};
        }

    }

    // console.log("done, station = ", Object.keys(station_list));
    return station_list;
}


const collect_line_list = function (list) {

    const len = list.length;
    let line_list = {};
    line_list[list[1][2]] = {}
    for (let i = 1; i < len; i++) {

        if (!(list[i][2] in line_list)) {
            line_list[list[i][2]] = {};
        }
        if (!(list[i][7] in line_list)) {
            line_list[list[i][7]] = {};
        }
    }
    // console.log("done, line = ", Object.keys(line_list));
    return line_list
}


const compute_entrance_exit = function (list, station, line_list, time_range) {
    const len = list.length;
    const ret_list = [];
    // 相同的站点和线路可以确定唯一的数据条目

    // 初始化数据条目
    for (let i = 0; i < line_list.length; i++) {
        const new_unit = [];
        new_unit.push(line_list[i]); // 线路名称
        new_unit.push(station); // 车站名称
        new_unit.push(time_range[0] + " ~ " + time_range[1]); // 时段
        new_unit.push(0); // 进站量
        new_unit.push(0); // 出站量
        new_unit.push("一卡通"); // 票种
        ret_list.push(new_unit);
    }

    // 进站量、出栈量统计
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < ret_list.length; j++) {
            // 进站站点和线路都相等，则数据条目进站量++
            if ((ret_list[j][0] == list[i][2]) && (ret_list[j][1] == list[i][4])) {
                ret_list[j][3] = ret_list[j][3] + 1;
            }
            // 出站站点和线路都相等，则数据条目出站量++
            if ((ret_list[j][0] == list[i][7]) && (ret_list[j][1] == list[i][9])) {
                ret_list[j][4] = ret_list[j][4] + 1;
            }
        }
    }

    // console.log("ret_list = ", ret_list);
    return ret_list;
}


const merge_list = function (filtered_list, filter) {
    console.log("start to merge_list", filtered_list.length);
    const merged_list = [];

    if (filtered_list.length <= 1) {
        return merged_list;
    }
    // 第一步先收集所有站点、所有线路
    let station_list = Object.keys(collect_station_list(filtered_list));
    let line_list = Object.keys(collect_line_list(filtered_list));

    // 第二步统计列表
    for (let i = 0; i < station_list.length; i++) {
        let entrance_exit_list_single_station = compute_entrance_exit(filtered_list, station_list[i], line_list, filter.time_range);
        for (let j = 0; j < entrance_exit_list_single_station.length; j++) {
            if (entrance_exit_list_single_station[j][3] == 0 && entrance_exit_list_single_station[j][4] == 0) continue;
            merged_list.push(entrance_exit_list_single_station[j]);
        }
    }
    // console.log("merged_list = ", merged_list);

    // const merged_list_return = []
    // for (let i = 0; i < merged_list.length; i++) {
    //     const unit = []
    //     unit.push(merged_list[i][0]);
    //     unit.push(merged_list[i][1]);
    //     unit.push(merged_list[i][2]);
    //     unit.push(merged_list[i][3]);
    //     unit.push(merged_list[i][4]);
    //     unit.push(merged_list[i][5]);
    //     merged_list_return.push(unit);
    // }

    // console.log(merged_list_return);

    return merged_list;
}


const generate_page_styled_json_M3P03 = function (filtered_list, filter) {
    let merged_list = merge_list(filtered_list, filter);
    // 生成表头、表身
    const page_styled_json = [
        {
            header: gen_header(),
            body: gen_body(merged_list)
        }
    ]

    console.log("page styled json = ", page_styled_json);

    return page_styled_json;
}

module.exports = {
    generate_page_styled_json_M3P03
}
