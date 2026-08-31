const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';

let content = fs.readFileSync(path, 'utf8');

// 1. Thay thế nút trong fetchProducts
const targetButtons = `<button class="btn-admin-action btn-add-money" onclick="openEditPriceModal('\${prod._id}', '\${prod.name}', \${prod.price})"><i class="fas fa-edit"></i> Sửa</button>\n                        <button class="btn-admin-action" onclick="executeDeleteProduct('\${prod._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>`;

const replaceButtons = `<button class="btn-admin-action" onclick="openPackageModal('\${prod._id}', '\${prod.name}')" style="background: rgba(168,85,247,0.1); color: #a855f7; border-color: rgba(168,85,247,0.3);"><i class="fas fa-box"></i> Gói</button>\n                        <button class="btn-admin-action btn-add-money" onclick="openEditPriceModal('\${prod._id}', '\${prod.name}', \${prod.price})"><i class="fas fa-edit"></i> Sửa</button>\n                        <button class="btn-admin-action" onclick="executeDeleteProduct('\${prod._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>`;

content = content.replace(targetButtons, replaceButtons);

// 2. Chèn logic cho Modal Package
const packageLogic = `
// --- QUẢN LÝ GÓI (PACKAGES) ---
let currentPackageProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inject Package Modal HTML
    const packageModalHtml = \`
    <div class="modal" id="package-modal">
        <div class="modal-content" style="max-width: 600px;">
            <h3 style="margin-top: 0; color: #fff;"><i class="fas fa-box"></i> Quản Lý Gói: <span id="package-prod-name" style="color: #a855f7;"></span></h3>
            <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                <input type="text" id="new-pkg-name" placeholder="Tên gói (VD: KEY 1 NGÀY)" class="admin-input" style="flex: 2;">
                <input type="number" id="new-pkg-price" placeholder="Giá bán (VNĐ)" class="admin-input" style="flex: 1;">
                <input type="number" id="new-pkg-orig" placeholder="Giá gốc" class="admin-input" style="flex: 1;">
                <button class="btn-auth" onclick="executeAddPackage()" style="flex: 1; margin: 0; padding: 0;">Thêm</button>
            </div>
            <div class="table-responsive">
                <table class="admin-table">
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
                        <!-- Load packages here -->
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button class="btn-auth" onclick="closePackageModal()" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2);">Đóng</button>
            </div>
        </div>
    </div>
    \`;
    document.body.insertAdjacentHTML('beforeend', packageModalHtml);
});

function openPackageModal(prodId, prodName) {
    currentPackageProductId = prodId;
    document.getElementById('package-prod-name').innerText = prodName;
    fetchPackagesAdmin(prodId);
    document.getElementById('package-modal').classList.add('active');
}

function closePackageModal() {
    document.getElementById('package-modal').classList.remove('active');
    currentPackageProductId = null;
}

async function fetchPackagesAdmin(prodId) {
    try {
        const res = await fetch(API_URL + '/products/' + prodId + '/packages');
        const pkgs = await res.json();
        const tbody = document.getElementById('package-tbody');
        tbody.innerHTML = '';
        if (pkgs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ffeb3b;">Chưa có gói nào. Vui lòng thêm!</td></tr>';
            return;
        }
        pkgs.forEach(pkg => {
            const row = \`<tr>
                <td>\${pkg.name}</td>
                <td style="color: #a855f7; font-weight: bold;">\${pkg.price.toLocaleString()}đ</td>
                <td style="color: #ccc; text-decoration: line-through;">\${pkg.originalPrice ? pkg.originalPrice.toLocaleString() + 'đ' : ''}</td>
                <td><span class="badge status-success">\${pkg.stock}</span></td>
                <td><button class="btn-admin-action" onclick="executeDeletePackage('\${pkg._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 5px 10px;"><i class="fas fa-trash"></i></button></td>
            </tr>\`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (e) { showToast('Lỗi tải danh sách gói!'); }
}

async function executeAddPackage() {
    const name = document.getElementById('new-pkg-name').value.trim();
    const price = document.getElementById('new-pkg-price').value;
    const origPrice = document.getElementById('new-pkg-orig').value;
    if (!name || !price) return showToast('Vui lòng nhập tên gói và giá bán!');
    
    try {
        const res = await fetch(API_URL + '/products/' + currentPackageProductId + '/packages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price: Number(price), originalPrice: Number(origPrice) || 0 })
        });
        if(res.ok) {
            showToast('Đã thêm gói!');
            document.getElementById('new-pkg-name').value = '';
            document.getElementById('new-pkg-price').value = '';
            document.getElementById('new-pkg-orig').value = '';
            fetchPackagesAdmin(currentPackageProductId);
        } else {
            const data = await res.json();
            showToast('Lỗi: ' + data.message);
        }
    } catch (e) { showToast('Lỗi hệ thống!'); }
}

async function executeDeletePackage(pkgId) {
    if(!confirm('Bạn có chắc muốn xóa gói này?')) return;
    try {
        const res = await fetch(API_URL + '/products/' + currentPackageProductId + '/packages/' + pkgId, { method: 'DELETE' });
        if(res.ok) {
            showToast('Đã xóa gói!');
            fetchPackagesAdmin(currentPackageProductId);
        } else {
            const data = await res.json();
            showToast('Lỗi: ' + data.message);
        }
    } catch(e) { showToast('Lỗi hệ thống!'); }
}
`;

content += packageLogic;

// 3. Sửa phần Import Key để hỗ trợ dropdown chọn Package
// Tìm function loadKeyProductDropdown và saveBulkKeys

const oldImportKeyDropdownHtml = `    <div style="margin-bottom: 15px;">
        <label class="admin-label">Ch?n S?n ph?m</label>
        <select id="key-product-select" class="admin-input">
            <option value="">-- Dang t?i --</option>
        </select>
    </div>`;

// Note: Encoding is messed up in regex, we'll just inject the new Select element dynamically.
const injectPackageDropdown = `
document.addEventListener('DOMContentLoaded', () => {
    // Inject package dropdown inside Import Key Modal
    const keyProductSelect = document.getElementById('key-product-select');
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
    }
});
`;
content += injectPackageDropdown;

// We need to modify saveBulkKeys() to read 'key-package-select'.
const oldSaveBulkKeysStart = `async function saveBulkKeys() {
    const productId = document.getElementById('key-product-select').value;
    const keysText = document.getElementById('bulk-keys-textarea').value;`;

const newSaveBulkKeysStart = `async function saveBulkKeys() {
    const productId = document.getElementById('key-product-select').value;
    const packageId = document.getElementById('key-package-select') ? document.getElementById('key-package-select').value : null;
    const keysText = document.getElementById('bulk-keys-textarea').value;`;

content = content.replace(oldSaveBulkKeysStart, newSaveBulkKeysStart);

const oldSaveBulkKeysFetch = `body: JSON.stringify({ keys })`;
const newSaveBulkKeysFetch = `body: JSON.stringify({ keys, packageId })`;

content = content.replace(oldSaveBulkKeysFetch, newSaveBulkKeysFetch);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched admin_script_v5.js');
