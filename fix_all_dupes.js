const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// A generic way to remove completely identical blocks of function declarations.
// First, let's just find `async function executeUnlockUser(username)` and remove its duplicates.
const unlockRegex = /async function executeUnlockUser\(username\) \{[\s\S]*?showToast\("Lỗi kết nối tới Server!"\);\s*\}\s*\}/g;
const unlockMatches = content.match(unlockRegex);
console.log('Unlock duplicates:', unlockMatches ? unlockMatches.length : 0);

if (unlockMatches && unlockMatches.length > 0) {
    const funcStr = unlockMatches[0];
    content = content.replace(unlockRegex, '');
    const insertPos = content.indexOf('async function executeLockUser');
    if (insertPos !== -1) {
        content = content.substring(0, insertPos) + funcStr + '\n\n' + content.substring(insertPos);
    } else {
        content += '\n' + funcStr;
    }
}

// What about others? Let's check `async function executeDeleteUser`
const deleteRegex = /async function executeDeleteUser\(username\) \{[\s\S]*?showToast\("Lỗi khi xóa người dùng!"\);\s*\}\s*\}/g;
const deleteMatches = content.match(deleteRegex);
console.log('Delete duplicates:', deleteMatches ? deleteMatches.length : 0);
if (deleteMatches && deleteMatches.length > 0) {
    const funcStr = deleteMatches[0];
    content = content.replace(deleteRegex, '');
    content += '\n' + funcStr;
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed more duplicates!');
