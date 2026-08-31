const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove "Gói" button from fetchProducts
const targetBtn = `<button class="btn-admin-action" onclick="openPackageModal('\${prod._id}', '\${prod.name}')" style="background: rgba(168,85,247,0.1); color: #a855f7; border-color: rgba(168,85,247,0.3);"><i class="fas fa-box"></i> Gói</button>\n`;
content = content.replace(targetBtn, '');

// 2. Fix the injection of package dropdown in Import Key modal.
// Previously, I matched `key-product-select` but it was `key-product-id`!

// Remove old wrong injected code if present:
const oldWrongCode = `const keyProductSelect = document.getElementById('key-product-select');`;
if (content.includes(oldWrongCode)) {
    // Revert the whole block we appended last time
    const blockStart = `document.addEventListener('DOMContentLoaded', () => {\n    // Inject package dropdown inside Import Key Modal`;
    const blockIndex = content.indexOf(blockStart);
    if (blockIndex !== -1) {
        content = content.substring(0, blockIndex);
    }
}

// Now inject the CORRECT code for `#key-product-id`
const correctInject = `
document.addEventListener('DOMContentLoaded', () => {
    // Inject package dropdown inside Import Key Modal
    const keyProductSelect = document.getElementById('key-product-id');
    if (keyProductSelect) {
        const pkgDiv = document.createElement('div');
        pkgDiv.style.marginBottom = '15px';
        pkgDiv.innerHTML = \`
            <label class="admin-label">Chọn Gói (Tùy chọn nếu SP có gói)</label>
            <div style="display: flex; gap: 10px;">
                <select id="key-package-select" class="admin-input" style="flex: 2;">
                    <option value="">-- Chọn Gói --</option>
                </select>
                <button class="btn-auth" onclick="openPackageModalFromImport()" style="flex: 1; margin: 0; padding: 0 10px; background: rgba(168,85,247,0.2); border-color: rgba(168,85,247,0.4); color: #a855f7;"><i class="fas fa-box"></i> Quản lý Gói</button>
            </div>
        \`;
        keyProductSelect.parentNode.after(pkgDiv);

        keyProductSelect.addEventListener('change', async (e) => {
            const prodId = e.target.value;
            const pkgSelect = document.getElementById('key-package-select');
            pkgSelect.innerHTML = '<option value="">-- Chọn Gói --</option>';
            if(!prodId) return;
            try {
                const res = await fetch(API_URL + '/products/' + prodId + '/packages');
                const pkgs = await res.json();
                pkgs.forEach(p => {
                    pkgSelect.insertAdjacentHTML('beforeend', \`<option value="\${p._id}">\${p.name}</option>\`);
                });
            } catch(e) {}
        });
    }
});

function openPackageModalFromImport() {
    const select = document.getElementById('key-product-id');
    const prodId = select.value;
    if (!prodId) {
        showToast('Vui lòng chọn Sản phẩm trước!');
        return;
    }
    const prodName = select.options[select.selectedIndex].text;
    openPackageModal(prodId, prodName);
}
`;

content += correctInject;

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched admin_script_v5.js again');
