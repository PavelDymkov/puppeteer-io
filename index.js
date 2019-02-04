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

    let instance = { messageStack: [] };
    let logsListener = logsListenerOrigin.bind(instance);
    let errorsListener = errorsListenerOrigin.bind(instance);

    page.on("console", logsListener);
    page.on("pageerror", errorsListener);

    return Promise.all([
        new Promise(async resolve => {
            if (typeof input == "function") {
                await input();
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

        if (typeof done == "function") done();
    });
}

function logsListenerOrigin(message) {
    if (message.type() == "log") addMessageToStack(this, message);
}

async function addMessageToStack(instance, source) {
    let [messageSource, dataSource] = source.args();

    let text = messageSource ? await messageSource.jsonValue() : null;
    let data = dataSource ? await dataSource.jsonValue() : null;

    instance.messageStack.push({ text, data });

    instance.logHandler && instance.logHandler();
}

function errorsListenerOrigin({ message }) {
    if (this.errorHandler) this.errorHandler(message);
}

function messageOrigin(message) {
    if (typeof message != "string")
        throw new Error(`message not a string`);

    return new Promise(resolve => {
        this.logHandler = () => {
            for (let i = 0, lim = this.messageStack.length; i < lim; i++) {
                let { text } = this.messageStack[i];

                if (text === message) {
                    this.messageStack = this.messageStack.slice(i + 1);

                    delete this.logHandler;

                    return void resolve();
                }
            }
        }

        if (this.messageStack.length > 0) this.logHandler();
    });
}

function dataFromMessageOrigin(message) {
    if (typeof message != "string")
        throw new Error(`message not a string`);

    return new Promise(resolve => {
        this.logHandler = () => {
            for (let i = 0, lim = this.messageStack.length; i < lim; i++) {
                let { text, data } = this.messageStack[i];

                if (text === message) {
                    this.messageStack = this.messageStack.slice(i + 1);

                    delete this.logHandler;

                    return void resolve(data);
                }
            }
        }

        if (this.messageStack.length > 0) this.logHandler();
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
