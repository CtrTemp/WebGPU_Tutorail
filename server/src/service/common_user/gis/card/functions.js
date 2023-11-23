const { performance } = require('perf_hooks'); 
const booleanPointInPolygon = require("@turf/boolean-point-in-polygon").default;
const circle = require('@turf/circle').default;
const intersect = require('@turf/intersect').default;
const turf = require("@turf/turf");
const fs = require('fs');
const csv = require('csvtojson');
const { get_raw_shapefile } = require("../query_shapefile");


// 全局变量缓存
const shapefile_dict = {};
const metro_data_dict = {};
const cell_data_dict = {};
const stations_dict = {};



request_shapefile = async function (mapVersion) {
  if (Object.prototype.hasOwnProperty.call(shapefile_dict, mapVersion)) {
    return shapefile_dict[mapVersion];
  } else {
    const shapefile = await get_raw_shapefile(mapVersion);
    shapefile_dict[mapVersion] = shapefile;
    return shapefile;
  }
}

read_metro_data = function (date) {
  const raw = fs.readFileSync('src/gis_data/shuakashuju/' + date + '/metro_simplified.csv', { encoding: 'utf-8' });
  const lines = raw.split(/[\r\n]+/);
  const r = new Array(lines.length - 1);
  for (let line, i = 1; i < lines.length; i++) {
    line = lines[i].split(',');
    r[i - 1] = {
      '进站车站名称': line[0],
      '进站时间': +line[1],
      '出站车站名称': line[2],
      '出站时间': +line[3],
    }
  }
  while (r[r.length - 1]['进站车站名称'] === '') r.pop();
  return r;
}

request_metro_data = async function (date) {
  if (Object.prototype.hasOwnProperty.call(metro_data_dict, date)) {
    return metro_data_dict[date];
  } else {
    // const metro = await csv()
    //   .fromFile('src/gis_data/shuakashuju/' + date + '/metro.csv')
    //   .then((json) => json)
    const metro = read_metro_data(date);
    metro_data_dict[date] = metro;
    return metro;
  }
}

read_cell_data = function (date) {
  const raw = fs.readFileSync('src/gis_data/shuakashuju/' + date + '/cell.csv', { encoding: 'utf-8' });
  const lines = raw.split(/[\r\n]+/);
  const r = new Array(lines.length - 1);
  for (let line, i = 1; i < lines.length; i++) {
    line = lines[i].split(',');
    r[i - 1] = {
      'Time': +line[0],
      'OinZone': line[1],
      'DinZone': line[2],
      'tsum': +line[3],
    }
  }
  while (!(r[r.length - 1]['tsum'] > -1) || !r[r.length - 1]['DinZone']) r.pop();
  return r;
}

request_cell_data = async function (date) {
  if (Object.prototype.hasOwnProperty.call(cell_data_dict, date)) {
    return cell_data_dict[date];
  } else {
    // const cell = await csv()
    //   .fromFile('src/gis_data/shuakashuju/' + date + '/cell.csv')
    //   .then((json) => json)
    const cell = read_cell_data(date);
    cell_data_dict[date] = cell;
    return cell;
  }
}

getTime = function (time_str) {
  if (time_str.length != 14) return new Date();
  return new Date(parseInt(time_str.substring(0, 4)), parseInt(time_str.substring(4, 6)) - 1, parseInt(time_str.substring(6, 8)), parseInt(time_str.substring(8, 10)), parseInt(time_str.substring(10, 12)), parseInt(time_str.substring(12, 14)));
}

search_station_district = function (districts, stoppoints, station) {
  if (Object.prototype.hasOwnProperty.call(stations_dict, station)) {
    return stations_dict[station];
  } else {
    for (let j = 0; j < stoppoints.length; j++) {
      if (stoppoints[j]['properties']['NAME'] == station) {
        for (let k = 0; k < districts.length; k++) {
          if (booleanPointInPolygon(stoppoints[j], districts[k])) {
            const station_district = districts[k]['properties']['ID'].toString().padStart(2, '0');
            stations_dict[station] = station_district
            return station_district;
          }
        }
        break;
      }
    }
  }
  return ""
}

