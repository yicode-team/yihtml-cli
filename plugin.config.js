let _ = require("lodash");
let path = require("path");
let envConfig = require("./env.config.js");
let commonParams = {
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
        presets: [
            [
                path.resolve(envConfig.cliDir, "node_modules", "@babel", "preset-env"),
                {
                    useBuiltIns: "usage",
                    corejs: "3",
                },
            ],
        ],
        plugins: [
            [
                path.resolve(envConfig.cliDir, "node_modules", "@babel", "plugin-transform-runtime"),
                {
                    absoluteRuntime: false,
                    corejs: 3,
                    helpers: true,
                    regenerator: true,
                    useESModules: false,
                },
            ],
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
let buildParams = {
    uflifyParams: {
        compress: {
            drop_console: false,
            drop_debugger: true,
            conditionals: true,
        },
    },
    // sass参数
    sassParams: {
        outputStyle: "compressed",
    },
};
if (process.env.compress === "false") {
    buildParams.sassParams.outputStyle = "expanded";
}
let devParams = {};
if (process.env.NODE_ENV === "build") {
    commonParams = _.merge(commonParams, buildParams);
}
if (process.env.NODE_ENV === "dev") {
    commonParams = _.merge(commonParams, devParams);
}

module.exports = commonParams;
