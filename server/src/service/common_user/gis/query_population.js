const fs = require("fs");
const { population_dir } = require("./config");
const xlsx = require("xlsx");
const { get_raw_shapefile } = require("./query_shapefile");
const {
  query_lines,
  query_links,
  query_stoppoints,
  query_zones,
} = require("./population/functions");

const population_query = async function (shapefile_version, target_layer, range, merge_option, selected) {
  try {
    switch (target_layer) {
      case 'stoppoint':
        return await query_stoppoints(shapefile_version, range, merge_option, selected);
      case 'line':
        return await query_lines(shapefile_version, range, merge_option, selected);
      case 'link':
        return await query_links(shapefile_version, range, merge_option, selected);
      case 'zone':
        return await query_zones(shapefile_version, selected);
    }
  }
  catch {
    return 'GIS file process error'
  }
  
}


module.exports = {
  PopulationQuery: {
    population_query,
  }
} 