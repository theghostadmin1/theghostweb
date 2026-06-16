const fs = require('fs');
global.window = global;
global.atob = function(b64) {
    return Buffer.from(b64, 'base64').toString('binary');
};
global.decodeURIComponent = decodeURIComponent;
global.escape = escape;
let recoveredBody = '';
global.document = { body: {} };
Object.defineProperty(global.document.body, 'innerHTML', {
    set: function(val) { recoveredBody = val; }
});
Object.defineProperty(global.document, 'write', {
    value: function(val) { recoveredBody += val; }
});
global.setInterval = () => {};
global.Function = function() { return function() {}; };
try {
    require('./index/render_index.js');
    fs.writeFileSync('index_decoded_full.html', recoveredBody);
    console.log('Done');
} catch (e) { console.error('Error', e.message); }
