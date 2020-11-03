#!/usr/bin/env node
"use strict";
const path = require("path");
// 环境变量配置
const envConfig = require("../env.config.js");
// 处理工具配置
const pluginConfig = require("../plugin.config.js")["dev"];
const appConfig = require(path.resolve(envConfig.rootDir, "yihtml.config.js"));
const del = require("del");
const gulp = require("gulp");
const gulpSourcemaps = require("gulp-sourcemaps");
const gulpSass = require("gulp-sass");
const gulpPostcss = require("gulp-postcss");
const gulpIf = require("gulp-if");
const autoprefixer = require("autoprefixer");
const fs = require("fs-extra");
const download = require("download-git-repo");
const gulpBabel = require("gulp-babel");
const gulpImage = require("gulp-image");
const gulpUglifyEs = require("gulp-uglify-es").default;
const shell = require("shelljs");
const commander = require("commander");
const browserSync = require("browser-sync").create();
const px2viewport = require("postcss-px-to-viewport");
const figlet = require("figlet");
const pkg = require("../package.json");
const figletFont = require("../fonts/Epic.js");
const tempDir = path.resolve(envConfig.rootDir, "temp");
const initDir = path.resolve(envConfig.rootDir);
gulpSass.compiler = require("node-sass");
figlet.parseFont("figletFont", figletFont);
console.log("appConfig");
console.log(appConfig);

// 添加postCss插件
// postcssArray.push(stylelint());
if (appConfig.mobile === true) {
    pluginConfig.postcssParams.push(px2viewport(pluginConfig.px2viewport));
}

pluginConfig.postcssParams.push(autoprefixer());
// 清除任务
function taskClean() {
    return del(envConfig.distDir);
}
// 项目根目录下的html任务
function taskHtml() {
    return gulp.src(`${envConfig.srcDir}/*.html`, pluginConfig.srcParams).pipe(gulp.dest(envConfig.distDir));
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
    return gulp
        .src(`${envConfig.srcDir}/images/**/*`)
        .pipe(gulpIf(process.env.NODE_ENV === "build", gulpImage(pluginConfig.imageParams)))
        .pipe(gulp.dest(`${envConfig.distDir}/images`));
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

// 复制static静态文件
function taskStatic(item) {
    return gulp.src(`${envConfig.srcDir}/static/**/*`, pluginConfig.srcParams).pipe(gulp.dest(`${envConfig.distDir}/static`));
}
async function start() {
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
            taskPublicCss,
            taskJs,
            taskImage,
            taskPublicJs,
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
