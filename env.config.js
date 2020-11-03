const path = require("path");
const cliDir = path.resolve(__dirname);
const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, "src");
const distDir = path.resolve(rootDir, "dist");
module.exports = {
    cliDir,
    rootDir,
    srcDir,
    distDir,
};
