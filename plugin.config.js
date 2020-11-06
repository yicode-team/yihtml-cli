const _ = require("lodash");
const path = require("path");
const envConfig = require("./env.config.js");
const devParams = {
    // js压缩参数
    uflifyParams: {
        compress: {
            drop_console: false,
            drop_debugger: false,
            conditionals: false,
        },
        output: {
            wrap_iife: true,
        },
    },
    // postcss参数
    postcssParams: [],
    px2viewport: {
        unitToConvert: "px",
        viewportWidth: 750,
        unitPrecision: 5,
        propList: ["*"],
        viewportUnit: "vw",
        fontViewportUnit: "vw",
        selectorBlackList: [],
        minPixelValue: 1,
        mediaQuery: false,
        replace: true,
        exclude: undefined,
        include: undefined,
        landscape: false,
        landscapeUnit: "vw",
        landscapeWidth: 568,
    },
    // babel参数
    babelParams: {
        presets: [path.resolve(envConfig.cliDir, "node_modules", "@babel", "preset-env")],
        plugins: [
            // [
            //     "@babel/plugin-transform-runtime",
            //     {
            //         absoluteRuntime: false,
            //         corejs: false,
            //         helpers: true,
            //         regenerator: false,
            //         useESModules: false,
            //     },
            // ],
            // ['add-module-exports']
        ],
    },
    // sass参数
    sassParams: {
        outputStyle: "expanded",
    },
    // src参数
    srcParams: {
        allowEmpty: true,
    },
    // html压缩参数
    yueHtmlMin: {
        // 区分大小写
        caseSensitive: true,
        // selected="selected" => selected
        collapseBooleanAttributes: true,
        // 行内元素间不要留任何空格
        collapseInlineTagWhitespace: true,
        // 是否去除html元素间的空白
        collapseWhitespace: true,
        // 是否永远留一个空白
        conservativeCollapse: false,
        continueOnParseError: false,
    },
};
const buildParams = {
    uflifyParams: {
        compress: {
            drop_console: true,
            drop_debugger: true,
            conditionals: true,
        },
    },
    // sass参数
    sassParams: {
        outputStyle: "compressed",
    },
};
const config = {
    dev: devParams,
    build: _.merge(_.cloneDeep(devParams), buildParams),
};
module.exports = config;
