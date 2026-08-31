const fs = require('fs');

// 1. Fix admin_script_v5.js
let admin = fs.readFileSync('e:/TheGhostWeb/index_backup/admin_script_v5.js', 'utf8');
// Fix the Quản lý Gói button to not inherit bad cssText that stretches it
admin = admin.replace(/pkgBtn\.className = importBtn\.className;[\s\S]*?pkgBtn\.style\.cssText = importBtn\.style\.cssText;/, 'pkgBtn.className = importBtn.className;\n            pkgBtn.style.padding = "10px 20px";\n            pkgBtn.style.height = "fit-content";');
// Also fix the flex container so they don't stretch vertically if not needed
admin = admin.replace(/parent\.style\.display = 'flex';[\s\S]*?parent\.style\.gap = '10px';/, "parent.style.display = 'flex';\n            parent.style.gap = '10px';\n            parent.style.alignItems = 'center';\n            importBtn.style.flex = '1';\n            pkgBtn.style.flex = '1';");

fs.writeFileSync('e:/TheGhostWeb/index_backup/admin_script_v5.js', admin, 'utf8');

// 2. Fix script.js buy modal
let script = fs.readFileSync('e:/TheGhostWeb/index_backup/script.js', 'utf8');

const oldModalHtml = /<div class="modal" id="advanced-buy-modal">[\s\S]*?<div class="modal-content"[\s\S]*?>/;
const newModalHtml = `<div class="modal-overlay" id="advanced-buy-modal" style="display: none;">
        <div class="modal-card glass-panel" style="width: 800px; max-width: 90vw; padding: 0; display: flex; flex-direction: row; overflow: hidden; background: #1a1a2e; border: 1px solid #333;">`;
script = script.replace(oldModalHtml, newModalHtml);

// Fix close advanced-buy-modal function
script = script.replace(/document\.getElementById\('advanced-buy-modal'\)\.classList\.add\('active'\);/g, `const m = document.getElementById('advanced-buy-modal'); m.style.display = 'flex'; setTimeout(() => m.classList.add('show'), 10);`);
script = script.replace(/document\.getElementById\('advanced-buy-modal'\)\.classList\.remove\('active'\);/g, `const m = document.getElementById('advanced-buy-modal'); m.classList.remove('show'); setTimeout(() => m.style.display = 'none', 300);`);

fs.writeFileSync('e:/TheGhostWeb/index_backup/script.js', script, 'utf8');

console.log('UI patches applied');