const calKeyInfo = async function (mapVersion, date, startTime, endTime) {
  const _startTime = performance.now();
  const shapefile = await request_shapefile(mapVersion);
  const _s1 = performance.now();
  const metro = await request_metro_data(date);
  const _s2 = performance.now();
  const cell = await request_cell_data(date);
  const _s3 = performance.now();
  // console.log(_s1 - _startTime, _s2 - _s1, _s3 - _s2);
  const districts = shapefile.districts.features;
  const stoppoints = shapefile.stoppoints.features;
  const districts_dict = {};
  const radius = 0.8;
  const options = { steps: 3, units: "kilometers", properties: {  } };   // 20合适
  let stations_combine = null;

  // 计算站点信息
  for (let i = 0; i < districts.length; i++) {
    const district_id = districts[i]['properties']['ID'].toString().padStart(2, '0');
    const stations = [];
    for (let j = 0; j < stoppoints.length; j++) {
      const station_name = stoppoints[j]['properties']['NAME']
      if (Object.prototype.hasOwnProperty.call(stations_dict, station_name)) {
        if (stations_dict[station_name] == district_id) {
          stations.push(stoppoints[j]);
        }
      } else if (booleanPointInPolygon(stoppoints[j], districts[i])) {
        stations_dict[station_name] = district_id;
        stations.push(stoppoints[j]);
      }

      if (i == 0) {
        const center = stoppoints[j].geometry.coordinates;
        const station_range = circle(center, radius, options);
        if (j == 0) stations_combine = station_range;
        else stations_combine = turf.union(stations_combine, station_range);
      }
    }

    const stations_intersect = intersect(stations_combine, districts[i]);
    const coverage_area = stations_intersect ? turf.area(stations_intersect) : 0;
    // 'id': district_id, 'name': districts[i]['properties']['NAME'], 'shape': districts[i], 'stations': stations, 
    districts_dict[district_id] = { 'name': districts[i].properties.NAME, 'stations_num': stations.length, 'coverage': coverage_area / turf.area(districts[i]), 'incoming': 0, 'outgoing': 0, 'incoming_outgoing': 0, 'trips': 0, 'rail_trips_ratio': 0 };
  }
  const _s4 = performance.now();

  // 计算客流信息
  for (let i = 0; i < metro.length; i++) {
    const incoming_time = metro[i]['进站时间'];
    const incoming = metro[i]['进站车站名称'];
    if (startTime && (incoming_time < startTime) || endTime && (incoming_time > endTime)) continue;
    if (Object.prototype.hasOwnProperty.call(stations_dict, incoming)) {
      districts_dict[stations_dict[incoming]]['incoming'] += 1;
      districts_dict[stations_dict[incoming]]['incoming_outgoing'] += 1;
    }
  }

  const _s5 = performance.now();

  for (let i = 0; i < metro.length; i++) {
    const outgoing_time = metro[i]['出站时间'];
    const outgoing = metro[i]['出站车站名称'];
    if (startTime && (outgoing_time < startTime) || endTime && (outgoing_time > endTime)) continue;
    if (Object.prototype.hasOwnProperty.call(stations_dict, outgoing)) {
      districts_dict[stations_dict[outgoing]]['outgoing'] += 1;
      districts_dict[stations_dict[outgoing]]['incoming_outgoing'] += 1;
    }
  }

  const _s6 = performance.now();

  const date_prefix = date.replace(/\-/g, '');
  // 计算出行信息
  for (let i = 0; i < cell.length; i++) {
    const incoming_time = Number(date_prefix + cell[i]['Time'].toString().padStart(2, '0') + "0000");
    const incoming_district = cell[i]['OinZone'][2] + cell[i]['OinZone'][3];
    if (startTime && (incoming_time < startTime) || endTime && (incoming_time > endTime)) continue;
    if (Object.prototype.hasOwnProperty.call(districts_dict, incoming_district)) {
      districts_dict[incoming_district]['trips'] += +cell[i]['tsum'];
    }
  }

  const _s7 = performance.now();

  for (let district in districts_dict) {
    if (!districts_dict[district]['trips']) continue;
    districts_dict[district]['rail_trips_ratio'] = districts_dict[district]['incoming'] / districts_dict[district]['trips'];
  }
  // console.log(_s4 - _s3, _s5 - _s4, _s6 - _s5, _s7 - _s6);
  console.log(districts_dict);
  return districts_dict;
}

