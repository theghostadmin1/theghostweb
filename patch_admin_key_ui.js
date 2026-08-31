const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// Update saveBulkKeys function to send duration and price
// Use regex to completely replace the function
const oldFuncRegex = /async function saveBulkKeys\(\) \{[\s\S]*?showToast\('Lưu key thất bại!'\);\s*\}\s*\}/;

const newFunc = `async function saveBulkKeys() {
    const productId = document.getElementById('key-product-id').value;
    if (!productId) {
        showToast('Vui lòng chọn sản phẩm trước khi lưu key!');
        return;
    }
    const rawKeys = document.getElementById('bulk-key-input').value;
    const keys = rawKeys.split('\\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) {
        showToast('Không có key nào để lưu!');
        return;
    }
    const duration = document.getElementById('key-duration') ? document.getElementById('key-duration').value : '1 Ngày';
    const price = document.getElementById('key-price') ? parseInt(document.getElementById('key-price').value) || 0 : 0;
    try {
        const res = await fetch(API_URL + \`/products/\${productId}/keys\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keys, duration, price })
        });
        const data = await res.json();
        showToast(data.message || 'Lưu key thành công!');
        document.getElementById('bulk-key-input').value = '';
        document.getElementById('key-product-id').value = '';
        closeImportKeyModal();
        fetchInventory();
    } catch (err) {
        console.error(err);
        showToast('Lưu key thất bại!');
    }
}`;

content = content.replace(oldFuncRegex, newFunc);

// Add injection code for DOM
const injectCode = `
// Inject Thời hạn & Giá bán for Keys
function injectKeyDurationUI() {
    const bulkInput = document.getElementById('bulk-key-input');
    if (bulkInput && !document.getElementById('key-duration')) {
        const fieldsDiv = document.createElement('div');
        fieldsDiv.style.display = 'flex';
        fieldsDiv.style.gap = '10px';
        fieldsDiv.style.marginBottom = '15px';
        fieldsDiv.innerHTML = \`
            <div style="flex: 1;">
                <label class="admin-label" style="color: #ccc; font-size: 0.9rem;">Thời hạn</label>
                <select id="key-duration" class="admin-input" style="width: 100%;">
                    <option value="1 Ngày">1 Ngày</option>
                    <option value="3 Ngày">3 Ngày</option>
                    <option value="7 Ngày">7 Ngày</option>
                    <option value="14 Ngày">14 Ngày</option>
                    <option value="1 Tháng">1 Tháng</option>
                    <option value="Vĩnh viễn">Vĩnh viễn</option>
                </select>
            </div>
            <div style="flex: 1;">
                <label class="admin-label" style="color: #ccc; font-size: 0.9rem;">Giá bán (VNĐ)</label>
                <input type="number" id="key-price" class="admin-input" placeholder="VD: 16250" style="width: 100%;">
            </div>
        \`;
        bulkInput.parentNode.insertBefore(fieldsDiv, bulkInput);
    }
}
// Wait for DOM to load
document.addEventListener('DOMContentLoaded', injectKeyDurationUI);
// Also inject immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    injectKeyDurationUI();
}
// Try injecting repeatedly to catch when modal renders
setInterval(injectKeyDurationUI, 1000);
`;

content += injectCode;

fs.writeFileSync(path, content, 'utf8');
console.log('UI Admin Keys Patched!');
