import { Context } from "./context";
import { Options } from "./interfaces";

async function io({ input, output, page, done }: Options): Promise<void> {
    const context = new Context(page);
    const promises: Promise<void>[] = [];

    if (input) promises.push(input());
    if (output) promises.push(output(context.getApi()));

    await Promise.all(promises);

    context.dispose();

    done?.();
}

export = io;
