const NODE_ENV = process.env.NODE_ENV;
const dotenv = require("dotenv");
const isDev = NODE_ENV === "development";
const isTest = NODE_ENV === "test";

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
  in: join(src, "app.js"),
  out: dest,
  clearBeforeBuild: true,
});

config.postcss = [].concat([
  require("precss")({}),
  require("autoprefixer")({}),
  require("cssnano")({}),
]);

const cssModulesNames = `${
  isDev ? "[path][name]__[local]__" : ""
}[hash:base64:5]`;

const matchCssLoaders = /(^|!)(css-loader)($|!)/;

const findLoader = (loaders, match) => {
  const found = loaders.filter((l) => l && l.loader && l.loader.match(match));
  return found ? found[0] : null;
};

const cssloader = findLoader(config.module.loaders, matchCssLoaders);

const newloader = Object.assign({}, cssloader, {
  test: /\.module\.css$/,
  include: [src],
  loader: cssloader.loader.replace(
    matchCssLoaders,
    `$1$2?modules&localIdentName=${cssModulesNames}$3`
  ),
});
config.module.loaders.push(newloader);
cssloader.test = new RegExp(`[^module]${cssloader.test.source}`);
cssloader.loader = newloader.loader;

config.module.loaders.push({
  test: /\.css$/,
  include: [modules],
  loader: "style!css",
});

const dotEnvVars = dotenv.config();
const enviromentEnv = dotenv.config({
  path: join(root, "config", `{NODE_ENV}.config.js`),
  silent: true,
});
const enrVariables = Object.assign({}, dotEnvVars, enviromentEnv);

const defines = Object.keys(enrVariables).reduce(
  (memo, key) => {
    const val = JSON.stringify(enrVariables[key]);
    memo[`__${key.toUpperCase()}__`] = val;
    return memo;
  },
  {
    __NODE_ENV__: JSON.stringify(NODE_ENV),
  }
);

config.plugins = [new webpack.DefinePlugin(defines)].concat(config.plugins);

config.resolve.root = [src, modules];
config.resolve.alias = {
  css: join(src, "styles"),
  containers: join(src, "containers"),
  components: join(src, "components"),
  utils: join(src, "utils"),
};

if (isTest) {
  config.externals = {
    "react/lib/ReactContext": true,
    "react/lib/ExecutionEnvironment": true,
    "react/addons": true,
  };

  config.plugins = config.plugins.filter((p) => {
    const name = p.constructor.toString();
    const fnName = name.match(/^function (.*)\((.*\))/);
    const idx = ["DedupePlugin", "UglifyJsPlugin"].indexOf(fnName[1]);
    return idx < 0;
  });
}

module.exports = config;
