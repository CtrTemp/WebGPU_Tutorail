const fs = require('fs');
const Admzip = require('adm-zip');
const topojson = require("topojson-server");
const shapefile = require("shapefile");
const { shapefile_dir } = require("./config");


const readFullSource = async function (source) {
  const features = [];
  while (true) {
    const r = await source.read();
    if (r.done) {
      break;
    }
    features.push(r.value);
  }
  const featureCollection = {
    type: "FeatureCollection",
    features: features
  }
  return featureCollection;
}

const readShapefile = async function (version, encoding = "GB2312", encoding_dis = "utf-8") {
  const prefix = shapefile_dir + '/' + version + '/' + `${version}`;
  const districts_source = shapefile.open(prefix + '_districts.shp', prefix + '_districts.dbf', { encoding: encoding_dis });
  const links_source = shapefile.open(prefix + '_links.shp', prefix + '_links.dbf', { encoding: encoding });
  const stoppoints_source = shapefile.open(prefix + '_stoppoints.shp', prefix + '_stoppoints.dbf', { encoding: encoding });
  const zones_source = shapefile.open(prefix + '_zones.shp', prefix + '_zones.dbf', { encoding: encoding });
  const districts = await readFullSource(await districts_source);
  const links = await readFullSource(await links_source);
  const stoppoints = await readFullSource(await stoppoints_source);
  const zones = await readFullSource(await zones_source);
  return {
    districts,
    links,
    stoppoints,
    zones
  }
}

const get_raw_shapefile = async function (version) {
  let data;
  if (version === '2019') data = await get_shapefile_2019(version);
  else if (version === '2022') data = await get_shapefile_2022(version);
  else data = await readShapefile(version);
  return data;
}

const get_shapefile = async function (version) {
  console.log(version);
  let data;
  if (version === '2019') data = await get_shapefile_2019(version);
  else if (version === '2022') data = await get_shapefile_2022(version);
  else data = await readShapefile(version, 'GB2312', 'GB2312');
  const simplified_data = topojson.topology(data, 1e3);
  return simplified_data;
}

function calc_lng_2022(x) {
  return -8.507444813422919e-17 * x * x * x +
    1.294597734190364e-10 * x * x +
    - 5.3934979091882916e-05 * x +
    121.59346100717225;
}

function calc_lat_2022(y) {
  return 3.9701276822362857e-17 * y * y * y +
    - 3.811176715111845e-11 * y * y +
    2.117771223625911e-05 * y +
    35.87213233469863;
}

const get_shapefile_2022 = async function (version) {
  const data2022 = await readShapefile('2022');
  for (let i of data2022.stoppoints.features) {
    i.geometry.coordinates[0] = calc_lng_2022(i.geometry.coordinates[0]);
    i.geometry.coordinates[1] = calc_lat_2022(i.geometry.coordinates[1]);
  }
  for (let i of data2022.links.features) {
    for (let j of i.geometry.coordinates) {
      j[0] = calc_lng_2022(j[0]);
      j[1] = calc_lat_2022(j[1]);
    }
    
  } 
  return data2022;
}


const get_shapefile_2019 = async function (version) {
  const data2019 = await readShapefile('2019');
  const data2022 = await readShapefile('2022');
  for (let i of data2019.stoppoints.features) {
    i.properties.S_NO = i.properties.NO;
    i.properties.L_NO = i.properties.LINE_abbr_;
  }
  for (let i of data2019.links.features) {
    if (i.properties.NO === 90186) {
      i.properties.LINE = 'M13'
      i.properties.S_NO = 1331
      i.properties.S = '西二旗'
      i.properties.E_NO = 1329
      i.properties.E = '上地'
    }
    else if (i.properties.NO === 90417) {
      i.properties.LINE = 'BT'
      i.properties.S_NO = 333
      i.properties.S = '四惠'
      i.properties.E_NO = 334
      i.properties.E = '四惠东'
    }
    else if (i.properties.NO === 90418) {
      i.properties.LINE = 'BT'
      i.properties.S_NO = 334
      i.properties.S = '四惠东'
      i.properties.E_NO = 335
      i.properties.E = '高碑店'
    }
    else {
      const i2022 = data2022.links.features.find(d => d.properties.NO === i.properties.NO);
      if (!i2022) {
        console.log(i.properties, i2022);
        continue;
      }
      i.properties.LINE = i.properties.LINE_abbr_;
      i.properties.S_NO = i2022.properties.S_NO;
      i.properties.S = i2022.properties.S;
      i.properties.E_NO = i2022.properties.E_NO;
      i.properties.E = i2022.properties.E;
    }
  } 
  return data2019;
}


const get_shapefile_list = function () {
  return new Promise((resolve, reject) => {
    fs.readdir(shapefile_dir, (err, files) => {
      if (err) {
        console.log("shapefile dir open err");
        return;
      }
      return resolve(files.filter(d => d.match(/(\d{4})/)));
    });
  })
}

const get_shapefile_zip = async function (version, shapefile_part) {
  const output = fs.createWriteStream('target.zip');
  const zip = new Admzip();
  const parts = ['districts', 'links', 'stoppoints', 'zones'];
  const prefix = shapefile_dir + '/' + version;
  const need = new Set();
  if (shapefile_part === 'all') {
    for (let i of parts) need.add(i);
  }
  else {
    need.add(shapefile_part);
  }
  return await new Promise((resolve, reject) => {
    fs.readdir(prefix, (err, files) => {
      for (let i of files) {
        const r = i.match(/(.*)_([^\.]+)\.(.*)/);
        if (r && r.length === 4) {
          const [v, p] = [r[1], r[2]];
          if (v != version) continue;
          if (need.has(p)) {
            // console.log(prefix + '/' + i);
            zip.addLocalFile(prefix + '/' + i);
          }
        }
      }
      resolve(zip.toBuffer().toString('base64'));
    });
  });
}


module.exports = {
  get_shapefile,
  get_shapefile_2019,
  get_shapefile_list,
  get_raw_shapefile,
  get_shapefile_zip,
}