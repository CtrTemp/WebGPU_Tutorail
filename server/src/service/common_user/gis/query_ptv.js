const fs = require("fs");
const {ptv_dir} = require("./config");
const {get_shapefile} = require("./query_shapefile");
const {get_csv} = require("./query_excel");

// 还要写三个函数的Excel导出版本！！！！
// 还要写三个函数的Excel导出版本！！！！
// 还要写三个函数的Excel导出版本！！！！
// 还要写三个函数的Excel导出版本！！！！


// 获取站点的客运量，进站量，换乘量
// 输入参数：站点名称的数组，Array<String>
// 输出结果：Dict<String, Dict<String, Number>>, 第一层key是站点名称，第二层key是客运量，进站量，换乘量
const ptv_query_task_1 = async function (shapefile_version, data_version, stoppoints) {
  console.log('ptv/1', shapefile_version, data_version, stoppoints);
  return [shapefile_version, data_version, stoppoints];
}


// 获取某几段区间的各种系数
// 输入参数：区段的数组，每个区段用左右站点名称表示，Array<[String, String]>
// 输出结果：按输入顺序，每个区段的各种系数，Array<Dict<String, Number>>
const ptv_query_task_2 = async function (shapefile_version, data_version, links) {
}

const ptv_get_data_version_list = async function () {
  return await new Promise((resolve, reject) => {
    fs.readdir(ptv_dir, (err, files) => {
      if (err) {
        console.log("ptv dir open err");
        return;
      }
      console.log(files);
      return resolve(files);
    });
  });
}


module.exports = {
  ptv_query_task_1,
  ptv_query_task_2,
  ptv_get_data_version_list,
}