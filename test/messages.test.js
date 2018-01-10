const puppeteer = require("puppeteer");
const io = require("../index.js");
const { getTestPageUrl } = require("./lib.js");


const url = getTestPageUrl(__filename);
const ENTER_KEY = 13;
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

test(`message received`, done => {
    io({
        page, done,
        async input() {
            await page.focus("input");
        },
        async output({ message }) {
            await message("input-onFocus");
        }
    });
});

test(`data from message received`, done => {
    io({
        page, done,
        async input() {
            let input = await page.$("input");

            await input.focus();
            await input.press("Enter");
        },
        async output({ dataFromMessage }) {
            let { keyCode } = await dataFromMessage("input-onKeypress");

            expect(keyCode).toBe(ENTER_KEY);
        }
    });
});

test(`complex test`, done => {
    io({
        page, done,
        async input() {
            let input = await page.$("input");

            await input.focus();
            await input.press("Enter");
        },
        async output({ message, dataFromMessage }) {
            await message("input-onFocus");

            let { keyCode } = await dataFromMessage("input-onKeypress");

            expect(keyCode).toBe(ENTER_KEY);
        }
    });
});
