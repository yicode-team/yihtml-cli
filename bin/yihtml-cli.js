#!/usr/bin/env node
"use strict";
let path = require("path");
// 环境变量配置
let envConfig = require("../env.config.js");
// 处理工具配置
let pluginConfig = {};
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
// let gulpImage = require("gulp-image");
let gulpUglifyEs = require("gulp-uglify-es").default;
let shell = require("shelljs");
let commander = require("commander");
let _ = require("lodash");
let browserSync = require("browser-sync").create();
let px2viewport = require("postcss-px-to-viewport");
let through2 = require("through2");
let figlet = require("figlet");
let pkg = require("../package.json");
let figletFont = require("../fonts/Epic.js");
let tempDir = path.resolve(envConfig.rootDir, "temp");
let initDir = path.resolve(envConfig.rootDir);
gulpSass.compiler = require("node-sass");
figlet.parseFont("figletFont", figletFont);
let appConfigFilePath = path.resolve(envConfig.rootDir, "yihtml.config.js");
let appConfig = {};
if (fs.pathExists(appConfigFilePath) === true) {
    appConfig = require(appConfigFilePath);
}

// 清除任务
function taskClean() {
    return del(envConfig.distDir);
}
// 项目根目录下的html任务
function taskHtml() {
    return (
        gulp
            //
            .src(`${envConfig.srcDir}/*.html`, pluginConfig.srcParams)
            .pipe(
                through2.obj(function (file, _, cb) {
                    if (file.isBuffer()) {
                        let fileData = file.contents.toString().replace(/<include.+src="(.+)".+\/>/gim, (match, p1) => {
                            let tplPath = path.resolve(envConfig.srcDir, p1);
                            if (fs.pathExistsSync(tplPath)) {
                                return fs.readFileSync(tplPath);
                            }
                        });
                        file.contents = Buffer.from(fileData);
                    }

                    cb(null, file);
                })
            )
            .pipe(gulp.dest(envConfig.distDir))
    );
}
// css任务
function taskCss() {
    return gulp
        .src(`${envConfig.srcDir}/css/*.scss`, pluginConfig.srcParams)
        .pipe(gulpIf(process.env.NODE_ENV == "dev", gulpSourcemaps.init({ largeFile: true })))
        .pipe(gulpSass(pluginConfig.sassParams))
        .pipe(gulpPostcss(pluginConfig.postcssParams))
        .pipe(gulpIf(process.env.NODE_ENV === "dev", gulpSourcemaps.write("./maps")))
        .pipe(gulp.dest(`${envConfig.distDir}/css`));
}

// js任务
function taskJs() {
    return gulp
        .src(`${envConfig.srcDir}/js/*.js`)
        .pipe(gulpIf(process.env.NODE_ENV == "dev", gulpSourcemaps.init({ largeFile: true })))
        .pipe(gulpBabel(pluginConfig.babelParams))
        .pipe(gulpIf(process.env.NODE_ENV === "dev", gulpSourcemaps.write("./maps")))
        .pipe(gulpIf(process.env.NODE_ENV === "build", gulpUglifyEs(pluginConfig.uflifyParams)))
        .pipe(gulp.dest(`${envConfig.distDir}/js`));
}

// js任务
function taskImage() {
    return (
        gulp
            .src(`${envConfig.srcDir}/images/**/*`)
            // .pipe(gulpIf(process.env.NODE_ENV === "build", gulpImage(pluginConfig.imageParams)))
            .pipe(gulp.dest(`${envConfig.distDir}/images`))
    );
}
// fonts任务
function taskPublicFonts() {
    return (
        gulp
            .src(`${envConfig.srcDir}/public/fonts/**/*`)
            // .pipe(gulpIf(process.env.NODE_ENV === "build", gulpImage(pluginConfig.imageParams)))
            .pipe(gulp.dest(`${envConfig.distDir}/public/fonts`))
    );
}
// 公共css任务
function taskPublicCss() {
    return gulp
        .src(`${envConfig.srcDir}/public/css/*.scss`, pluginConfig.srcParams)
        .pipe(gulpIf(process.env.NODE_ENV == "dev", gulpSourcemaps.init({ largeFile: true })))
        .pipe(gulpSass(pluginConfig.sassParams))
        .pipe(gulpPostcss(pluginConfig.postcssParams))
        .pipe(gulpIf(process.env.NODE_ENV === "dev", gulpSourcemaps.write("./maps")))
        .pipe(gulp.dest(`${envConfig.distDir}/public/css`));
}
// 公共js任务
function taskPublicJs() {
    return gulp
        .src(`${envConfig.srcDir}/public/js/*.js`)
        .pipe(gulpIf(process.env.NODE_ENV == "dev", gulpSourcemaps.init({ largeFile: true })))
        .pipe(gulpBabel(pluginConfig.babelParams))
        .pipe(gulpIf(process.env.NODE_ENV === "dev", gulpSourcemaps.write("./maps")))
        .pipe(gulpIf(process.env.NODE_ENV === "build", gulpUglifyEs(pluginConfig.uflifyParams)))
        .pipe(gulp.dest(`${envConfig.distDir}/public/js`));
}
// 公共image任务
function taskPublicImage() {
    return (
        gulp
            .src(`${envConfig.srcDir}/public/images/**/*`)
            // .pipe(gulpIf(process.env.NODE_ENV === "build", gulpImage(pluginConfig.imageParams)))
            .pipe(gulp.dest(`${envConfig.distDir}/public/images`))
    );
}

