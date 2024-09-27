import { JSDOM } from "jsdom";

export function removeJavaScriptAndEvents(html: string): string {
    const dom = new JSDOM(html);
    const document = dom.window.document;
  
    // Remove script tags
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      scripts[i].remove();
    }
  
    // Remove on* attributes (event handlers)
    const allElements = document.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const attributes = allElements[i].attributes;
      for (let j = attributes.length - 1; j >= 0; j--) {
        if (attributes[j].name.toLowerCase().startsWith('on')) {
          allElements[i].removeAttribute(attributes[j].name);
        }
      }
    }
  
    return document.documentElement.outerHTML;
  }