const calOD = async function (mapVersion, date, startTime, endTime) {
  const shapefile = await request_shapefile(mapVersion);
  const metro = await request_metro_data(date);
  const matrix = {};
  const districts = shapefile.districts.features;
  const stoppoints = shapefile.stoppoints.features;
  // 初始化矩阵
  for (let i = 0; i < districts.length; i++) {
    const id0 = districts[i]['properties']['ID'].toString().padStart(2, '0');
    matrix[id0] = {}
    for (let j = 0; j < districts.length; j++) {
      const id1 = districts[j]['properties']['ID'].toString().padStart(2, '0');
      matrix[id0][id1] = 0;
    }
  }

  // 计算客流信息
  for (let i = 0; i < metro.length; i++) {
    const incoming_time = metro[i]['进站时间'];
    const incoming = metro[i]['进站车站名称'];
    const outgoing_time = metro[i]['出站时间'];
    const outgoing = metro[i]['出站车站名称'];
    if (startTime && (incoming_time < startTime) || endTime && (incoming_time > endTime)) continue;
    if (startTime && (outgoing_time < startTime) || endTime && (outgoing_time > endTime)) continue;
    const incoming_district = search_station_district(districts, stoppoints, incoming);
    const outgoing_district = search_station_district(districts, stoppoints, outgoing);
    if (Object.prototype.hasOwnProperty.call(matrix, incoming_district) && Object.prototype.hasOwnProperty.call(matrix[incoming_district], outgoing_district)) {
      // console.log(incoming_district, outgoing_district);
      matrix[incoming_district][outgoing_district] += 1;
    }
  }
  const districtNameDict = {};
  for (let i of districts) {
    districtNameDict[i.properties.ID.toString().padStart(2, '0')] = i.properties.NAME;
  }
  const retMatrix = {};
  for (let i in matrix) {
    retMatrix[districtNameDict[i]] = {};
    for (let j in matrix[i]) {
      retMatrix[districtNameDict[i]][districtNameDict[j]] = matrix[i][j];
    }
  }
  // console.log(matrix);
  return [matrix, retMatrix];
}

const calTimeDistribution = async function (mapVersion, date, startTime, endTime) {
  const metro = await request_metro_data(date);
  const minute_bin = new Array(2600);
  const minute_dict = {}

  for (let i = 0; i < 2600; ++i) {
    minute_bin[i] = 0;
  }

  // 计算时间分布
  for (let m, incoming_time, i = 0; i < metro.length; i++) {
    incoming_time = +metro[i]['进站时间']
    if (startTime && (incoming_time < startTime) || endTime && (incoming_time > endTime)) continue;
    m  = Math.floor(incoming_time % 1000000 / 100);
    minute_bin[m] += 1;
    // const datetime = getTime(String(incoming_time).substring(0, 12) + "00");
    // if (!Object.prototype.hasOwnProperty.call(minute_dict, datetime)) {
    //   minute_dict[datetime] = 0;
    // }
    // minute_dict[datetime] += 1;
  }
  for (let i = 0; i < 2600; ++i) {
    if (minute_bin[i] > 0) {
      minute_dict[Math.floor(i / 100) * 60 + i % 100] = minute_bin[i];
    }
  }
  // console.log(minute_dict);
  return minute_dict;
}

const calDurationDistribution = async function (mapVersion, date, startTime, endTime) {
  const metro = await request_metro_data(date);
  const minute_bin = new Array(2600);
  const duration_dict = {};
  for (let i = 0; i < 2600; ++i) {
    minute_bin[i] = 0;
  }
  // 计算出行时耗
  for (let i = 0; i < metro.length; i++) {
    const incoming_time = +metro[i]['进站时间'];
    const outgoing_time = +metro[i]['出站时间'];
    if (startTime && (incoming_time < startTime) || endTime && (incoming_time > endTime)) continue;
    if (startTime && (outgoing_time < startTime) || endTime && (outgoing_time > endTime)) continue;
    const m = Math.floor(outgoing_time / 100) % 100 - Math.floor(incoming_time / 100) % 100;
    const h = Math.floor(outgoing_time / 10000) % 100 - Math.floor(incoming_time / 10000) % 100;
    minute_bin[h * 60 + m] += 1;
  }
  for (let i = 0; i < 2600; ++i) {
    if (minute_bin[i] > 0) {
      duration_dict[i] = minute_bin[i];
    }
  }
  // console.log(duration_dict);
  return duration_dict;
}

const calStoppointsOD = async function (mapVersion, date, selected, startTime, endTime) {
  console.log(mapVersion, date, startTime, endTime);
  const _startTime = performance.now();
  const shapefile = await request_shapefile(mapVersion);
  const _s1 = performance.now();
  const metro = await request_metro_data(date);
  const _s2 = performance.now();
  const stoppoints = shapefile.stoppoints.features;
  const _s3 = performance.now();
  const dict = {};
  const stoppoints_names = new Set(stoppoints.map(d => d.properties.NAME));
  for (let i of stoppoints_names) {
    dict[i] = {};
    for (let j of stoppoints_names) {
      dict[i][j] = 0;
    }
  }
  // console.log(_s1 - _startTime, _s2 - _s1, _s3 - _s2);
  for (let i = 0; i < metro.length; ++i) {
    const incoming_time = metro[i]['进站时间'];
    const incoming = metro[i]['进站车站名称'];
    const outgoing_time = metro[i]['出站时间'];
    const outgoing = metro[i]['出站车站名称'];
    if (startTime && (incoming_time < startTime) || endTime && (incoming_time > endTime)) continue;
    if (startTime && (outgoing_time < startTime) || endTime && (outgoing_time > endTime)) continue;
    if (incoming in dict && outgoing in dict[incoming]) {
      dict[incoming][outgoing] += 1;
    }
  }
  // console.log(dict);
  return dict;
}

