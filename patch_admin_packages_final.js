const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the old packageModalHtml injection
const oldModalRegex = /const packageModalHtml = `[\s\S]*?`;\s*document\.body\.insertAdjacentHTML\('beforeend', packageModalHtml\);/;
content = content.replace(oldModalRegex, '');

// 2. Remove the old Quản lý gói button from Nhập Key dropdown injection
// We will replace the correctInject block from previous step
const oldInjectRegex = /const keyProductSelect = document\.getElementById\('key-product-id'\);[\s\S]*?function openPackageModalFromImport\(\) \{[\s\S]*?\}/;

content = content.replace(oldInjectRegex, `const keyProductSelect = document.getElementById('key-product-id');
    if (keyProductSelect) {
        const pkgDiv = document.createElement('div');
        pkgDiv.style.marginBottom = '15px';
        pkgDiv.innerHTML = \`
            <label class="admin-label">Chọn Gói (Tùy chọn nếu SP có gói)</label>
            <select id="key-package-select" class="admin-input">
                <option value="">-- Chọn Gói --</option>
            </select>
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
    }`);

// 3. Add the new modal, the button injection, and new functions
const newInject = `
document.addEventListener('DOMContentLoaded', () => {
    // Inject Package Modal HTML
    const packageModalHtml = \`
    <div class="modal-overlay" id="package-modal" style="display: none;">
        <div class="modal-card glass-panel" style="width: 700px; max-width: 90vw; padding: 25px;">
            <button class="close-modal" onclick="closePackageModal()">×</button>
            <h2 class="gradient-text" style="text-align:center; margin-bottom: 25px;"><i class="fas fa-box"></i> QUẢN LÝ GÓI</h2>
            
            <div class="input-group" style="margin-bottom: 20px;">
                <i class="fas fa-gamepad"></i>
                <select id="package-product-select" class="admin-input" onchange="onPackageProductChange()">
                    <option value="">-- Chọn Sản Phẩm --</option>
                </select>
            </div>

            <div id="package-manage-area" style="display: none;">
                <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                    <input type="text" id="new-pkg-name" placeholder="Tên gói (VD: KEY 1 NGÀY)" class="admin-input" style="flex: 2;">
                    <input type="number" id="new-pkg-price" placeholder="Giá bán (VNĐ)" class="admin-input" style="flex: 1;">
                    <input type="number" id="new-pkg-orig" placeholder="Giá gốc" class="admin-input" style="flex: 1;">
                    <button class="btn-auth" onclick="executeAddPackage()" style="flex: 1; margin: 0; padding: 0;">Thêm</button>
                </div>
                <div class="table-responsive">
                    <table class="admin-table custom-table">
                        <thead>
                            <tr>
                                <th>Tên Gói</th>
                                <th>Giá Bán</th>
                                <th>Giá Gốc</th>
                                <th>Tồn Kho</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody id="package-tbody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    \`;
    document.body.insertAdjacentHTML('beforeend', packageModalHtml);

    // Inject Quản lý Gói button next to Nhập Key
    setTimeout(() => {
        const buttons = document.querySelectorAll('button');
        let importBtn = null;
        buttons.forEach(b => {
            if (b.innerText.includes('Nhập Key') || b.getAttribute('onclick') === 'openImportKeyModal()') {
                importBtn = b;
            }
        });
        if (importBtn && !document.getElementById('btn-manage-packages-kho-key')) {
            const pkgBtn = document.createElement('button');
            pkgBtn.id = 'btn-manage-packages-kho-key';
            pkgBtn.className = importBtn.className;
            pkgBtn.style.cssText = importBtn.style.cssText;
            pkgBtn.style.marginLeft = '10px';
            pkgBtn.style.background = 'rgba(168,85,247,0.2)';
            pkgBtn.style.color = '#a855f7';
            pkgBtn.style.borderColor = 'rgba(168,85,247,0.4)';
            pkgBtn.innerHTML = '<i class="fas fa-box"></i> Quản lý Gói';
            pkgBtn.onclick = openPackageSelectModal;
            
            const parent = importBtn.parentNode;
            parent.style.display = 'flex';
            parent.style.gap = '10px';
            parent.appendChild(pkgBtn);
        }
    }, 500);
});

async function openPackageSelectModal() {
    const modal = document.getElementById('package-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    
    const select = document.getElementById('package-product-select');
    select.innerHTML = '<option value="">-- Chọn Sản Phẩm --</option>';
    try {
        const response = await fetch(API_URL + '/products', { cache: 'no-store' });
        const products = await response.json();
        products.forEach(prod => {
            select.insertAdjacentHTML('beforeend', \`<option value="\${prod._id}">\${prod.name}</option>\`);
        });
    } catch(e) {}
    
    document.getElementById('package-manage-area').style.display = 'none';
}

function closePackageModal() {
    const modal = document.getElementById('package-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    currentPackageProductId = null;
}

function onPackageProductChange() {
    const select = document.getElementById('package-product-select');
    const prodId = select.value;
    if (prodId) {
        currentPackageProductId = prodId;
        document.getElementById('package-manage-area').style.display = 'block';
        fetchPackagesAdmin(prodId);
    } else {
        document.getElementById('package-manage-area').style.display = 'none';
        currentPackageProductId = null;
    }
}
`;

// Append new modal logic
content += newInject;

// We need to also clean up old `openPackageModal` just in case, but it's not strictly necessary to delete it.
// Actually it's better to remove the old openPackageModal to prevent duplication.
content = content.replace(/function openPackageModal\([\s\S]*?function closePackageModal/g, 'function closePackageModal_OLD');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched admin_script_v5.js again');
