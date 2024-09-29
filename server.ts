// server.ts
import express from "express";
import { WebSocketServer } from "ws";
import { JSDOM } from "jsdom";
import { createServer } from "node:http";
import { removeJavaScriptAndEvents } from "./utils/common.ts";

const url = "https://harshkapadia2.github.io/react-js-counter/";
const port = 3000;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

let dom: JSDOM;
let websocket: WebSocket;

async function setupJSDOM() {
  if (dom) // shared same content for all clients to test the idea
    return;

  const response = await fetch(url);
  const html = await response.text();
  dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    resources: "usable",
    includeNodeLocations: true,
    pretendToBeVisual: true
  });

  const { window } = dom;
  const { document } = window;

  // Set up MutationObserver
  const observer = new window.MutationObserver((mutations) => {
    for (let mutation of mutations) {
      // Send mutation details to the client
      websocket.send(JSON.stringify({
        type: 'mutation',
        selector: generateSelector(mutation.target),
        addedNodes: [...mutation.addedNodes].map(n => removeJavaScriptAndEvents((n as Element).outerHTML)),
        removedNodes: [...mutation.removedNodes].map(n => removeJavaScriptAndEvents((n as Element).outerHTML)),
        attribute: mutation.type === 'attributes' ? {
          name: mutation.attributeName,
          value: (mutation.target as Element).getAttribute(mutation.attributeName),
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
  document.addEventListener('click', (event) => {
    websocket.send(JSON.stringify({
      type: 'event',
      eventType: 'click',
      selector: generateSelector(event.target as Element),
    }));
  });

  document.addEventListener('change', (event) => {
    websocket.send(JSON.stringify({
      type: 'event',
      eventType: 'change',
      selector: generateSelector(event.target as Element),
      value: (event.target as HTMLInputElement).value,
    }));
  });
}

function generateSelector(context: Element): string {
  let index, pathSelector;

  function getIndex(node: Element): number {
    let i = 1;
    let tagName = node?.tagName;

    while (node.previousElementSibling) {
      node = node.previousElementSibling;
      if (tagName.toLowerCase() == node?.tagName.toLowerCase()) {
        i++;
      }
    }
    return i;
  }

  index = getIndex(context);

  while (context?.tagName) {
    pathSelector = context.localName + (pathSelector ? ">" + pathSelector : "");
    context = context.parentElement as HTMLElement;
  }
  pathSelector = pathSelector + `:nth-of-type(${index})`;
  return pathSelector;
}

wss.on("connection", async (ws) => {
  console.log("Client connected");
  websocket = ws;

  await setupJSDOM();

  // Send initial page content
  ws.send(JSON.stringify({
    type: 'initial',
    content: removeJavaScriptAndEvents(dom.window.document.documentElement.outerHTML),
  }));

  // Handle messages from the client
  ws.on("message", (message: string) => {
    const data = JSON.parse(message.toString());
    if (data.type === 'event') {
      // Handle client-side events on the server
      const { document } = dom.window;
      const target = document.querySelector(data.selector) as HTMLElement;
      if (target) {
        switch (data.eventType) {
          case 'click':
            target.click();
            break;
          case 'change':
            var nativeInputValueSetter = dom.window.Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(target, data.value);
            var event = new dom.window.Event('input', { bubbles: true });
            target.dispatchEvent(event);
            break;
        }
      }
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