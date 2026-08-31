const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// We know `async function executeLockUser(username) {` is repeated many times.
// Let's find the exact block and replace all occurrences with a single one.
const funcStr = `async function executeLockUser(username) {\n    if (!confirm(\`Bạn có chắc muốn khóa tài khoản \${username} không?\`)) return;\n    try {\n        const response = await fetch(\`\${API_URL}/admin/users/\${username}/lock\`, {\n            method: 'PUT',\n        });\n        const data = await response.json();\n        showToast(data.message);\n        fetchUsers();\n    } catch (err) {\n        showToast("Lỗi kết nối tới Server!");\n    }\n}`;

// Use regex to find variations
const regex = /async function executeLockUser\(username\) \{[\s\S]*?showToast\("Lỗi kết nối tới Server!"\);\s*\}\s*\}/g;

const matches = content.match(regex);
console.log('Found duplicates:', matches ? matches.length : 0);

if (matches && matches.length > 0) {
    // Replace all with empty string
    let newContent = content.replace(regex, '');
    
    // Now insert the function just once before `function openBalanceModal` which is nearby
    const insertPos = newContent.indexOf('function openBalanceModal');
    if (insertPos !== -1) {
        newContent = newContent.substring(0, insertPos) + funcStr + '\n\n' + newContent.substring(insertPos);
    } else {
        newContent += '\n' + funcStr;
    }
    
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Fixed duplicates in admin_script_v5.js!');
} else {
    console.log('No exact matches found for regex.');
}
