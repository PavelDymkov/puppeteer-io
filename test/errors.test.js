const puppeteer = require("puppeteer");
const io = require("../index.js");
const { getTestPageUrl } = require("./lib.js");


const url = getTestPageUrl(__filename);
let browser, page;

beforeAll(async () => {
    browser = await puppeteer.launch();
});

beforeEach(async () => {
    page = await browser.newPage();

    await page.goto(url);
});

afterEach(async () => {
    await page.close();
});

afterAll(async () => {
    await browser.close();
});

test(`error catched`, done => {
    io({
        page, done,
        async input() {
            await page.click("button");
        },
        async output({ error }) {
            await error("button error message");
        }
    });
});

test(`error catched by RegExp`, done => {
    io({
        page, done,
        async input() {
            await page.click("button");
        },
        async output({ error }) {
            await error(/TypeError:/);
        }
    });
});
