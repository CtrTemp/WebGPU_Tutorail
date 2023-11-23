



const get_raw_arr_M3P12_ = function (raw_ptv_list, filter) {

    const len = raw_ptv_list.length;
    let filtered_arr = [];
    const filter_map = [1, 2, -1, -2, 3, 4, -3];
    for (let i = 1; i < len; i++) {
        let line_unit = []
        for (let j = 0; j < filter_map.length; j++) {
            let val_unit = "";
            if (filter_map[j] == -1) {
                val_unit = `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`;
            }
            if (filter_map[j] == -2) {
                val_unit = `${filter.time_range[0]}~${filter.time_range[1]}`;
            }
            if (filter_map[j] == -3) {
                val_unit = parseInt(raw_ptv_list[i][filter_map[j - 1]]) + parseInt(raw_ptv_list[i][filter_map[j - 2]]);
            }
            if (filter_map[j] >= 0) {
                val_unit = raw_ptv_list[i][filter_map[j]];
                if (Number(val_unit, 10)) {
                    val_unit = parseInt(val_unit);
                }
            }
            line_unit.push(val_unit);
        }
        filtered_arr.push(line_unit);
    }

    // console.log("filtered = ", filtered_arr);

    return filtered_arr;
}


const huanchengzhan_procss_file = function (ptv_list, filter) {
    const len = ptv_list.length;
    const header = ptv_list[0];
    let ret_arr = [];

    let header_index_exit_line = 0;  // 序号
    let header_index_exit_direction = 0;   // 车站
    let header_index_exit_station = 0;      // 线路
    let header_index_entrance_line = 0;     // 上车量
    let header_index_entrance_direction = 0;  // 进站量
    let header_index_entrance_station = 0;    // 下车量
    let header_index_transfer = 0;  // 出站量

    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "换出运营线路") {
            header_index_exit_line = i;
        }
        if (header[i] == "换出运营线路方向") {
            header_index_exit_direction = i;
        }
        if (header[i] == "换出运营车站") {
            header_index_exit_station = i;
        }
        if (header[i] == "换入运营线路") {
            header_index_entrance_line = i;
        }
        if (header[i] == "换入运营线路方向") {
            header_index_entrance_direction = i;
        }
        if (header[i] == "换入运营车站") {
            header_index_entrance_station = i;
        }
        if (header[i] == "换乘量（人次）") {
            header_index_transfer = i;
        }
    }

    for (let i = 1; i < len; i++) {
        let data_unit = {};
        const list_unit = ptv_list[i];
        data_unit['exitLine'] = list_unit[header_index_exit_line];
        data_unit['exitDirection'] = list_unit[header_index_exit_direction];
        data_unit['exitStation'] = list_unit[header_index_exit_station];
        data_unit['entranceLine'] = list_unit[header_index_entrance_line];
        data_unit['entranceDirection'] = list_unit[header_index_entrance_direction];
        data_unit['entranceStation'] = list_unit[header_index_entrance_station];
        data_unit['transferVolume'] = parseInt(list_unit[header_index_transfer]);
        data_unit["date"] = `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`;
        data_unit["time_range"] = `${filter.time_range[0]}~${filter.time_range[1]}`;
        // 
        ret_arr.push(data_unit);
    }
    // console.log("huanchengzhan_procssed_object = ", ret_arr);
    return ret_arr;
}

const qitazhibiao_process_file = function (ptv_list, filter) {
    const len = ptv_list.length;
    const header = ptv_list[0];
    let ret_obj = {};

    let header_index_line = 0;  // 运营线路
    let header_index_line_name = 0;   // 对应线路名称
    let header_index_RPK = 0;      // 客运周转量

    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "运营线路") {
            header_index_line = i;
        }
        if (header[i] == "对应线路名称") {
            header_index_line_name = i;
        }
        if (header[i] == "客运周转量（乘次公里）") {
            header_index_RPK = i;
        }
    }

    for (let i = 1; i < len; i++) {
        let data_unit = {};
        const list_unit = ptv_list[i];
        data_unit['line'] = list_unit[header_index_line];
        data_unit['lineName'] = list_unit[header_index_line_name];
        data_unit['RPK'] = parseFloat(list_unit[header_index_RPK]).toFixed(3);
        data_unit["date"] = `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`;
        data_unit["time_range"] = `${filter.time_range[0]}~${filter.time_range[1]}`;
        ret_obj[data_unit['line']] = data_unit; // 使用 线路标号 作为唯一标识符
    }
    // console.log("qitazhibiao_procss_object = ", ret_obj);
    return ret_obj;
}

