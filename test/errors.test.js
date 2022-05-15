const puppeteer = require("puppeteer");

const io = require("../package/index.js");

const url = `file://${__dirname}/pages/errors.html`;
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

test(`error catched`, (done) => {
    io({
        page,
        done,
        async input() {
            await page.click("button");
        },
        async output({ error }) {
            await error("button error message");
        },
    });
});

test(`error catched by RegExp`, (done) => {
    io({
        page,
        done,
        async input() {
            await page.click("button");
        },
        async output({ error }) {
            await error(/TypeError:/);
        },
    });
});

test(`full message text received`, (done) => {
    io({
        page,
        done,
        async input() {
            await page.click("button");
        },
        async output({ error }) {
            let errorMessage = await error("button error message");
            let isCorrectMessage =
                /TypeError: button error message\s+at HTMLButtonElement/.test(
                    errorMessage,
                );

            expect(isCorrectMessage).toBeTruthy();
        },
    });
});
