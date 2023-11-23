const circle = require('@turf/circle').default;
const intersect = require('@turf/intersect').default;
const turf = require("@turf/turf");

const { population_dir } = require("../config");
const xlsx = require("xlsx");
const { get_raw_shapefile } = require("../query_shapefile");

const read_population = (shapefile_version) => {
  const file_path = population_dir + `/${shapefile_version}.xlsx`;
  const workBook = xlsx.readFile(file_path);
  let sheet = workBook.Sheets[workBook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_csv(sheet).split(/[\r\n]+/);
  const r = {};
  data.shift();
  for (let i of data) {
    const row = i.split(",");
    r[+row[0]] = {
      'permannent': +row[1] / 10000,
      'floating': +row[2] / 10000,
      'total': +row[3] / 10000,
      'job': +row[4] / 10000,
    }
  }
  delete r[NaN];
  return r;
}

const check_bbox = function(a, b) {
  return Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1]);
}

const get_merged_info = function(zones, combined) {
  const r = [];
  for (let i of zones) {
    const int = intersect(i, combined);
    if (!int) continue;
    const area = turf.area(int);
    const ratio = area / i.properties.area;
    r.push({
      'NO': i.properties.NO,
      'area': i.properties.area / 1000000,
      'area_selected': area / 1000000,
      'population': i.properties.population,
      'population_selected': {
        'permannent': i.properties.population.permannent * ratio,
        'floating': i.properties.population.floating * ratio,
        'total': i.properties.population.total * ratio,
        'job': i.properties.population.job * ratio,
      }
    })
  }
  return r;
}

const get_seperate_info = function(zones, buffer_dict, metadata) {
  const sr = {};
  for (let j in buffer_dict) {
    const r = []
    for (let i of zones) {  
      if (!check_bbox(i.properties.bbox, buffer_dict[j].properties.bbox)) continue;
      const int = intersect(i, buffer_dict[j]);
      if (!int) continue;
      const area = turf.area(int);
      const ratio = area / i.properties.area;
      
      r.push({
        'NO': i.properties.NO,
        'area': i.properties.area / 1000000,
        'area_selected': area / 1000000,
        'population': i.properties.population,
        'population_selected': {
          'permannent': i.properties.population.permannent * ratio,
          'floating': i.properties.population.floating * ratio,
          'total': i.properties.population.total * ratio,
          'job': i.properties.population.job * ratio,
        }
      });
    }
    sr[j] = {
      metadata: metadata[j],
      data: r,
    };
  }
  return sr;
}

const get_features = async function (shapefile_version, key) {
  const shapefile = await get_raw_shapefile(shapefile_version);
  const population = read_population(shapefile_version);
  zones = shapefile.zones.features;

  for (let i of zones) {
    if (i.properties.NO in population) {
      i.properties.population = population[i.properties.NO];
    }
    else {
      i.properties.population = {
        'permannent': 0,
        'floating': 0,
        'total': 0,
        'job': 0,
      }
    }
    i.properties.bbox = turf.bbox(i);
    i.properties.area = turf.area(i);
  }
  return [zones, shapefile[key].features]
}

const merge_all = function (buffer_dict) {
  let combined = null;
  for (let i in buffer_dict) {
    if (!combined) {
      combined = buffer_dict[i];
    }
    else {
      combined = turf.union(combined, buffer_dict[i]);
    }
  }
  return combined;
}

const get_link_id = function (link) {
  const a = link.properties.S;
  const b = link.properties.E;
  if (a < b) {
    return `${a}-${b}`;
  }
  else {
    return `${b}-${a}`;
  }
}

const query_zones = async (shapefile_version, selected) => {
  const [zones, _] = await get_features(shapefile_version, 'stoppoints');

  const r = [];
  const collection = [];
  for (let i of zones) {
    if (!selected.includes(i.properties.NO)) continue;
    r.push(Object.assign({}, i.properties));
    r[r.length - 1].area /= 1000000;
    collection.push(i);
  }
  return [collection, r];
}


const query_stoppoints = async (shapefile_version, range, mergeFlag, selected) => {
  const options = { steps: 10, units: "kilometers" };
  const [zones, stoppoints] = await get_features(shapefile_version, 'stoppoints');

  const circle_dict = {};
  const visited = new Set();
  const metadata = {};
  for (let i of stoppoints)
  {
    if (visited.has(i.properties.NAME)) continue;
    visited.add(i.properties.NAME);
    if (!selected.includes(i.properties.NAME)) continue;
    const center = i.geometry.coordinates;
    const cir = circle(center, range / 1000, options)
    cir.properties = { bbox: turf.bbox(cir) };
    circle_dict[i.properties.NAME] = cir;
    metadata[i.properties.NAME] = i.properties;
  }

  if (mergeFlag) {
    const combined = merge_all(circle_dict);
   return [turf.rewind(combined, {reverse: true}), get_merged_info(zones, combined)];
  }
  else {
    const r = get_seperate_info(zones, circle_dict, metadata);
   return [Object.values(circle_dict).map(d => turf.rewind(d, {reverse: true})), r];
  }
}

const query_links = async (shapefile_version, range, mergeFlag, selected) => {
  const options = { steps: 4, units: "kilometers" };
  const [zones, links] = await get_features(shapefile_version, 'links');

  const metadata = {};
  const buffer_dict = {};
  for (let i of links) {
    const id = get_link_id(i);
    if (!selected.includes(id)) continue;
    
    const buffer = turf.buffer(i, range / 1000, options);
    buffer.properties = { bbox: turf.bbox(buffer) };
    buffer_dict[id] = buffer;
    metadata[id] = i.properties;
  }


  if (mergeFlag) {
    const combined = merge_all(buffer_dict);
    return [turf.rewind(combined, {reverse: true}), get_merged_info(zones, combined)];
  }
  else {
    return [Object.values(buffer_dict).map(d => turf.rewind(d, {reverse: true})), get_seperate_info(zones, buffer_dict, metadata)];
  }
}

const query_lines = async (shapefile_version, range, mergeFlag, selected) => {
  const options = { steps: 4, units: "kilometers" };
  const [zones, links] = await get_features(shapefile_version, 'links');
  

  const metadata = {};
  const lines = {};
  for (let i of selected) {
    const line = {
      'type': 'FeatureCollection',
      'features': [],
    }
    const links_set = new Set();
    lines[i] = line;
    for (let j of links) {
      if (j.properties.LINE === i) {
        const id = get_link_id(j);
        if (links_set.has(id)) continue;
        links_set.add(id);
        line.features.push(j);
      }
    }
  }

  const buffer_dict = {};
  for (let i of selected) {
    const line = lines[i];
    const tmp = {};
    let cnt = 0;
    for (let j of turf.buffer(line, range / 1000, options).features) {
      tmp[cnt++] = j;
    }
    const buffer = merge_all(tmp);
    buffer.properties = { bbox: turf.bbox(buffer) };
    buffer_dict[i] = buffer;
    metadata[i] = { name: i };
  } 


  if (mergeFlag) {
    const combined = merge_all(buffer_dict);
    return [turf.rewind(combined, {reverse: true}), get_merged_info(zones, combined)];
  }
  else {
    return [Object.values(buffer_dict).map(d => turf.rewind(d, {reverse: true})), get_seperate_info(zones, buffer_dict, metadata)];
  }
}


module.exports = {
  query_lines,
  query_links,
  query_stoppoints,
  query_zones,
}