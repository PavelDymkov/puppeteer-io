const { basename, dirname, join } = require("path");
const { statSync } = require("fs");


exports.getTestPageUrl = filePath => {
    let name = basename(filePath, ".test.js");
    let path = `${dirname(filePath)}/pages/${name}.html`;

    try {
        let stat = statSync(path);

        if (!stat.isFile()) throw new Error;
    } catch (error) {
        throw new Error(`can't find html-file: "${path}"`);
    }

    return `file://${path}`;
};