const xianluduanmian_procss_file = function (ptv_list, filter) {
    const len = ptv_list.length;
    const header = ptv_list[0];
    let ret_obj = {};

    let header_index_line = 0;  // 运营线路
    let header_index_direction = 0;   // 方向
    let header_index_stationSequence = 0;      // 运营车站序号
    let header_index_station = 0;     // 运营车站
    let header_index_sectionFlow = 0;  // 断面客流

    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "运营线路") {
            header_index_line = i;
        }
        if (header[i] == "方向") {
            header_index_direction = i;
        }
        if (header[i] == "运营车站序号") {
            header_index_stationSequence = i;
        }
        if (header[i] == "运营车站") {
            header_index_station = i;
        }
        if (header[i] == "断面客流（人次）") {
            header_index_sectionFlow = i;
        }
    }


    for (let i = 1; i < len; i++) {
        let data_unit = {};
        const list_unit = ptv_list[i];
        data_unit['line'] = list_unit[header_index_line];
        data_unit['direction'] = list_unit[header_index_direction];
        data_unit['stationSequence'] = list_unit[header_index_stationSequence];
        data_unit['station'] = list_unit[header_index_station];
        data_unit['sectionFlow'] = parseInt(list_unit[header_index_sectionFlow]);
        data_unit["date"] = `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`;
        data_unit["time_range"] = `${filter.time_range[0]}~${filter.time_range[1]}`;
        // station 字段并不能唯一确定一个数据条目，但station字段+direction+line字段可以唯一确定
        ret_obj[data_unit['line'] + data_unit['direction'] + data_unit['station']] = data_unit;
    }
    // console.log("xianluduanmian_procss_object = ", ret_obj);
    return ret_obj;

}

const yunyingchezhan_procss_file = function (ptv_list, filter) {
    const len = ptv_list.length;
    const header = ptv_list[0];
    let ret_obj = {};

    let header_index_sequence = 0;  // 序号
    let header_index_station = 0;   // 车站
    let header_index_line = 0;      // 线路
    let header_index_getOn = 0;     // 上车量
    let header_index_incoming = 0;  // 进站量
    let header_index_getOff = 0;    // 下车量
    let header_index_outgoing = 0;  // 出站量

    for (let i = 0; i < header.length; i++) {
        // console.log(`header[${i}] = ${header[i]}`);
        if (header[i] == "序号") {
            header_index_sequence = i;
        }
        if (header[i] == "运营车站") {
            header_index_station = i;
        }
        if (header[i] == "运营线路") {
            header_index_line = i;
        }
        if (header[i] == "上车量（人次）") {
            header_index_getOn = i;
        }
        if (header[i] == "进站量（人次）") {
            header_index_incoming = i;
        }
        if (header[i] == "下车量（人次）") {
            header_index_getOff = i;
        }
        if (header[i] == "出站量（人次）") {
            header_index_outgoing = i;
        }
    }

    for (let i = 1; i < len; i++) {
        let data_unit = {};
        const list_unit = ptv_list[i];
        data_unit['sequence'] = list_unit[header_index_sequence];
        data_unit['station'] = list_unit[header_index_station];
        data_unit['line'] = list_unit[header_index_line];
        data_unit['getOn'] = parseInt(list_unit[header_index_getOn]);
        data_unit['incoming'] = parseInt(list_unit[header_index_incoming]);
        data_unit['getOff'] = parseInt(list_unit[header_index_getOff]);
        data_unit['outgoing'] = parseInt(list_unit[header_index_outgoing]);
        // 以下的换乘量是计算出的，等于上车量（客运量）+进站量
        data_unit['transfer'] = data_unit['getOn'] + data_unit['incoming'];
        data_unit["date"] = `${filter.date[0]}-${filter.date[1]}-${filter.date[2]}`;
        data_unit["time_range"] = `${filter.time_range[0]}~${filter.time_range[1]}`;
        // station 字段并不能唯一确定一个数据条目，但station字段+line字段可以唯一确定
        ret_obj[data_unit['station'] + "-" + data_unit['line']] = data_unit;
    }
    // console.log("yunyingchezhan_procssed_object = ", ret_obj);
    return ret_obj;
}

const process_single_ptv_raw_file = function (key, ptv_list, filter) {

    let ret_obj;
    switch (key) {
        case "huanchengzhan":
            ret_obj = huanchengzhan_procss_file(ptv_list, filter);
            break;
        case "qitazhibiao":
            ret_obj = qitazhibiao_process_file(ptv_list, filter);
            break;
        case "xianluduanmian":
            ret_obj = xianluduanmian_procss_file(ptv_list, filter);
            break;
        case "yunyingchezhan":
            ret_obj = yunyingchezhan_procss_file(ptv_list, filter);
            break;
        default:
            console.log("err: no such ptv file");
            ret_obj = {};
            break;
    }

    return ret_obj;
}

const get_raw_arr_M3P12 = function (raw_ptv_list, filter) {

    let ret_ptv_obj = {};
    const keys = Object.keys(raw_ptv_list);
    for (let i = 0; i < keys.length; i++) {
        ret_ptv_obj[keys[i]] = process_single_ptv_raw_file(keys[i], raw_ptv_list[keys[i]], filter);
    }
    const selected = new Set(filter.selected);
    const r = {};
    for (let i of selected) {
        r[i] = {
            '进站量': 0,
            '客运量': 0,
            '换乘量': 0,
        }
    }
    for (let i in ret_ptv_obj.yunyingchezhan) {
        const item = ret_ptv_obj.yunyingchezhan[i];
            const name = i.split('-')[0];
        if (selected.has(name)) {
            r[name]['进站量'] += item['incoming'];
            r[name]['客运量'] += item['getOn'];
        }
    }
    for (let i in r) {
        r[i]['换乘量'] = r[i]['客运量'] - r[i]['进站量'];
    }
    // console.log(filter.selected);
    // console.log(r);
    return r;
}

module.exports = {
    get_raw_arr_M3P12
}
