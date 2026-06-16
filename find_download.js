const fs = require('fs');
const js = fs.readFileSync('e:\\TheGhostWeb\\index\\render_index.js', 'utf8');
const match = js.match(/window\.atob\('(.*?)'\)/);
if (match) {
    const html = Buffer.from(match[1], 'base64').toString('utf8');
    const lines = html.split('\n');
    lines.forEach((l, i) => {
        if (l.toLowerCase().includes('tải')) {
            console.log(i + 1, ':', l.trim());
        }
    });
}
