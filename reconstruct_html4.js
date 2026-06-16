const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, { runScripts: "dangerously", url: "http://localhost" });
try {
    const scriptContent = fs.readFileSync('index/render_index.js', 'utf8');
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    dom.window.document.body.appendChild(scriptEl);
    fs.writeFileSync('index_decoded_jsdom.html', dom.serialize());
    console.log('Success');
} catch(e) { console.error(e); }
