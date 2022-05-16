import { npmPackagr } from "npm-packagr";
import {
    assets,
    badge,
    git,
    npx,
    packageJSON,
    Pipeline,
    publish,
    test,
    version,
} from "npm-packagr/pipelines";

npmPackagr({
    pipelines: [
        git("commit", "puppeteer-io"),

        npx("tsc"),

        test(),

        badge("tests", {
            label: "tests",
            message: "passing",
        }),

        puppeteerVersionBadge(),

        version("patch"),

        packageJSON((packageJson) => {
            delete packageJson.devDependencies;
            delete packageJson.scripts;

            packageJson.main = "io.js";
        }),

        git("commit", "puppeteer-io"),
        git("push"),

        assets("LICENSE", "README.md"),

        publish({
            login: { account: "paveldymkov", email: "dymkov86@gmail.com" },
        }),
    ],
});

function puppeteerVersionBadge(): Pipeline {
    const { version } = require("puppeteer/package.json");

    return badge("shoelace-version", {
        label: "tests with puppeteer",
        message: String(version),
    });
}
