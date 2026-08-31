const fs = require('fs');
const path = 'e:/TheGhostWeb/index/admin_script_v5_clean.js';
let content = fs.readFileSync(path, 'utf8');

// We will extract all unique functions and global scope lines.
// Because it's hard to parse JS perfectly with regex, we'll split by "async function " and "function "
// Wait, that might be too complex. 
// Let's just find and replace the EXACT duplicates that we know are there:
// 1. executeLockUser
// 2. executeDeleteKey
// 3. executeDeleteProduct
// 4. executeAddProduct
// 5. executeEditPrice
// 6. loadKeyProductDropdown
// 7. saveBulkKeys
// 8. openImportKeyModal
// 9. closeImportKeyModal
// 10. any "// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----"

// Remove repeated Khóa/Mở Khóa lines:
content = content.replace(/(?:\/\/ ---- KHÓA \/ MỞ KHÓA TÀI KHOẢN ----\s*)+/g, '// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----\n');

const functionsToDedupe = [
    'async function executeLockUser(username)',
    'async function executeUnlockUser(username)',
    'async function executeDeleteUser(username)',
    'async function executeDeleteKey(keyId)',
    'function openAddProductModal()',
    'function closeAddProductModal()',
    'async function executeAddProduct()',
    'async function executeDeleteProduct(id)',
    'function openEditPriceModal(id, name, currentPrice)',
    'function closeEditPriceModal()',
    'async function executeEditPrice()',
    'function openImportKeyModal()',
    'function closeImportKeyModal()',
    'async function loadKeyProductDropdown()',
    'async function saveBulkKeys()'
];

for (const func of functionsToDedupe) {
    const escapedFunc = func.replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    // Regex to match the function body. Assumes function ends with "}\n" or "}\r\n" and doesn't contain "function " inside it at the first level.
    // A safer way: just split the file by the function signature, keep the first one, and for the subsequent ones, find the matching closing brace.
    let parts = content.split(func);
    if (parts.length > 2) {
        console.log(`Found ${parts.length - 1} instances of ${func}`);
        // The first part is everything before the first instance.
        // The second part is the body of the first instance.
        let newContent = parts[0] + func + parts[1];
        
        for (let i = 2; i < parts.length; i++) {
            // parts[i] starts with " { ... } " then the rest of the file.
            // We need to skip until the first `}` at the root level.
            // A simple heuristic: find the first `}\n` or `}\r\n`
            let endIdx = parts[i].indexOf('\n}');
            if (endIdx === -1) endIdx = parts[i].indexOf('\r\n}');
            if (endIdx !== -1) {
                newContent += parts[i].substring(endIdx + 2); // skip `\n}`
            } else {
                // Just append if we couldn't parse
                newContent += parts[i];
            }
        }
        content = newContent;
    }
}

fs.writeFileSync('e:/TheGhostWeb/index_backup/admin_script_v5_clean.js', content, 'utf8');
console.log('Cleaned admin script!');
