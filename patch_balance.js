const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/script.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/balance-display/g, 'header-balance');
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed balance element ID');
