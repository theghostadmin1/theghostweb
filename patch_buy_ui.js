const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/script.js';
let content = fs.readFileSync(path, 'utf8');

// Xóa bỏ nội dung cũ của modal
const startHtml = content.indexOf('const advancedModalHtml = `');
if (startHtml !== -1) {
    const endHtml = content.indexOf('`;', startHtml) + 2;
    
    const newModalHtml = `const advancedModalHtml = \`
    <div class="modal-overlay" id="advanced-buy-modal" style="display: none;">
        <div class="modal-card glass-panel" style="width: 850px; max-width: 95vw; padding: 0; display: flex; flex-direction: row; overflow: hidden; background: #1a1a2e; border: 1px solid #333;">
            <!-- Left side: Image and Desc -->
            <div style="flex: 1; padding: 20px; background: #111122; display: flex; flex-direction: column;">
                <img src="logo.png" id="adv-prod-img" style="width: 100%; border-radius: 8px; margin-bottom: 15px; border: 1px solid #333;">
                <h3 id="adv-prod-name" style="color: #fff; margin-top: 0; font-size: 1.2rem; text-transform: uppercase;"></h3>
                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;"><strong>MÔ TẢ SẢN PHẨM</strong></div>
                <div id="adv-prod-desc" style="color: #aaa; font-size: 0.85rem; line-height: 1.6; flex: 1; overflow-y: auto;"></div>
            </div>

            <!-- Right side: Packages and Form -->
            <div style="flex: 1; padding: 20px; display: flex; flex-direction: column;">
                
                <div id="adv-tags-container" style="display: flex; gap: 10px; align-items: center; margin-bottom: 5px;">
                    <span id="adv-discount-tag" style="color: #ff4d4f; background: rgba(255,77,79,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; display: none;">Giảm 0%</span>
                    <span id="adv-original-price" style="color: #888; font-size: 0.8rem; display: none;">Giá gốc <span style="text-decoration: line-through;">0đ</span></span>
                    <span id="adv-status-tag" style="color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">• CÒN HÀNG</span>
                </div>
                
                <h2 id="adv-prod-price" style="color: #a855f7; margin: 0 0 10px 0; font-size: 1.8rem;"></h2>
                
                <div style="color: #888; font-size: 0.9rem; margin-bottom: 20px;">
                    Kho: <strong id="adv-prod-stock" style="color: #fff;">0</strong> &nbsp;&nbsp;&nbsp;
                    Đã bán: <strong id="adv-prod-sold" style="color: #fff;">0</strong>
                </div>
                
                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;">Chọn gói</div>
                <div id="adv-packages-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 250px; overflow-y: auto; margin-bottom: 20px; padding-right: 5px;">
                    <!-- Packages will be loaded here -->
                </div>

                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;">Số lượng mua</div>
                <div style="display: flex; align-items: center; background: #0f0f1a; padding: 10px 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333;">
                    <button onclick="changeQuantity(-1)" style="background: #1a1a2e; border: 1px solid #333; border-radius: 4px; color: #888; font-size: 1.2rem; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">-</button>
                    <input type="text" id="adv-quantity" value="1" style="background: transparent; border: none; color: #fff; text-align: center; width: 50px; font-weight: bold;" readonly>
                    <button onclick="changeQuantity(1)" style="background: #1a1a2e; border: 1px solid #333; border-radius: 4px; color: #fff; font-size: 1.2rem; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">+</button>
                    <div style="margin-left: auto; text-align: right;">
                        <div style="color: #888; font-size: 0.75rem;">Kho khả dụng</div>
                        <div id="adv-pkg-stock" style="color: #a855f7; font-size: 0.9rem;">0 key</div>
                    </div>
                </div>

                <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 10px;">Mã giảm giá</div>
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <div style="flex: 1; position: relative;">
                        <i class="fas fa-tag" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #888;"></i>
                        <input type="text" placeholder="Nhập mã..." style="width: 100%; padding: 10px 10px 10px 30px; background: #0f0f1a; border: 1px solid #333; border-radius: 8px; color: #fff; box-sizing: border-box; outline: none;">
                    </div>
                    <button style="background: #333; color: #888; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer;">Áp dụng</button>
                </div>

                <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; border: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #888;">Đơn giá:</span> <strong id="adv-unit-price" style="color: #a855f7;">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #888;">Số lượng:</span> <strong id="adv-qty-text" style="color: #fff;">1</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #888;">Thành tiền:</span> <strong id="adv-total-price" style="color: #a855f7;">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #888;">Số dư:</span> <strong id="adv-current-balance" style="color: #fff;">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #888;">Còn lại:</span> <strong id="adv-remaining-balance">0đ</strong></div>
                </div>

                <button class="btn-auth" onclick="executeAdvancedBuy()" style="width: 100%; background: #7c3aed; border: none; color: #fff; padding: 12px; border-radius: 8px; font-size: 1rem; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px;">
                    <i class="fas fa-shopping-cart"></i> Xác nhận mua
                </button>
            </div>
            <button onclick="closeAdvancedBuyModal()" style="position: absolute; top: 15px; right: 15px; background: transparent; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
    </div>\`;
`;
    
    content = content.substring(0, startHtml) + newModalHtml + content.substring(endHtml);
}

