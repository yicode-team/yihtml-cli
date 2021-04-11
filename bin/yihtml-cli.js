#!/usr/bin/env node
"use strict";
let _ = require("lodash");
let path = require("path");
// 插件配置
let pluginConfig = {};
// 环境变量配置
let envConfig = require("../env.config.js");
// 包信息
let pkg = require("../package.json");
let del = require("del");
let gulp = require("gulp");
let gulpSourcemaps = require("gulp-sourcemaps");
let gulpSass = require("gulp-sass");
let gulpPostcss = require("gulp-postcss");
let gulpIf = require("gulp-if");
let autoprefixer = require("autoprefixer");
let fs = require("fs-extra");
let download = require("download-git-repo");
let gulpBabel = require("gulp-babel");
let gulpUglifyEs = require("gulp-uglify-es").default;
let shell = require("shelljs");
let commander = require("commander");
let browserSync = require("browser-sync").create("yihtml");
let px2viewport = require("postcss-px-to-viewport");
let through2 = require("through2");
let browserify = require("browserify");

gulpSass.compiler = require("sass");

// 获取不同格式的名称
function getNames(name) {
    // 页面名称转化 HelL_o-wOrld
    let lowerCaseName = _.toLower(name); // hell_o-world
    let kebabCaseName = _.kebabCase(lowerCaseName); // hell-o-world
    let camelCaseName = _.camelCase(kebabCaseName); // hellOWorld
    let startCaseName = _.replace(_.startCase(camelCaseName), /\s+/g, ""); // HellOWorld

    // 名称集合
    let namesCollection = {
        lowerCaseName,
        kebabCaseName,
        startCaseName,
        camelCaseName,
    };
    return namesCollection;
}

