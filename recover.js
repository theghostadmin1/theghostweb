const fs = require('fs');

global.window = global;
global.atob = function(b64) {
    return Buffer.from(b64, 'base64').toString('binary');
};
global.decodeURIComponent = decodeURIComponent;
global.escape = escape;

let recoveredBody = '';
global.document = {
    body: {}
};
Object.defineProperty(global.document.body, 'innerHTML', {
    set: function(val) {
        recoveredBody = val;
    }
});

// Add mock for anti-debugger things
global.setInterval = () => {};
global.Function = function() { return function() {}; };

try {
    require('./index/render_index.js');
    let html = fs.readFileSync('index.html', 'utf8');
    html = html.replace(/<body>[\s\S]*?<\/body>/i, `<body>\n${recoveredBody}\n</body>`);
    fs.writeFileSync('index.html', html);
    console.log('Recovered index.html');
} catch (e) { console.error('Error recovering index.html', e.message); }

try {
    recoveredBody = '';
    require('./index/render_bemy.js');
    let html = fs.readFileSync('bemy.html', 'utf8');
    html = html.replace(/<body>[\s\S]*?<\/body>/i, `<body>\n${recoveredBody}\n</body>`);
    fs.writeFileSync('bemy.html', html);
    console.log('Recovered bemy.html');
} catch (e) { console.error('Error recovering bemy.html', e.message); }
