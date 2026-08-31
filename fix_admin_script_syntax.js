const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

const badBlock = `} catch(e) {}\n        });\n    }\n});`;
// Let's replace the leftover junk that causes syntax error
content = content.replace(/\} catch\(e\) \{\}\s*\}\);\s*\}\s*\}\);/, '');
// Actually, let's just use regex to find `} catch(e) {}` and remove it and everything around it up to `document.addEventListener('DOMContentLoaded'`
content = content.replace(/\} catch\(e\) \{\}[\s\S]*?document\.addEventListener\('DOMContentLoaded'/, "document.addEventListener('DOMContentLoaded'");
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed syntax error");