// Fix package generation in pkgs.forEach
const pkgRenderStart = content.indexOf('pkgs.forEach((pkg, index) => {');
if (pkgRenderStart !== -1) {
    const pkgRenderEnd = content.indexOf('});', pkgRenderStart) + 3;
    
    const newPkgRender = `pkgs.forEach((pkg, index) => {
                totalStock += pkg.stock;
                let displayName = pkg.name.toUpperCase();
                if (!displayName.includes('KEY')) displayName = 'KEY ' + displayName;
                
                html += \`<div class="pkg-option \${index === 0 ? 'active' : ''}" id="pkg-opt-\${pkg._id}" onclick="selectPackage('\${pkg._id}', \${pkg.price}, \${pkg.stock})" style="padding: 12px 15px; border: 1px solid \${index === 0 ? '#a855f7' : '#333'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: \${index === 0 ? 'rgba(168,85,247,0.1)' : '#111122'};">
                    <div>
                        <strong style="color: #fff; font-size: 0.95rem;">\${displayName}</strong><br>
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
            });`;
            
    content = content.substring(0, pkgRenderStart) + newPkgRender + content.substring(pkgRenderEnd);
}

// Update updateBuyCalc to format UI values properly
const calcStart = content.indexOf('function updateBuyCalc() {');
if (calcStart !== -1) {
    const calcEnd = content.indexOf('}', content.indexOf('remEl.style.color = remain < 0 ?', calcStart)) + 1;
    
    const newCalc = `function updateBuyCalc() {
    if (!currentBuyProduct) return;
    const unitPrice = currentSelectedPackage ? currentSelectedPackage.price : currentBuyProduct.price;
    const total = unitPrice * currentBuyQuantity;
    
    const userBalance = parseInt(document.getElementById('header-balance').innerText.replace(/[^0-9]/g, '')) || 0;
    const remain = userBalance - total;

    document.getElementById('adv-unit-price').innerText = unitPrice.toLocaleString() + 'đ';
    document.getElementById('adv-qty-text').innerText = currentBuyQuantity;
    document.getElementById('adv-total-price').innerText = total.toLocaleString() + 'đ';
    document.getElementById('adv-current-balance').innerText = userBalance.toLocaleString() + 'đ';
    
    const remEl = document.getElementById('adv-remaining-balance');
    remEl.innerText = remain.toLocaleString() + 'đ';
    remEl.style.color = remain < 0 ? '#ef4444' : '#10b981';

    if (currentSelectedPackage && currentSelectedPackage.stock !== '??') {
        document.getElementById('adv-pkg-stock').innerText = currentSelectedPackage.stock + ' key';
    } else {
        document.getElementById('adv-pkg-stock').innerText = '';
    }
    
    document.getElementById('adv-prod-price').innerText = unitPrice.toLocaleString() + 'đ';
    
    if (currentBuyProduct.originalPrice) {
        document.getElementById('adv-discount-tag').style.display = 'inline-block';
        document.getElementById('adv-original-price').style.display = 'inline-block';
        document.getElementById('adv-original-price').innerHTML = \`Giá gốc <span style="text-decoration: line-through;">\${currentBuyProduct.originalPrice.toLocaleString()}đ</span>\`;
        const percent = Math.round(100 - (unitPrice / currentBuyProduct.originalPrice) * 100);
        document.getElementById('adv-discount-tag').innerText = 'Giảm ' + percent + '%';
    } else {
        // Fake discount if none
        const fakeOriginal = Math.round(unitPrice * 1.35 / 1000) * 1000;
        document.getElementById('adv-discount-tag').style.display = 'inline-block';
        document.getElementById('adv-original-price').style.display = 'inline-block';
        document.getElementById('adv-original-price').innerHTML = \`Giá gốc <span style="text-decoration: line-through;">\${fakeOriginal.toLocaleString()}đ</span>\`;
        document.getElementById('adv-discount-tag').innerText = 'Giảm 35%';
    }
`;
    content = content.substring(0, calcStart) + newCalc + content.substring(calcEnd);
}

fs.writeFileSync(path, content, 'utf8');
console.log('UI Patched!');
