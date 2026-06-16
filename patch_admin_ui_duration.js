const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove Quản lý Gói button from Top Bar
content = content.replace(/<button class="admin-btn-secondary" style="flex: 1; margin-left: 10px;" onclick="openPackageSelectModal\(\)">\s*<i class="fa-solid fa-box-open"><\/i> Quản lý Gói\s*<\/button>/, '');

// 2. Remove Package select inside Import Key modal and replace with Duration and Price
const oldPackageSelect = /<label class="admin-label">Chọn Gói \(Tùy chọn nếu SP có gói\)<\/label>[\s\S]*?<select id="key-package-select" class="admin-input">[\s\S]*?<option value="">-- Chọn Gói --<\/option>[\s\S]*?<\/select>/;
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
content = content.replace(oldPackageSelect, newDurationPrice);

// 3. Remove keyProductSelect.addEventListener('change' ...) which fetches packages
// Wait, let's just replace the whole injection block:
const injectionBlock = /const keyProductSelect = document\.getElementById\('key-product-id'\);[\s\S]*?if \(keyProductSelect\) \{[\s\S]*?keyProductSelect\.parentNode\.after\(pkgDiv\);[\s\S]*?keyProductSelect\.addEventListener\('change', async \(e\) => \{[\s\S]*?\}\);\s*\}/;
const newInjectionBlock = `const keyProductSelect = document.getElementById('key-product-id');
    if (keyProductSelect) {
        const durationPriceDiv = document.createElement('div');
        durationPriceDiv.style.marginBottom = '15px';
        durationPriceDiv.innerHTML = \`${newDurationPrice}\`;
        keyProductSelect.parentNode.after(durationPriceDiv);
    }`;
content = content.replace(injectionBlock, newInjectionBlock);

// 4. Update executeImportKey to read duration and price instead of packageId
content = content.replace(/const packageId = document\.getElementById\('key-package-select'\) \? document\.getElementById\('key-package-select'\)\.value : null;/, `const duration = document.getElementById('key-duration-select') ? document.getElementById('key-duration-select').value : '1 Ngày';
    const price = document.getElementById('key-price-input') ? document.getElementById('key-price-input').value : 0;`);
content = content.replace(/body: JSON\.stringify\(\{ keys, packageId \}\)/, `body: JSON.stringify({ keys, duration, price })`);

// 5. Update Inventory HTML rendering to include duration and price
// Wait, in my server patch, I already changed 'productName' to include duration and 'price' is the final price.
// So I don't need to change the inventory table HTML! `productName` is already "Name - 7 Ngày".

fs.writeFileSync(path, content, 'utf8');
console.log("Admin script v5 patched");
