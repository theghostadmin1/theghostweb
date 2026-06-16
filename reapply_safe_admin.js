const fs = require('fs');
const source = 'e:/TheGhostWeb/index/admin_script_v5_clean.js';
const dest = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';

let content = fs.readFileSync(source, 'utf8');

// 1. Remove Quản lý Gói button from Top Bar
const btnToRemove = `<button class="admin-btn-secondary" style="flex: 1; margin-left: 10px;" onclick="openPackageSelectModal()">\n                    <i class="fa-solid fa-box-open"></i> Quản lý Gói\n                </button>`;
content = content.replace(btnToRemove, '');

// 2. Replace the old package select with duration & price
const oldLabelStr = `<label class="admin-label">Chọn Gói (Tùy chọn nếu SP có gói)</label>`;
const oldSelectStr = `<select id="key-package-select" class="admin-input">\n                <option value="">-- Chọn Gói --</option>\n            </select>`;
const newDurationPrice = `<div style="display: flex; gap: 10px;">
                <div style="flex: 1;">
                    <label class="admin-label">Thời hạn</label>
                    <select id="key-duration-select" class="admin-input">
                        <option value="1 Ngày">1 Ngày</option>
                        <option value="3 Ngày">3 Ngày</option>
                        <option value="7 Ngày">7 Ngày</option>
                        <option value="14 Ngày">14 Ngày</option>
                        <option value="1 Tháng">1 Tháng</option>
                        <option value="Vĩnh viễn">Vĩnh viễn</option>
                    </select>
                </div>
                <div style="flex: 1;">
                    <label class="admin-label">Giá bán (VNĐ)</label>
                    <input type="number" id="key-price-input" class="admin-input" placeholder="VD: 10000">
                </div>
            </div>`;
// The string to replace is from <label... to </select>
// But wait, it was injected via javascript in admin_script_v5_clean.js!
// Let's find the exact JS block:
const oldInjection = `        pkgDiv.innerHTML = \`\n            <label class="admin-label">Ch?n Gi (Ty ch?n n?u SP c gi)</label>\n            <select id="key-package-select" class="admin-input">\n                <option value="">-- Ch?n Gi --</option>\n            </select>\n        \`;`;
// Let's use string index replace for the entire keyProductSelect block!

const startIndex = content.indexOf("const keyProductSelect = document.getElementById('key-product-id');");
const endIndex = content.indexOf("// Inject Package Modal HTML");
if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `const keyProductSelect = document.getElementById('key-product-id');
    if (keyProductSelect) {
        const durationPriceDiv = document.createElement('div');
        durationPriceDiv.style.marginBottom = '15px';
        durationPriceDiv.innerHTML = \`${newDurationPrice}\`;
        keyProductSelect.parentNode.after(durationPriceDiv);
    }
});\n\ndocument.addEventListener('DOMContentLoaded', () => {\n    `;
    content = content.substring(0, startIndex) + newBlock + content.substring(endIndex + 30);
}

// 4. Update executeImportKey to read duration and price instead of packageId
content = content.replace("const packageId = document.getElementById('key-package-select') ? document.getElementById('key-package-select').value : null;", `const duration = document.getElementById('key-duration-select') ? document.getElementById('key-duration-select').value : '1 Ngày';\n    const price = document.getElementById('key-price-input') ? document.getElementById('key-price-input').value : 0;`);
content = content.replace("body: JSON.stringify({ keys, packageId })", `body: JSON.stringify({ keys, duration, price })`);

// 5. Remove Package modal injection and its related functions
// The functions start with `function openPackageSelectModal()` and end at the very end of the file!
const packageModalStartIndex = content.indexOf("const packageModalHtml = `");
// Let's completely wipe everything from packageModalHtml to the end of the script! 
// Because the script originally ends with package related functions!
const functionsEndIndex = content.indexOf("function openPackageSelectModal()");
if (packageModalStartIndex !== -1) {
    // wait, is there anything else at the end of admin_script_v5_clean.js? 
    // Let's check what's between packageModalHtml and the end.
    // We shouldn't guess. We will only replace specific functions.
}

fs.writeFileSync('e:/TheGhostWeb/patch_test.js', content, 'utf8');
console.log("Done");
