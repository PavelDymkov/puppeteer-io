# Puppeteer-IO


> Library for tests with Puppeteer using Jest or Mocha


**Puppeteer-IO** is a library for [Puppeteer](https://github.com/GoogleChrome/puppeteer) that parallelizes code execution into two streams: the command input stream to the browser and the stream of receiving messages from the browser.
**Puppeteer-IO** was created for writing tests, when it is necessary to check whether some code was called.
For this purpose, use the ```console.log``` call to retrieve messages from the browser.


## Install


```bash
npm i puppeteer-io
```


## Usage


Check whether the event handler was called.


**_index.html_**

```html
<input>
<script>

const focusHandler = () => console.log("input-onFocus");

document
    .querySelector("input")
    .addEventListener("focus", focusHandler, false);

</script>
```

**_on-focus.test.js_**


```javascript
const io = require("puppeteer-io");

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
```

## Documentation


```require("puppeteer-io")``` returns a function that takes an object parameter


* ```page``` <[Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page)>
The [page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page) in which the code is executed.

* ```done``` <[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)>
Test framework callback

* ```input``` <[async Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction)>

* ```output(arg)``` <[async Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction)>
Provide:

  * ```message``` <[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)>
  * ```dataFromMessage``` <[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)>
  * ```error``` <[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)>