const calZoneGroupOD = async function (mapVersion, date, startTime, endTime, zoneGroups) {
  const _startTime = performance.now();
  const shapefile = await request_shapefile(mapVersion);
  const _s1 = performance.now();
  const metro = await request_metro_data(date);
  const _s2 = performance.now();
  const zones = shapefile.zones.features;
  const stoppoints = shapefile.stoppoints.features;

  const zone_dict = {};
  const stoppoint_dict = {};
  const zone_od_str = {};
  const od_set = new Set();

  const search_station_zone = (name) => {
    if (name in zone_dict) return zone_dict[name];
    else {
      const sp = stoppoint_dict[name];
      if (!sp) {
        zone_dict[name] = null;
        return null;
      } 
      for (let i of zones) {
        if (booleanPointInPolygon(sp, i)) {
          zone_dict[name] = i.properties.NO;
          break;
        }
      }
      return zone_dict[name];
    }
  }

  for (let i of stoppoints) {
    stoppoint_dict[i.properties.NAME] = i;
  }

  for (let i of zoneGroups) {
    if (!i.src) continue;
    for (let j of zoneGroups) {
      if (!j.dst) continue;
      for (let is of i.zones) {
        for (let js of j.zones) {
          const cn = is + "-" + js;
          od_set.add(cn);
        }
      }
    }
  }

  const incoming_bin = new Array(2600);
  const incoming_dict = {};
  const duration_bin = new Array(2600);
  const duration_dict = {};


  for (let i = 0; i < 2600; ++i) {
    incoming_bin[i] = 0;
    duration_bin[i] = 0;
  }

  for (let i = 0; i < metro.length; ++i) {
    const incoming_time = +metro[i]['进站时间'];
    const incoming = metro[i]['进站车站名称'];
    const outgoing_time = +metro[i]['出站时间'];
    const outgoing = metro[i]['出站车站名称'];
    if (!startTime || !endTime) continue;
    if (((incoming_time < startTime)) || (incoming_time > endTime)) continue;
    if (((outgoing_time < startTime)) || (outgoing_time > endTime)) continue;
    const incoming_zone = search_station_zone(incoming);
    const outgoing_zone = search_station_zone(outgoing);
    if(!incoming_zone || !outgoing_zone) continue;
    const cn = incoming_zone + "-" + outgoing_zone;
    if (!od_set.has(cn)) continue;
    // time distribution
    const z = Math.floor(incoming_time % 1000000 / 100);
    incoming_bin[z] += 1;
    //  duration distribution
    const m = Math.floor(outgoing_time / 100) % 100 - Math.floor(incoming_time / 100) % 100;
    const h = Math.floor(outgoing_time / 10000) % 100 - Math.floor(incoming_time / 10000) % 100;
    duration_bin[h * 60 + m] += 1;
    // od summary
    if (zone_od_str[cn] === undefined) {
      zone_od_str[cn] = 0;
    }
    zone_od_str[cn] += 1;
  }
  for (let i = 0; i < 2600; ++i) {
    if (incoming_bin[i] > 0) {
      incoming_dict[Math.floor(i / 100) * 60 + i % 100] = incoming_bin[i];
    }
  }
  for (let i = 0; i < 2600; ++i) {
    if (duration_bin[i] > 0) {
      duration_dict[i] = duration_bin[i];
    }
  }
  const result_od = [];
  for (let i of zoneGroups) {
    if (!i.src) continue;
    for (let j of zoneGroups) {
      if (!j.dst) continue;
      let s = 0;
      for (let is of i.zones) {
        for (let js of j.zones) {
          const cn = is + "-" + js;
          if (cn in zone_od_str) {
            s += zone_od_str[cn];
          }
        }
      }
      if (s > 0) {
        result_od.push({
          src: i.id,
          dst: j.id,
          value: s,
        })
      }
    }
  }
  // console.log(result_od, incoming_dict, duration_dict)
  return [result_od, incoming_dict, duration_dict];
}


module.exports = {
  calDurationDistribution,
  calTimeDistribution,
  calOD,
  calKeyInfo,
  calStoppointsOD,
  calZoneGroupOD,
}