const fs = require("fs");
const { card_dir } = require("./config");
const {
  calDurationDistribution,
  calTimeDistribution,
  calOD,
  calKeyInfo,
  calStoppointsOD,
  calZoneGroupOD,
} = require("./card/functions");



const card_get_data_version_list = async function () {
  return await new Promise((resolve, reject) => {
    fs.readdir(card_dir, (err, files) => {
      if (err) {
        console.log("card dir open err, err dir = ", card_dir);
        return;
      }
      return resolve(files.filter(d => d.match(/(\d{4})-(\d{2})-(\d{2})/)));
    });
  });
}


// 获取几个站点的 1)这几个站点相互之间的OD对 2)这几个站点到全网的上车/下车分布
// 输入参数：站点名称的数组，Array<String>
// 输出结果：[Dict, Dict]
// 第一个Dict为OD对，key为起点站点名称，value为Dict，key为终点站点名称，value为OD对的客运量
// 第二个Dict为上车/下车分布，key为站点名称（所选站点），value为Dict，key为站点名称（全网站点），value为[上车量（所选到全网），下车量（全网到所选）]
const card_query_stoppoints = async function (shapefile_version, data_version, stoppoints, time_range) {
  const prefix = data_version.replace(/\-/g, '');
  time_range[0] = prefix + time_range[0];
  time_range[1] = prefix + time_range[1];
  console.log('card/stoppoints', shapefile_version, data_version, stoppoints);
  return await calStoppointsOD(shapefile_version, data_version, stoppoints, +time_range[0], +time_range[1]);
}


const card_query_districts = async function (shapefile_version, data_version, time_range) {
  const prefix = data_version.replace(/\-/g, '');
  time_range[0] = prefix + time_range[0];
  time_range[1] = prefix + time_range[1];
  console.log(shapefile_version, data_version, typeof data_version, time_range, prefix);
  return [
    await calKeyInfo(shapefile_version, data_version, +time_range[0], +time_range[1]),
    await calOD(shapefile_version, data_version, +time_range[0], +time_range[1]),
    await calTimeDistribution(shapefile_version, data_version, +time_range[0], +time_range[1]),
    await calDurationDistribution(shapefile_version, data_version, +time_range[0], +time_range[1]),
  ];
}

const card_query_zones = async function (shapefile_version, data_version, zones, time_range) {
  // return [shapefile_version, data_version, zones, time_range];
  const prefix = data_version.replace(/\-/g, '');
  time_range[0] = prefix + time_range[0];
  time_range[1] = prefix + time_range[1];
  return await calZoneGroupOD(shapefile_version, data_version, +time_range[0], +time_range[1], zones);
}

module.exports = {
  CardQuery: {
    card_get_data_version_list,
    card_query_stoppoints,
    card_query_districts,
    card_query_zones,
  }
}