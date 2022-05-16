const puppeteer = require("puppeteer");

const io = require("../package/io.js");

const url = `file://${__dirname}/pages/messages.html`;
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

test(`message received`, (done) => {
    io({
        page,
        done,
        async input() {
            await page.focus("input");
        },
        async output({ message }) {
            await message("input-onFocus");
        },
    });
});

test(`data from message received`, (done) => {
    io({
        page,
        done,
        async input() {
            let input = await page.$("input");

            await input.focus();
            await input.press("Enter");
        },
        async output({ message }) {
            let { keyCode } = await message("input-onKeypress");

            expect(keyCode).toBe(ENTER_KEY);
        },
    });
});

test(`complex test`, (done) => {
    io({
        page,
        done,
        async input() {
            let input = await page.$("input");

            await input.focus();
            await input.press("Enter");
        },
        async output({ message }) {
            await message("input-onFocus");

            let { keyCode } = await message("input-onKeypress");

            expect(keyCode).toBe(ENTER_KEY);
        },
    });
});

test(`message spam test`, (done) => {
    let lim = 9;

    io({
        page,
        done,
        async input() {
            let executionContext = await page.mainFrame().executionContext();

            await executionContext.evaluate((lim) => {
                for (let i = 0; i < lim; i++) {
                    console.log(`message ${i}`);
                }

                return Promise.resolve();
            }, lim);
        },
        async output({ message }) {
            for (let i = 0; i < lim; i++) {
                await message(`message ${i}`);
            }
        },
    });
});
