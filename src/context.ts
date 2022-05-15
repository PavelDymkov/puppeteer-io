import { ConsoleMessage, Page } from "puppeteer";

import { Api } from "./interfaces";

interface Message {
    text: string;
    data: any;
}

interface Handler {
    (): void;
}

export class Context {
    private readonly messageStack: Message[] = [];
    private readonly errorStack: Error["message"][] = [];

    private logHandler?: Handler;
    private errorHandler?: Handler;

    private readonly message: Api["message"] = async (content: string) => {
        return this.createHandlerAndAwait(
            this.messageStack,
            "logHandler",
            ({ text }) => text === content,
            ({ data }) => data,
        );
    };

    private readonly error: Api["error"] = async (pattern) => {
        const regExp =
            typeof pattern == "string" ? new RegExp(pattern) : pattern;

        return this.createHandlerAndAwait(
            this.errorStack,
            "errorHandler",
            (error) => regExp.test(error),
            (error) => error,
        );
    };

    private readonly onConsole = async (
        message: ConsoleMessage,
    ): Promise<void> => {
        if (message.type() !== "log") return;

        const [messageSource, dataSource] = message.args();

        const text = messageSource
            ? await messageSource.jsonValue<any>()
            : null;
        const data = dataSource ? await dataSource.jsonValue<any>() : null;

        if (typeof text === "string") {
            this.messageStack.push({ text, data });

            this.logHandler?.();
        }
    };

    private readonly onPageError = ({ message }: Error): void => {
        this.errorStack.push(message);

        this.errorHandler?.();
    };

    constructor(private readonly page: Page) {
        page.on("console", this.onConsole);
        page.on("pageerror", this.onPageError);
    }

    getApi(): Api {
        return {
            message: this.message,
            error: this.error,
        };
    }

    dispose(): void {
        this.page.off("console", this.onConsole);
        this.page.off("pageerror", this.onPageError);
    }

    private async createHandlerAndAwait<T, U>(
        stack: U[],
        name: "logHandler" | "errorHandler",
        check: (item: U) => boolean,
        value: (item: U) => T,
    ): Promise<T> {
        return new Promise((resolve) => {
            const handler: Handler = () => {
                for (let i = 0, lim = stack.length; i < lim; i++) {
                    const item = stack[i]!;

                    if (check(item)) {
                        stack.splice(0, i + 1);

                        delete this[name];

                        resolve(value(item));

                        break;
                    }
                }
            };

            this[name] = handler;

            if (stack.length > 0) this[name]!();
        });
    }
}