// 复制static静态文件
function taskStatic() {
    return gulp.src(`${envConfig.srcDir}/static/**/*`, pluginConfig.srcParams).pipe(gulp.dest(`${envConfig.distDir}/static`));
}
async function start() {
    pluginConfig = require("../plugin.config.js")[process.env.NODE_ENV];
    // 添加postCss插件
    // postcssArray.push(stylelint());
    if (appConfig.mobile === true) {
        pluginConfig.postcssParams.push(px2viewport(pluginConfig.px2viewport));
    }

    pluginConfig.postcssParams.push(autoprefixer());
    if (process.env.NODE_ENV === "dev") {
        console.log("开发环境启动中");
    } else {
        console.log("发布环境资源构建中，包含图片压缩，请耐心等待...");
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
            if (process.env.NODE_ENV === "dev") {
                browserSync.init({
                    server: {
                        baseDir: path.resolve(envConfig.distDir),
                    },
                });
                console.log("开发环境启动完毕");
            }
            if (process.env.NODE_ENV === "build") {
                console.log("发布环境资源打包完毕");
            }
        }
    )();
}
// 下载项目
async function downloadProject() {
    return new Promise((resolve, reject) => {
        download("https://gitee.com:banshiweichen/yihtml-template#master", tempDir, { clone: true }, function (err) {
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
        fs.removeSync(tempDir);
        fs.ensureDirSync(tempDir);
        await downloadProject();
        fs.copySync(tempDir, initDir, { overwrite: true });
        fs.removeSync(tempDir);
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
                // 页面名称转化 HelL_o-wOrld
                let lowerCaseName = _.toLower(cmd.page); // hell_o-world
                let kebabCaseName = _.kebabCase(lowerCaseName); // hell-o-world
                let camelCaseName = _.camelCase(kebabCaseName); // hellOWorld
                let startCaseName = _.replace(_.startCase(camelCaseName), /\s+/g, ""); // HellOWorld

                let paramsName = {
                    lowerCaseName,
                    kebabCaseName,
                    startCaseName,
                    camelCaseName,
                };

                // 创建html
                let htmlFilePath = path.resolve(envConfig.srcDir, camelCaseName + ".html");
                let htmlFileData = _.template(require("../template/html.js"))(paramsName);
                fs.outputFileSync(htmlFilePath, htmlFileData);

                // 创建js
                let jsFilePath = path.resolve(envConfig.srcDir, "js", camelCaseName + ".js");
                let jsFileData = _.template(require("../template/js.js"))(paramsName);
                fs.outputFileSync(jsFilePath, jsFileData);

                // 创建scss
                let scssFilePath = path.resolve(envConfig.srcDir, "css", camelCaseName + ".scss");
                let scssFileData = _.template(require("../template/scss.js"))(paramsName);
                fs.outputFileSync(scssFilePath, scssFileData);

                // 创建图片模流
                let imageDirPath = path.resolve(envConfig.srcDir, "images", camelCaseName);
                fs.ensureDirSync(imageDirPath);

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
                // 页面名称转化 HelL_o-wOrld
                let lowerCaseName = _.toLower(cmd.page); // hell_o-world
                let kebabCaseName = _.kebabCase(lowerCaseName); // hell-o-world
                let camelCaseName = _.camelCase(kebabCaseName); // hellOWorld
                let startCaseName = _.replace(_.startCase(camelCaseName), /\s+/g, ""); // HellOWorld
                // html文件路径
                let htmlFilePath = path.resolve(envConfig.srcDir, camelCaseName + ".html");
                fs.removeSync(htmlFilePath);
                // js文件路径
                let jsFilePath = path.resolve(envConfig.srcDir, "js", camelCaseName + ".js");
                fs.removeSync(jsFilePath);
                // scss文件路径
                let scssFilePath = path.resolve(envConfig.srcDir, "css", camelCaseName + ".scss");
                fs.removeSync(scssFilePath);
                // image目录路径
                let imageDirPath = path.resolve(envConfig.srcDir, "images", camelCaseName);
                fs.removeSync(imageDirPath);

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
    .action(async (source) => {
        shell.env["NODE_ENV"] = "build";
        start();
    });
commander.program
    //
    .command("dev")
    .description("启动开发环境")
    .action(async (source) => {
        shell.env["NODE_ENV"] = "dev";
        start();
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
    });
commander.program
    //
    .version(pkg.version, "-v, --version", "显示yihtml版本")
    .helpOption("-h, --help", "显示帮助信息")
    .helpInformation();
commander.program
    //
    .parse(process.argv);
