
const fs = require("fs")
const xlsx = require("xlsx")

const { generate_page_styled_json_M3P06 } = require("./sheet_generator/module03/M3P06_gen_sheet");
const { generate_page_styled_json_M3P07 } = require("./sheet_generator/module03/M3P07_gen_sheet");
const { generate_page_styled_json_M3P08 } = require("./sheet_generator/module03/M3P08_gen_sheet");
const { generate_page_styled_json_M3P09 } = require("./sheet_generator/module03/M3P09_gen_sheet");
const { generate_page_styled_json_M3P10 } = require("./sheet_generator/module03/M3P10_gen_sheet");
const { generate_page_styled_json_M3P11 } = require("./sheet_generator/module03/M3P11_gen_sheet");
const { get_raw_arr_M3P12 } = require("./sheet_generator/module03/M3P12_get_raw_arr");
const { get_raw_arr_M3P14 } = require("./sheet_generator/module03/M3P14_get_raw_arr");


const query_ptv = function (json_pack) {

    const ptv_root_dir = "./src/gis_data/ptv";

    const date_filter = json_pack.filter.date;
    const time_filter = json_pack.filter.time_range;

    let start_time_h = time_filter[0].split(":")[0];
    let start_time_m = time_filter[0].split(":")[1];
    if (start_time_h.length == 1) start_time_h = "0" + start_time_h;
    if (start_time_m.length == 1) start_time_m = "0" + start_time_m;

    let end_time_h = time_filter[1].split(":")[0];
    let end_time_m = time_filter[1].split(":")[1];
    if (end_time_h.length == 1) end_time_h = "0" + end_time_h;
    if (end_time_m.length == 1) end_time_m = "0" + end_time_m;

    const date_str = `${date_filter[0]}-${date_filter[1]}-${date_filter[2]}`;
    const time_str = `${start_time_h + start_time_m}-${end_time_h + end_time_m}`;
    const file_str = json_pack.filter.file;


    // const file_path = ptv_root_dir + `/${json_pack.date}T${json_pack.time}/${json_pack.file}`;
    const file_path = ptv_root_dir + `/${date_str}T${time_str}/${file_str}`;

    console.log("ptv file dir = ", file_path);


    let ret_promise = new Promise((resolve, reject) => {

        fs.access(file_path, fs.constants.F_OK, (err) => {
            if (err) {
                const ret_json_pack = {
                    cmd: "query_ptv_return_no_such_file",
                };
                resolve(ret_json_pack);
                return ret_promise;
            }
            else {
                const workBook = xlsx.readFile(file_path);
                let sheet = workBook.Sheets[workBook.SheetNames[0]]
                // console.log(workBook);
                const raw_ptv_list = xlsx.utils.sheet_to_csv(sheet).split('\n');
                const len = raw_ptv_list.length;
                for (let i = 0; i < len; i++) {
                    raw_ptv_list[i] = raw_ptv_list[i].split(",");
                }
                // 第一行是表名，需要去除
                raw_ptv_list.shift();
                let page_styled_json = {};
                const ret_json_pack = {
                    cmd: "query_ptv_return",
                    index: "",
                    page_styled_json: {},
                    ori_arr: []
                };

                switch (json_pack.index) {
                    case "M3P06":
                        page_styled_json = generate_page_styled_json_M3P06(raw_ptv_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P06";
                        break;
                    case "M3P07":
                        page_styled_json = generate_page_styled_json_M3P07(raw_ptv_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P07";
                        break;

                    case "M3P08":
                        page_styled_json = generate_page_styled_json_M3P08(raw_ptv_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P08";
                        break;

                    case "M3P09":
                        page_styled_json = generate_page_styled_json_M3P09(raw_ptv_list, json_pack.filter);
                        ret_json_pack.page_styled_json = page_styled_json;
                        ret_json_pack.index = "M3P09";
                        break;
                    case "M3P12":
                        ret_json_pack.ori_arr = get_raw_arr_M3P12(raw_ptv_list, json_pack.filter);
                        ret_json_pack.index = "M3P12";
                        break;
                    case "M3P13":
                        ret_json_pack.ori_arr = get_raw_arr_M3P13(raw_ptv_list, json_pack.filter);
                        ret_json_pack.index = "M3P13";
                        break;
                    case "M3P14":
                        ret_json_pack.ori_arr = get_raw_arr_M3P14(raw_ptv_list, json_pack.filter);
                        ret_json_pack.index = "M3P14";
                        break;
                    default:
                        console.log("query raw data ptv filed : no such page's file");
                        break;
                }

                resolve(ret_json_pack);

            }
        })

    });

    return ret_promise;

}


const query_multi_ptv = function (json_pack) {

    const ptv_root_dir = "./src/gis_data/ptv";

    const date_filter = json_pack.filter.date;
    const time_filter = json_pack.filter.time_range;

    let start_time_h = time_filter[0].split(":")[0];
    let start_time_m = time_filter[0].split(":")[1];
    if (start_time_h.length == 1) start_time_h = "0" + start_time_h;
    if (start_time_m.length == 1) start_time_m = "0" + start_time_m;

    let end_time_h = time_filter[1].split(":")[0];
    let end_time_m = time_filter[1].split(":")[1];
    if (end_time_h.length == 1) end_time_h = "0" + end_time_h;
    if (end_time_m.length == 1) end_time_m = "0" + end_time_m;

    const date_str = `${date_filter[0]}-${date_filter[1]}-${date_filter[2]}`;
    const time_str = `${start_time_h + start_time_m}-${end_time_h + end_time_m}`;



    // const file_path = ptv_root_dir + `/${json_pack.date}T${json_pack.time}/${json_pack.file}`;
    const file_path_list = []

    for (let i = 0; i < json_pack.filter.file_list.length; i++) {
        const file_str = json_pack.filter.file_list[i];
        const file_path_temp = ptv_root_dir + `/${date_str}T${time_str}/${file_str}.xlsx`;
        file_path_list.push(file_path_temp);
    }

    // console.log("ptv files dir = ", file_path_list);


    let ret_promise = new Promise((resolve, reject) => {


        for (let i = 0; i < file_path_list.length; i++) {
            fs.access(file_path_list[i], fs.constants.F_OK, (err) => {
                if (err) {
                    if (err) {
                        const ret_json_pack = {
                            cmd: "query_ptv_return_no_such_file",
                        };
                        resolve(ret_json_pack);
                        return ret_promise;
                    }
                }
            })
        }


        const raw_ptv_set = {};
        for (let i = 0; i < file_path_list.length; i++) {
            const file_path = file_path_list[i];
            const workBook = xlsx.readFile(file_path);
            let sheet = workBook.Sheets[workBook.SheetNames[0]]
            // console.log(workBook);
            const single_ptv_list = xlsx.utils.sheet_to_csv(sheet).split('\n');
            const len = single_ptv_list.length;
            for (let i = 0; i < len; i++) {
                single_ptv_list[i] = single_ptv_list[i].split(",");
            }
            // 第一行是表名，需要去除
            single_ptv_list.shift();

            const file_name = json_pack.filter.file_list[i];

            raw_ptv_set[file_name] = single_ptv_list;
        }


        const ret_json_pack = {
            cmd: "query_multi_ptv_return",
            index: "",
            page_styled_json: {},
            ptv_obj: {}
        };

        switch (json_pack.index) {
            case "M3P10":
                // console.log("10Return");
                ret_json_pack.page_styled_json = generate_page_styled_json_M3P10(raw_ptv_set, json_pack.filter, json_pack.line_distance);
                ret_json_pack.index = "M3P10";
                break;
            case "M3P11":
                ret_json_pack.page_styled_json = generate_page_styled_json_M3P11(raw_ptv_set, json_pack.filter, json_pack.line_distance);
                ret_json_pack.index = "M3P11";
                break;
            case "M3P12":
                ret_json_pack.ptv_obj = get_raw_arr_M3P12(raw_ptv_set, json_pack.filter);
                ret_json_pack.index = "M3P12";
                break;
            case "M3P14":
                ret_json_pack.ptv_obj = get_raw_arr_M3P14(raw_ptv_set, json_pack.filter);
                ret_json_pack.index = "M3P14";
                break;
            default:
                console.log("query raw data ptv filed : no such page's file");
                break;
        }

        resolve(ret_json_pack);

    });

    return ret_promise;

}

module.exports = {
    query_multi_ptv,
    query_ptv
}
