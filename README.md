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


### React-component testing example


Let's look at testing the React-component using the Jest framework. The source code of the React-component:


```javascript
import React from "react";
import PropTypes from "prop-types";

const iItem = PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired
});

export default class Select extends React.Component {
    static propTypes = {
        items: PropTypes.arrayOf(iItem).isRequired,
        onChange: PropTypes.func
    };

    getChangeHandler() {
        return ({ target }) => {
            if (this.props.onChange) {
                this.props.onChange(this.props.items[target.selectedIndex].id);
            }
        };
    }

    toOption(item, index) {
        return <option key={`id_${index}_${item.id}`}>
            {item.text}
        </option>
    }

    render() {
        return <select onChange={this.getChangeHandler()}>
            {this.props.items.map(this.toOption)}
        </select>
    }
}
```


Now write a page that will open in the browser to test the component.


```javascript
import React from "react";
import ReactDOM from "react-dom";
import Select from "./select-component.js";


const testItems = [
    { id: "0e210d4a-ccfd-4733-a179-8b51bda1a7a5", text: "text 1"},
    { id: "ea2cecbd-206c-4118-a1c9-8d88474e5a87", text: "text 2"},
    { id: "c812a9dc-6a54-409e-adb5-8eb09337e576", text: "text 3"}
];

console.log("test-items", testItems);

function TestPage() {
    const onChange = id => console.log("Select: change", id);
    
    return <div>
       <Select items={testItems} onChange={onChange} />
   </div>
}

ReactDOM.render(<TestPage />, document.getElementById("application"));
```


And the test code.


```javascript
const puppeteer = require("puppeteer");
const io = require("puppeteer-io");

test(`check that id is sent to onChange callback`, async done => {
    let browser = await puppeteer.launch();
    let page = await browser.newPage();
    
    await io({
        page, done,
        async input() {
            // It is important to call goto in input stream
            // if you await output data before page load
            // like: await dataFromMessage("test-items");
            await page.goto("http://localhost"); // test page url

            let select = await page.$("select");

            await select.focus();
            await select.press("Enter");
            await select.press("ArrowDown");
            await select.press("Enter");
        },
        async output({ dataFromMessage }) {
            let [,secondItem] = await dataFromMessage("test-items");
            let selectedId = await dataFromMessage("Select: change");

            expect(selectedId).toBe(secondItem.id);
        }
    });

    await page.close();
    await browser.close();
});
```


### Another example


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
const puppeteer = require("puppeteer");
const io = require("puppeteer-io");

let browser, page;

beforeAll(async () => {
    browser = await puppeteer.launch();
});

beforeEach(async () => {
    page = await browser.newPage();

    await page.goto("http://localhost");
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
```

## Documentation


```require("puppeteer-io")``` returns a function that takes as argument an object contains:


* ```page``` <[Page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page)>
The [page](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page) in which the code is executed.

* ```done``` <[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function)>
Test framework callback

* ```input()``` <[async Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction)>
The command input stream to the browser

* ```output(api)``` <[async Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction)>
The stream of receiving messages from the browser.This function provide an object contains methods:

  * ```message(id: <String>): <Promise>```
  A promise will be resolved when ```console.log(id)``` is called in the browser.
  * ```dataFromMessage(id: <String>): <Promise<JSONValue>>``` 
  * ```error(pattern: <String|RegExp>): <Promise<String>>``` 

