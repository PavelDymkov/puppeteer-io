/* *
 * Copyright (c) 2018, Pavel Dymkov <dymkov86@gmail.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * */

function io(settings) {
    const { input, output, page, done } = settings;

    isAsyncFunction(input, "input");
    isAsyncFunction(output, "output");

    let instance = {};
    let logsListener = logsListenerOrigin.bind(instance);
    let errorsListener = errorsListenerOrigin.bind(instance);

    page.on("console", logsListener);
    page.on("pageerror", errorsListener);

    Promise.all([
        new Promise(async resolve => {
            if (typeof input == "function") {
                const load = loadOrigin.bind(null, page);

                await input({ load });
            }

            resolve();
        }),
        new Promise(async resolve => {
            if (typeof output == "function") {
                const message = messageOrigin.bind(instance);
                const dataFromMessage = dataFromMessageOrigin.bind(instance);
                const error = errorOrigin.bind(instance);

                await output({message, dataFromMessage, error});
            }

            resolve();
        })
    ]).then(() => {
        page.removeListener("console", logsListener);
        page.removeListener("pageerror", errorsListener);

        done();
    });
}

function logsListenerOrigin({ type, args }) {
    if (type == "log" && this.logHandler) this.logHandler(...args);
}

function errorsListenerOrigin({ message }) {
    if (this.errorHandler) this.errorHandler(message);
}

function messageOrigin(message) {
    if (typeof message != "string")
        throw new Error(`message not a string`);

    return new Promise(resolve => {
        this.logHandler = async messageSource => {
            if (!messageSource) return;

            let text = await messageSource.jsonValue();

            if (text === message) {
                delete this.logHandler;
                resolve();
            }
        }
    });
}

function dataFromMessageOrigin(message) {
    if (typeof message != "string")
        throw new Error(`message not a string`);

    return new Promise(resolve => {
        this.logHandler = async (messageSource, dataSource) => {
            if (!messageSource && !dataSource) return;

            let text = await messageSource.jsonValue();

            if (text !== message) return;

            delete this.logHandler;

            resolve(await dataSource.jsonValue());
        }
    });
}

function loadOrigin(page, url) {
    return new Promise(resolve => {
        page.on("load", function loadHandler() {
            page.removeListener("load", loadHandler);

            resolve();
        });

        page.goto(url);
    });
}

function errorOrigin(pattern) {
    if (typeof pattern == "string") {
        pattern = new RegExp(pattern);
    }

    if (pattern instanceof RegExp == false) {
        throw new Error(`pattern not a string or RegExp`);
    }

    return new Promise(resolve => {
        this.errorHandler = error => {
            if (pattern.test(error)) {
                resolve(error);
            }
        };
    });
}

function isAsyncFunction(value, name) {
    if (typeof value == "function") {
        if (value.constructor.name != "AsyncFunction") {
            throw new Error(`${name}() parameter not an async function`);
        }
    }
}

module.exports = io;
