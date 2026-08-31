const fs = require('fs');

function debug(jsPath) {
    let js = fs.readFileSync(jsPath, 'utf8');
    const regex = /'([A-Za-z0-9+/=]{1000,})'/g;
    let match;
    let matches = [];
    while ((match = regex.exec(js)) !== null) matches.push(match[1]);
    matches.sort((a,b) => b.length - a.length);
    
    for (let i = 0; i < Math.min(3, matches.length); i++) {
        try {
            let b64 = matches[i];
            let pristineHtml = Buffer.from(b64, 'base64').toString('utf8');
            console.log(`--- MATCH ${i} for ${jsPath} ---`);
            console.log(pristineHtml.substring(0, 100));
        } catch(e) {
            console.log(e);
        }
    }
}

debug('./index/render_index.js');
