import { Page } from "puppeteer";

export interface Options {
    page: Page;

    input?(): Promise<void>;
    output?(api: Api): Promise<void>;

    done?(): void;
}

export interface Api {
    message(content: string): Promise<any>;
    error(pattern: string | RegExp): Promise<string>;
}