// 清除任务
function taskClean() {
    return del(envConfig.distDir);
}
// 项目根目录下的html任务
function taskHtml() {
    let _ = gulp
        .src(`${envConfig.srcDir}/*.html`, pluginConfig.gulp.src)
        .pipe(
            through2.obj(function (file, _, cb) {
                if (file.isBuffer()) {
                    let fileData = file.contents.toString().replace(/<include.+src="(.+)".*?>([\S\s]*?)<\/include>/gim, (match, p1, p2) => {
                        let tplPath = path.resolve(envConfig.srcDir, p1);
                        if (fs.pathExistsSync(tplPath)) {
                            let fileSource = fs.readFileSync(tplPath).toString();
                            let newFileSource = fileSource.replace("<slot></slot>", p2);
                            return newFileSource;
                        } else {
                            return "";
                        }
                    });
                    file.contents = Buffer.from(fileData);
                }

                cb(null, file);
            })
        )
        .pipe(gulp.dest(envConfig.distDir));
    return _;
}
// css任务
function taskCss() {
    return gulp
        .src(`${envConfig.srcDir}/css/*.scss`, pluginConfig.gulp.src)
        .pipe(gulpIf(process.env.NODE_MODE == "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.init({ largeFile: true })))
        .pipe(gulpSass(pluginConfig.sass))
        .pipe(gulpPostcss(pluginConfig.postcss))
        .pipe(gulpIf(process.env.NODE_MODE === "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.write("./maps")))
        .pipe(gulp.dest(`${envConfig.distDir}/css`));
}

// js任务
function taskJs() {
    return gulp
        .src(`${envConfig.srcDir}/js/*.js`)
        .pipe(gulpIf(process.env.NODE_MODE == "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.init({ largeFile: true })))
        .pipe(
            gulpIf(
                process.env.NODE_NO_BABEL === "true",
                through2.obj(function (file, enc, cb) {
                    browserify(file.path, {
                        //
                        basedir: envConfig.cliDir,
                        paths: ["node_modules"],
                        bundleExternal: true,
                    })
                        .transform("babelify", pluginConfig.babel)
                        .bundle((err, res) => {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            file.contents = res;
                            cb(null, file);
                        });
                })
            )
        )
        .pipe(gulpIf(process.env.NODE_MODE === "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.write("./maps")))
        .pipe(gulpIf(process.env.NODE_MODE === "build", gulpUglifyEs(pluginConfig.uflify)))
        .pipe(gulp.dest(`${envConfig.distDir}/js`));
}

// js任务
function taskImage() {
    return gulp.src(`${envConfig.srcDir}/images/**/*`).pipe(gulp.dest(`${envConfig.distDir}/images`));
}
// fonts任务
function taskPublicFonts() {
    return gulp.src(`${envConfig.srcDir}/public/fonts/**/*`).pipe(gulp.dest(`${envConfig.distDir}/public/fonts`));
}
// 公共css任务
function taskPublicCss() {
    return gulp
        .src(`${envConfig.srcDir}/public/css/*.scss`, pluginConfig.gulp.src)
        .pipe(gulpIf(process.env.NODE_MODE == "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.init({ largeFile: true })))
        .pipe(gulpSass(pluginConfig.sass))
        .pipe(gulpPostcss(pluginConfig.postcss))
        .pipe(gulpIf(process.env.NODE_MODE === "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.write("./maps")))
        .pipe(gulp.dest(`${envConfig.distDir}/public/css`));
}

// 公共js任务
function taskPublicJs() {
    return gulp
        .src(`${envConfig.srcDir}/public/js/*.js`)
        .pipe(gulpIf(process.env.NODE_MODE == "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.init({ largeFile: true })))
        .pipe(
            gulpIf(
                process.env.NODE_NO_BABEL === "true",
                through2.obj(function (file, enc, cb) {
                    browserify(file.path, {
                        //
                        basedir: envConfig.cliDir,
                        paths: ["node_modules"],
                        bundleExternal: true,
                    })
                        .transform("babelify", pluginConfig.babel)
                        .bundle((err, res) => {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            file.contents = res;
                            cb(null, file);
                        });
                })
            )
        )
        .pipe(gulpIf(process.env.NODE_MODE === "dev" && process.env.NODE_NO_MAP !== "false", gulpSourcemaps.write("./maps")))
        .pipe(gulpIf(process.env.NODE_MODE === "build", gulpUglifyEs(pluginConfig.uflify)))
        .pipe(gulp.dest(`${envConfig.distDir}/public/js`));
}
// 公共image任务
function taskPublicImage() {
    return gulp.src(`${envConfig.srcDir}/public/images/**/*`).pipe(gulp.dest(`${envConfig.distDir}/public/images`));
}

// 复制static静态文件
function taskStatic() {
    return gulp.src(`${envConfig.srcDir}/static/**/*`, pluginConfig.gulp.src).pipe(gulp.dest(`${envConfig.distDir}/static`));
}

// 启动项目
async function start() {
    try {
        // 插件默认配置
        pluginConfig = require("../plugin.config.js");
        // 用户自定义配置
        let yihtmlConfigPath = path.resolve(envConfig.rootDir, "yihtml.config.js");
        if (fs.pathExists(yihtmlConfigPath)) {
            let yihtmlConfigData = require(yihtmlConfigPath);
            if (_.isObject(yihtmlConfigData)) {
                pluginConfig = _.merge(pluginConfig, yihtmlConfigData);
            }
        }
        // 添加postCss插件
        if (pluginConfig.env.stylelint === true) {
            pluginConfig.postcss.push(stylelint(pluginConfig.stylelint));
        }

        if (pluginConfig.px2viewport.enable !== false) {
            pluginConfig.postcss.push(px2viewport(pluginConfig.px2viewport));
        }

        pluginConfig.postcss.push(autoprefixer());
        if (process.env.NODE_MODE === "dev") {
            if (process.env.NODE_LAB === "true") {
                console.log("实验环境打包中");
            } else {
                console.log("开发环境启动中");
            }
        } else {
            console.log("发布环境资源构建中，请耐心等待...");
        }
        gulp.series(
            //
            taskClean,
            gulp.parallel(
                //
                taskHtml,
                taskCss,
                taskJs,
                taskImage,
                taskPublicFonts,
                taskPublicCss,
                taskPublicJs,
                taskPublicImage,
                taskStatic
            ),
            function () {
                if (process.env.NODE_MODE === "dev") {
                    if (process.env.NODE_LAB === "true") {
                        console.log("实验环境打包完毕");
                    } else {
                        browserSync.init({
                            server: {
                                baseDir: path.resolve(envConfig.distDir),
                            },
                            open: false,
                        });
                        console.log("开发环境启动完毕");
                    }
                }
                if (process.env.NODE_MODE === "build") {
                    console.log("发布环境资源打包完毕");
                }
            }
        )();
    } catch (err) {
        console.log("err");
        console.log(err);
    }
}
// 下载项目
async function downloadProject() {
    return new Promise((resolve, reject) => {
        download("https://gitee.com:banshiweichen/yihtml-template#master", envConfig.tempDir, { clone: true }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
// 初始化项目
async function init() {
    try {
        console.log("yihtml-template模板下载中...");
        fs.removeSync(envConfig.tempDir);
        fs.ensureDirSync(envConfig.tempDir);
        await downloadProject();
        fs.copySync(envConfig.tempDir, envConfig.rootDir, { overwrite: true });
        fs.removeSync(envConfig.tempDir);
        console.log("yihtml-template模板下载成功");
    } catch (err) {
        console.log("yihtml-template模板下载失败");
        console.log(err);
    }
}

commander.program
    //
    .command("new")
    .option("-p, --page <页面名称>", "自动生成页面")
    .description("自动生成指令")
    .action(async (cmd) => {
        if (cmd.page) {
            try {
                // 获取名称转化集合
                let names = getNames(cmd.page);

                // 创建html
                let htmlFilePath = path.resolve(envConfig.srcDir, names.kebabCaseName + ".html");
                let htmlFileData = _.template(require("../template/html.js"))(names);
                fs.outputFileSync(htmlFilePath, htmlFileData);

                // 创建js
                let jsFilePath = path.resolve(envConfig.srcDir, "js", names.kebabCaseName + ".js");
                let jsFileData = _.template(require("../template/js.js"))(names);
                fs.outputFileSync(jsFilePath, jsFileData);

                // 创建scss
                let scssFilePath = path.resolve(envConfig.srcDir, "css", names.kebabCaseName + ".scss");
                let scssFileData = _.template(require("../template/scss.js"))(names);
                fs.outputFileSync(scssFilePath, scssFileData);

                console.log(`${cmd.page} 页面创建成功`);
            } catch (err) {
                console.log(`${cmd.page} 页面创建失败`);
                console.log(err);
            }
        }
    });
commander.program
    //
    .command("del")
    .option("-p, --page <页面名称>", "自动删除页面")
    .description("自动删除指令")
    .action(async (cmd) => {
        if (cmd.page) {
            try {
                let names = getNames(cmd.page);
                // html文件路径
                let htmlFilePath = path.resolve(envConfig.srcDir, names.camelCaseName + ".html");
                fs.removeSync(htmlFilePath);
                // js文件路径
                let jsFilePath = path.resolve(envConfig.srcDir, "js", names.camelCaseName + ".js");
                fs.removeSync(jsFilePath);
                // scss文件路径
                let scssFilePath = path.resolve(envConfig.srcDir, "css", names.camelCaseName + ".scss");
                fs.removeSync(scssFilePath);

                console.log(`${cmd.page} 页面删除成功`);
            } catch (err) {
                console.log(`${cmd.page} 页面删除失败`);
            }
        }
    });
commander.program
    //
    .command("init")
    .description("创建项目和结构")
    .action(async (source) => {
        await init();
    });
commander.program
    //
    .command("build")
    .description("发布环境打包")
    .action(async (cmd) => {
        shell.env["NODE_MODE"] = "build";
        start();
    });
commander.program
    //
    .command("dev")
    .option("--lab", "开启实验打包", false)
    .option("--no-babel", "是否开启babel转译", false)
    .option("--no-map", "是否开启map文件", false)
    .description("启动开发环境")
    .action(async (cmd) => {
        shell.env["NODE_LAB"] = cmd.lab;
        shell.env["NODE_NO_BABEL"] = cmd.babel;
        shell.env["NODE_NO_MAP"] = cmd.map;
        shell.env["NODE_MODE"] = "dev";
        start();
        if (cmd.lab === false) {
            gulp.watch(path.normalize(`${envConfig.srcDir}/*.html`).replace(/\\/gm, "/"), function (cb) {
                console.log("页面html文件已处理");
                gulp.series(taskHtml)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/tpls/*.html`).replace(/\\/gm, "/"), function (cb) {
                console.log("模板html文件已处理");
                gulp.series(taskHtml)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/css/*.scss`).replace(/\\/gm, "/"), function (cb) {
                console.log("页面css文件已处理");
                gulp.series(taskCss)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/js/*.js`).replace(/\\/gm, "/"), function (cb) {
                console.log("页面js文件已处理");
                gulp.series(taskJs)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/images/**/*`).replace(/\\/gm, "/"), function (cb) {
                console.log("页面images文件已处理");
                gulp.series(taskImage)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/public/fonts/**/*`).replace(/\\/gm, "/"), function (cb) {
                console.log("fonts文件已处理");
                gulp.series(taskPublicFonts)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/public/css/*.scss`).replace(/\\/gm, "/"), function (cb) {
                console.log("公共css文件已处理");
                gulp.series(taskPublicCss)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/public/js/*.js`).replace(/\\/gm, "/"), function (cb) {
                console.log("公共js文件已处理");
                gulp.series(taskPublicJs)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/public/images/**/**`).replace(/\\/gm, "/"), function (cb) {
                console.log("公共image文件已处理");
                gulp.series(taskPublicImage)();
                browserSync.reload();
                cb();
            });
            gulp.watch(path.normalize(`${envConfig.srcDir}/static/**/*`).replace(/\\/gm, "/"), function (cb) {
                console.log("静态资源文件已处理");
                gulp.series(taskStatic)();
                browserSync.reload();
                cb();
            });
        }
    });
commander.program
    //
    .version(pkg.version, "-v, --version", "显示yihtml版本")
    .helpOption("-h, --help", "显示帮助信息")
    .helpInformation();
commander.program
    //
    .parse(process.argv);
