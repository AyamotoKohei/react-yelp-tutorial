const NODE_ENV = process.env.NODE_ENV;
const isDev = NODE_ENV === "development";

const webpack = require("webpack");
const fs = require("fs");
const path = require("path"),
  join = path.join,
  ressolve = path.resolve;

const getConfig = require("hjs-webpack");

const root = ressolve(__dirname);
const src = join(root, "src");
const modules = join(root, "node_modules");
const dest = join(root, "dist");

var config = getConfig({
  isDev: isDev,
  in: join(src, "src/app.js"),
  out: dest,
  clearBeforeBuild: true,
});

module.exports = config;
