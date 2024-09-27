// server.ts
import express from "express";
import { WebSocketServer } from "ws";
import puppeteer from "puppeteer";
import { createServer } from "node:http";
import { removeJavaScriptAndEvents } from "./utils/common.ts";

const url = "https://harshkapadia2.github.io/react-js-counter/";
const port = 3000;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let browser: puppeteer.Browser;
let page: puppeteer.Page;

let websocket: WebSocket;

async function setupPuppeteer() {
  if(page) // shared same content for all clients to test the idea
    return;

  browser = await puppeteer.launch({
    args: ['--headless', '--no-sandbox'],
    dumpio: true,
    headless: false,
  });
  page = await browser.newPage();
  await page.goto(url);

  // Allow the client to send messages to the end client
  await page.exposeFunction('sendWS', (data) => {
    websocket.send(data);
    return true
  });

  // Set up MutationObserver
  await page.evaluate(async () => {
    function generateSelector(context) {
      let index, pathSelector, localName;

      // call getIndex function
      index = getIndex(context);

      while (context.tagName) {
        // selector path
        pathSelector = context.localName + (pathSelector ? ">" + pathSelector : "");
        context = context.parentNode;
      }
      // selector path for nth of type
      pathSelector = pathSelector + `:nth-of-type(${index})`;
      return pathSelector;
    }

    // get index for nth of type element
    function getIndex(node) {
      let i = 1;
      let tagName = node.tagName;

      while (node.previousSibling) {
        node = node.previousSibling;
        if (
          node.nodeType === 1 &&
          tagName.toLowerCase() == node.tagName.toLowerCase()
        ) {
          i++;
        }
      }
      return i;
    }

    const observer = new MutationObserver(async (mutations) => {
      for (let mutation of mutations) {
        // Send mutation details to the client
        await sendWS(JSON.stringify({
          type: 'mutation',
          selector: generateSelector(mutation.target),
          addedNodes: [...mutation.addedNodes].map(n => removeJavaScriptAndEvents((n as Element).outerHTML)),
          removedNodes: [...mutation.removedNodes].map(n => removeJavaScriptAndEvents((n as Element).outerHTML)),
          attribute: mutation.type === 'attributes' ? {
            name: mutation.attributeName,
            value: mutation.target.getAttribute(mutation.attributeName),
          } : null,
        }));
      }
    });

    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    // Set up DOM event listeners
    document.addEventListener('click', async (event) => {
      await sendWS(JSON.stringify({
        type: 'event',
        eventType: 'click',
        selector: generateSelector(event.target),
      }));
    });

    document.addEventListener('change', async (event) => {
      await sendWS(JSON.stringify({
        type: 'event',
        eventType: 'change',
        selector: generateSelector(event.target),
        value: (event.target as HTMLInputElement).value,
      }));
    });
  });
}

wss.on("connection", async (ws) => {
  console.log("Client connected");
  websocket = ws;

  await setupPuppeteer();

  // Send initial page content
  page.content().then((content) => {
    ws.send(JSON.stringify({
      type: 'initial',
      url,
      content: removeJavaScriptAndEvents(content)
    }));
  });

  // Handle messages from the client
  ws.on("message", async (message: string) => {
    const data = JSON.parse(message.toString());
    if (data.type === 'event') {
      // Handle client-side events on the server
      await page.evaluate((data) => {
        const target: HTMLElement | any = document.querySelector(data.selector);

        if (target) {
          switch (data.eventType) {
            case 'click':
              target.click();
              break;
            case 'change':
              var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
              nativeInputValueSetter.call(target, data.value);
              
              var ev2 = new Event('input', { bubbles: true });
              target.dispatchEvent(ev2);
              break;
          }
        }
      }, data);
    }
  });
});

app.set('view engine', 'ejs');
app.set('views', 'client');
app.use(express.static('client'));

app.get("/", (req, res) => {
  res.render('serve', { url });
});

// Start the server
server.listen(port, () => {
  console.log(`Express and WebSocket server running on http://localhost:${port}`);
});
