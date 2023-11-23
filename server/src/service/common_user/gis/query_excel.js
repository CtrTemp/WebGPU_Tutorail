const { ptv_dir } = require("./config");
const fs = require("fs");
const path = require("path");
const d3 = import("d3");

get_csv = async function (version, file, encoding = "GB2312") {
  return await new Promise((resolve, reject) => {
    var tsv = d3.dsv("\t", `text/tab-separated-values;charset=${encoding}`);
    tsv(path.resolve(ptv_dir, version, file)).then((data) => resolve(data));
  });
};

module.exports = {
  get_csv,
};
