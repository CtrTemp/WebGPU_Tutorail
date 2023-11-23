const fs = require("fs")

const { shapefile_dir, ptv_dir } = require("./gis/config");
const { get_shapefile, get_shapefile_2019, get_shapefile_list, get_shapefile_zip } = require("./gis/query_shapefile");
const { ptv_query_task_1, ptv_query_task_2, ptv_get_data_version_list } = require("./gis/query_ptv");
const { CardQuery } = require("./gis/query_card");
const { PopulationQuery } = require("./gis/query_population");

const query_gis_data = function (json_pack) {
  const route = json_pack.route;
  const params = json_pack.params;
  try {

  
  switch (route) {
    case 'shapefile/list':
      return new Promise(async (resolve, reject) => {
        resolve(await get_shapefile_list())
      });
    case 'shapefile/zip': 
      return get_shapefile_zip(params.shapefile_version, params.shapefile_part);
    case 'shapefile':
      return new Promise(async (resolve, reject) => {
        resolve(await get_shapefile(params.shapefile_version))
      });
    case 'ptv/list':
      return new Promise(async (resolve, reject) => {
        resolve(await ptv_get_data_version_list())
      });
    case 'ptv/1':
      return new Promise(async (resolve, reject) => {
        resolve(await ptv_query_task_1(params.shapefile_version, params.data_version, params.stoppoints))
      });
    case 'ptv/2':
      return new Promise(async (resolve, reject) => {
        resolve(await ptv_query_task_3(params.shapefile_version, params.data_version, params.links))
      });
    // Card
    case 'card/list':
      return CardQuery.card_get_data_version_list();
    case 'card/stoppoints':
      return CardQuery.card_query_stoppoints(params.shapefile_version, params.data_version, params.stoppoints, params.time_range);
    case 'card/districts':
      return CardQuery.card_query_districts(params.shapefile_version, params.data_version, params.time_range);
    case 'card/zones':
      return CardQuery.card_query_zones(params.shapefile_version, params.data_version, params.zones, params.time_range);
    
    case 'population':
      return PopulationQuery.population_query(params.shapefile_version, params.target_layer, params.range, params.merge_option, params.selected);
    default:
      return Promise.resolve("undefined route");

  }
  }
  catch {
    return Promise.resolve("GIS Serve Error");
  }
}



module.exports = {
  query_gis_data,
} 