const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/script.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Save globalProducts and change onclick
const targetFetch = `const products = await res.json();`;
const replaceFetch = `const products = await res.json();\n        window.globalProducts = products;`;
content = content.replace(targetFetch, replaceFetch);

const targetBtn = `<button class="btn-buy" onclick="buyProduct('\${prod.name}', \${prod.price})" data-i18n="btn_buy">`;
const replaceBtn = `<button class="btn-buy" onclick="openAdvancedBuyModal('\${prod._id}')" data-i18n="btn_buy">`;
content = content.replace(targetBtn, replaceBtn);

// 2. Inject Modal HTML and logic
const advancedBuyLogic = `
// --- ADVANCED BUY MODAL ---
let currentBuyProduct = null;
let currentSelectedPackage = null;
let currentBuyQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
    const advancedModalHtml = \`
    <div class="modal" id="advanced-buy-modal">
        <div class="modal-content" style="max-width: 800px; display: flex; flex-direction: row; gap: 20px; padding: 0; background: #1a1a2e; border: 1px solid #333; overflow: hidden;">
            <!-- Left side: Image and Desc -->
            <div style="flex: 1; padding: 20px; background: #111122; display: flex; flex-direction: column;">
                <img src="logo.png" style="width: 100%; border-radius: 8px; margin-bottom: 15px; border: 1px solid #333;">
                <h3 id="adv-prod-name" style="color: #fff; margin-top: 0; font-size: 1.2rem;"></h3>
                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;"><strong>MÔ TẢ SẢN PHẨM</strong></div>
                <div id="adv-prod-desc" style="color: #aaa; font-size: 0.85rem; line-height: 1.6; flex: 1; overflow-y: auto;"></div>
            </div>

            <!-- Right side: Packages and Form -->
            <div style="flex: 1; padding: 20px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h2 id="adv-prod-price" style="color: #a855f7; margin: 0;"></h2>
                    <span id="adv-prod-stock" class="badge status-success"></span>
                </div>
                
                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;">Chọn gói</div>
                <div id="adv-packages-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto; margin-bottom: 20px;">
                    <!-- Packages will be loaded here -->
                </div>

                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;">Số lượng mua</div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px; background: #0f0f1a; padding: 10px; border-radius: 8px;">
                    <button onclick="changeQuantity(-1)" style="background: #222; border: none; color: #fff; width: 30px; height: 30px; border-radius: 5px; cursor: pointer;">-</button>
                    <input type="number" id="adv-quantity" value="1" min="1" style="background: transparent; border: none; color: #fff; text-align: center; width: 40px; font-weight: bold;" readonly>
                    <button onclick="changeQuantity(1)" style="background: #222; border: none; color: #fff; width: 30px; height: 30px; border-radius: 5px; cursor: pointer;">+</button>
                    <span id="adv-pkg-stock" style="margin-left: auto; color: #a855f7; font-size: 0.9rem;"></span>
                </div>

                <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #888;">Đơn giá:</span> <strong id="adv-unit-price">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #888;">Số lượng:</span> <strong id="adv-qty-text">1</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #888;">Thành tiền:</span> <strong id="adv-total-price" style="color: #a855f7;">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #888;">Số dư hiện tại:</span> <strong id="adv-current-balance">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span style="color: #888;">Còn lại:</span> <strong id="adv-remaining-balance">0đ</strong></div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn-auth" onclick="closeAdvancedBuyModal()" style="flex: 1; background: #333; border-color: #444;">Hủy</button>
                    <button class="btn-auth" onclick="executeAdvancedBuy()" style="flex: 2; background: rgba(168,85,247,0.2); border-color: rgba(168,85,247,0.4); color: #a855f7;"><i class="fas fa-shopping-cart"></i> Xác nhận mua</button>
                </div>
            </div>
        </div>
    </div>
    \`;
    document.body.insertAdjacentHTML('beforeend', advancedModalHtml);
});

async function openAdvancedBuyModal(prodId) {
    if (CURRENT_USER_ID === "guest" || !CURRENT_USER_ID) {
        showToast("Vui lòng đăng nhập để mua sản phẩm!");
        openModal('login');
        return;
    }

    const prod = window.globalProducts.find(p => p._id === prodId);
    if (!prod) return;
    currentBuyProduct = prod;
    currentSelectedPackage = null;
    currentBuyQuantity = 1;

    document.getElementById('adv-prod-name').innerText = prod.name;
    document.getElementById('adv-prod-desc').innerHTML = prod.description ? prod.description.replace(/\n/g, '<br>') : 'Sản phẩm uy tín từ TheGhost.';
    document.getElementById('adv-prod-price').innerText = prod.price.toLocaleString() + 'đ';
    document.getElementById('adv-prod-stock').innerText = 'Đang tải...';
    document.getElementById('adv-packages-container').innerHTML = '<div style="color: #888; text-align: center;">Đang tải gói...</div>';

    updateBuyCalc();
    document.getElementById('advanced-buy-modal').classList.add('active');

    try {
        const res = await fetch(API_URL + '/products/' + prodId + '/packages');
        const pkgs = await res.json();
        
        const pkgContainer = document.getElementById('adv-packages-container');
        pkgContainer.innerHTML = '';
        
        // Thêm option mua mặc định (nếu muốn)
        let totalStock = 0;
        let html = '';

        if (pkgs.length === 0) {
            // Nếu không có package, chỉ cho mua mặc định
            html += \`<div class="pkg-option active" onclick="selectPackage(null, \${prod.price}, '??')" style="padding: 12px; border: 1px solid #a855f7; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; background: rgba(168,85,247,0.1);">
                <strong>MẶC ĐỊNH</strong>
                <span style="color: #a855f7;">\${prod.price.toLocaleString()}đ</span>
            </div>\`;
            currentSelectedPackage = { id: null, price: prod.price, stock: '??' };
            document.getElementById('adv-prod-stock').innerText = 'Sẵn sàng';
        } else {
            pkgs.forEach((pkg, index) => {
                totalStock += pkg.stock;
                html += \`<div class="pkg-option \${index === 0 ? 'active' : ''}" id="pkg-opt-\${pkg._id}" onclick="selectPackage('\${pkg._id}', \${pkg.price}, \${pkg.stock})" style="padding: 12px; border: 1px solid \${index === 0 ? '#a855f7' : '#333'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; background: \${index === 0 ? 'rgba(168,85,247,0.1)' : 'transparent'};">
                    <div>
                        <strong style="color: #fff;">\${pkg.name}</strong><br>
                        <span style="font-size: 0.8rem; color: #888;">Còn \${pkg.stock} key</span>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: #a855f7;">\${pkg.price.toLocaleString()}đ</strong>
                        \${pkg.originalPrice ? \`<br><span style="font-size: 0.8rem; color: #666; text-decoration: line-through;">\${pkg.originalPrice.toLocaleString()}đ</span>\` : ''}
                    </div>
                </div>\`;
                if (index === 0) {
                    currentSelectedPackage = { id: pkg._id, price: pkg.price, stock: pkg.stock };
                }
            });
            document.getElementById('adv-prod-stock').innerText = 'Kho: ' + totalStock;
        }

        pkgContainer.innerHTML = html;
        updateBuyCalc();

    } catch (e) {
        console.error(e);
        document.getElementById('adv-packages-container').innerHTML = '<div style="color: red;">Lỗi tải dữ liệu gói.</div>';
    }
}

window.selectPackage = function(pkgId, price, stock) {
    currentSelectedPackage = { id: pkgId, price: price, stock: stock };
    document.querySelectorAll('.pkg-option').forEach(el => {
        el.classList.remove('active');
        el.style.border = '1px solid #333';
        el.style.background = 'transparent';
    });
    if (pkgId) {
        const opt = document.getElementById('pkg-opt-' + pkgId);
        if(opt) {
            opt.classList.add('active');
            opt.style.border = '1px solid #a855f7';
            opt.style.background = 'rgba(168,85,247,0.1)';
        }
    }
    updateBuyCalc();
}

window.changeQuantity = function(delta) {
    let newQ = currentBuyQuantity + delta;
    if (newQ < 1) newQ = 1;
    // if (currentSelectedPackage && typeof currentSelectedPackage.stock === 'number' && newQ > currentSelectedPackage.stock) {
    //    newQ = currentSelectedPackage.stock;
    // }
    currentBuyQuantity = newQ;
    document.getElementById('adv-quantity').value = currentBuyQuantity;
    updateBuyCalc();
}

function updateBuyCalc() {
    if (!currentBuyProduct) return;
    const unitPrice = currentSelectedPackage ? currentSelectedPackage.price : currentBuyProduct.price;
    const total = unitPrice * currentBuyQuantity;
    
    const userBalance = parseInt(document.getElementById('balance-display').innerText.replace(/[^0-9]/g, '')) || 0;
    const remain = userBalance - total;

    document.getElementById('adv-unit-price').innerText = unitPrice.toLocaleString() + 'đ';
    document.getElementById('adv-qty-text').innerText = currentBuyQuantity;
    document.getElementById('adv-total-price').innerText = total.toLocaleString() + 'đ';
    document.getElementById('adv-current-balance').innerText = userBalance.toLocaleString() + 'đ';
    
    const remEl = document.getElementById('adv-remaining-balance');
    remEl.innerText = remain.toLocaleString() + 'đ';
    remEl.style.color = remain < 0 ? '#ef4444' : '#10b981';

    if (currentSelectedPackage && currentSelectedPackage.stock !== '??') {
        document.getElementById('adv-pkg-stock').innerText = 'Kho khả dụng: ' + currentSelectedPackage.stock + ' key';
    } else {
        document.getElementById('adv-pkg-stock').innerText = '';
    }
}

function closeAdvancedBuyModal() {
    document.getElementById('advanced-buy-modal').classList.remove('active');
}

async function executeAdvancedBuy() {
    if (!currentBuyProduct) return;
    const pkgId = currentSelectedPackage ? currentSelectedPackage.id : null;
    
    try {
        const response = await fetch(API_URL + '/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: CURRENT_USER_ID,
                productName: currentBuyProduct.name,
                packageId: pkgId,
                quantity: currentBuyQuantity
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            showToast(data.message);
            closeAdvancedBuyModal();
            if (typeof loadUserData === 'function') loadUserData(CURRENT_USER_ID);
        } else {
            showToast("Lỗi: " + data.message);
        }
    } catch (e) {
        showToast("Lỗi kết nối!");
    }
}
`;

content += advancedBuyLogic;
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully patched script.js');
