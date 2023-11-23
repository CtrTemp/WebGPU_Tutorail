


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

const get_raw_arr_M3P14 = function (raw_ptv_list, filter) {
    let ret_ptv_obj = {};
    const keys = Object.keys(raw_ptv_list);
    for (let i = 0; i < keys.length; i++) {
        ret_ptv_obj[keys[i]] = process_single_ptv_raw_file(keys[i], raw_ptv_list[keys[i]], filter);
    }
    const selected = filter.selected;
    const segmentDict = {};
    let lastName = 0, lastValue = 0;
    let lastDir = null;
    let lastLine = null;
    for (let i in ret_ptv_obj.xianluduanmian) {
        const [_, __, line, dir, name] = i.match(/((.*)?([\>\<])(.*))/);
        if (line === lastLine && dir === lastDir) {
            segmentDict[`${line}-${lastName}-${name}`] = lastValue;
        }
        lastName = name;
        lastValue = ret_ptv_obj.xianluduanmian[i].sectionFlow;
        lastDir = dir;
        lastLine = line;
    }
    //断面流量
    function get_dmll(line, st, ed) {
        return segmentDict[`${line}-${st}-${ed}`];
    }
    //上车下车量
    function get_scxcl(line, sp) {
        return ret_ptv_obj.yunyingchezhan[`${sp}-${line}`];
    }
    const ret = [];
    for (let i of selected) {
        const lengths = i.lengths;
        const stoppoints = i.stoppoints;
        const line = i.line;
        const total_length = lengths.reduce((a, b) => a + b, 0);
        let r = {};
        let orderMax = 0, reverseMax = 0;
        let zhouzhuan = [0, 0];
        let keyun = [0, 0];
        for (let j = 1; j < stoppoints.length; ++j) {
            orderMax = Math.max(orderMax, get_dmll(line, stoppoints[j - 1], stoppoints[j]));
            reverseMax = Math.max(reverseMax, get_dmll(line, stoppoints[j], stoppoints[j - 1]));
            zhouzhuan[0] += get_dmll(line, stoppoints[j], stoppoints[j - 1]) * lengths[j - 1];
            zhouzhuan[1] += get_dmll(line, stoppoints[j - 1], stoppoints[j]) * lengths[j - 1];
        }
        keyun[0] += get_dmll(line, stoppoints[0], stoppoints[1]);
        keyun[1] += get_dmll(line, stoppoints[stoppoints.length - 1], stoppoints[stoppoints.length - 2]);
        for (let j = 1; j < stoppoints.length - 1; ++j) {
            const r = get_scxcl(line, stoppoints[j]).getOn - get_scxcl(line, stoppoints[j]).getOff;
            keyun[0] += r;
            keyun[1] += r;
        }
        ret.push({
            from: stoppoints[0],
            to: stoppoints[stoppoints.length - 1],
            line: line,
            '不均衡系数': 2 * Math.max(orderMax, reverseMax) / (orderMax + reverseMax),
            '客运周转量': zhouzhuan[0],
            '客运量': keyun[0],
            '平均运距': zhouzhuan[0] / keyun[0],
            '客运强度': keyun[0] / total_length,
            '负荷强度': zhouzhuan[0] / total_length,
        })
        ret.push({
            from: stoppoints[stoppoints.length - 1],
            to: stoppoints[0],
            line: line,
            '不均衡系数': 2 * Math.max(orderMax, reverseMax) / (orderMax + reverseMax),
            '客运周转量': zhouzhuan[1],
            '客运量': keyun[1],
            '平均运距': zhouzhuan[1] / keyun[1],
            '客运强度': keyun[1] / total_length,
            '负荷强度': zhouzhuan[1] / total_length,
        })
    }
    // console.log(ret);
    return ret;
    // return [];
    // return ret_ptv_obj;
}

module.exports = {
    get_raw_arr_M3P14
}
