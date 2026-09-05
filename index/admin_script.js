const API_URL = '/api';
(function () {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
        init = Object.assign({}, init || {});
        const url = typeof input === 'string' ? input : ((input && input.url) || '');
        const token = sessionStorage.getItem('ADMIN_TOKEN');
        if (token && String(url).indexOf('/api') !== -1) {
            const headers = new Headers(init.headers || {});
            if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
            init.headers = headers;
        }
        return nativeFetch(input, init);
    };
})();
let currentTargetUser = '';
let currentEditProductId = null;
let currentEditDownloadId = null;
let currentEditNewsId = null;
let allAdminUsersCache = [];
let allAdminProductsCache = [];

function closeMobileNav() {
    document.body.classList.remove('nav-open');
}
function initMobileNav() {
    if (document.getElementById('menu-toggle')) return;
    const header = document.querySelector('.top-header');
    if (!header) return;
    const btn = document.createElement('button');
    btn.id = 'menu-toggle';
    btn.className = 'menu-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Mở menu');
    btn.innerHTML = '<i class="fas fa-bars"></i>';
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        document.body.classList.toggle('nav-open');
    });
    header.insertBefore(btn, header.firstChild);
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    backdrop.addEventListener('click', closeMobileNav);
    document.body.appendChild(backdrop);
    document.querySelectorAll('.sidebar-nav a').forEach(function (a) {
        a.addEventListener('click', closeMobileNav);
    });
}

function switchAdminPage(pageId) {
    document.querySelectorAll('.page-section').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    const targetPage = document.getElementById(`admin-${pageId}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
        setTimeout(() => targetPage.classList.add('active'), 10);
    }
    const targetMenu = document.getElementById(`admin-menu-${pageId}`);
    if (targetMenu) targetMenu.classList.add('active');
    closeMobileNav();
}

function loadAdminData() {
    fetchDashboardStats();
    fetchProducts();
    fetchOrders();
    fetchInventory();
    loadKeyProductDropdown();
    fetchUsers();
    fetchTopups();
    fetchDownloadsAdmin();
    fetchCouponsAdmin();
    fetchNewsAdmin();
}

window.verifyAdminPassword = async function () {
    const pwdInput = document.querySelector('input[type="password"]');
    if (!pwdInput) return;
    const password = pwdInput.value;
    if (!password) {
        showToast('Vui lòng nhập mật khẩu!');
        return;
    }
    try {
        const res = await fetch(API_URL + '/admin/verify-hmac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success && data.token) {
            sessionStorage.setItem('ADMIN_TOKEN', data.token);
            sessionStorage.removeItem('ADMIN_PASSWORD');
            const btn = document.querySelector('button[onclick="verifyAdminPassword()"]');
            if (btn) {
                let p = btn;
                while (p && p !== document.body) {
                    p = p.parentElement;
                    const style = window.getComputedStyle(p);
                    if (style.position === 'fixed' || style.position === 'absolute' ||
                        (p.id && (p.id.includes('modal') || p.id.includes('overlay'))) ||
                        (p.className && String(p.className).includes('overlay'))) {
                        p.style.display = 'none';
                        break;
                    }
                }
            }
            loadAdminData();
        } else {
            showToast('Mật mã không chính xác!');
        }
    } catch (e) {
        showToast('Lỗi hệ thống!');
    }
};

async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, { method: 'PUT' });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast('Lỗi kết nối tới Server!');
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, { method: 'PUT' });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast('Lỗi kết nối tới Server!');
    }
}

function openBalanceModal(username) {
    currentTargetUser = username;
    document.getElementById('modal-target-username').innerText = username;
    const modal = document.getElementById('admin-balance-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeBalanceModal() {
    const modal = document.getElementById('admin-balance-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    document.getElementById('balance-action-amount').value = '';
}

async function executeBalanceChange() {
    const type = document.getElementById('balance-action-type').value;
    const amountInput = document.getElementById('balance-action-amount').value;
    const amount = amountInput ? parseInt(amountInput) : 0;
    if (amount <= 0) {
        showToast('Vui lòng nhập số tiền hợp lệ lớn hơn 0đ!');
        return;
    }
    try {
        const response = await fetch(`${API_URL}/admin/users/${currentTargetUser}/balance`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, type })
        });
        const data = await response.json();
        if (response.ok) {
            showToast(data.message);
            const balanceElement = document.getElementById(`user-balance-${currentTargetUser}`);
            if (balanceElement) balanceElement.innerText = data.newBalance.toLocaleString() + 'đ';
            closeBalanceModal();
            fetchDashboardStats();
        } else {
            showToast(data.message);
        }
    } catch (err) {
        showToast('Lỗi kết nối tới Server!');
    }
}

async function fetchUsers() {
    try {
        const response = await fetch(API_URL + '/admin/users', { cache: 'no-store' });
        const users = await response.json();
        allAdminUsersCache = Array.isArray(users) ? users : [];
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        users.forEach(user => {
            const statusBadge = user.locked
                ? '<span class="badge status-pending" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);">Đã Khóa</span>'
                : '<span class="badge status-success">Hoạt động</span>';
            const nRate = Array.isArray(user.sellProductRates) ? user.sellProductRates.length : 0;
            const nProd = nRate || (Array.isArray(user.sellProductIds) ? user.sellProductIds.length : 0);
            const isSell = !!(user.isReseller || user.discountPercent > 0 || nProd);
            const catShort = nProd ? (nProd + ' SP') : (isSell ? 'chưa chọn SP' : '');
            const resellerBadge = isSell
                ? `<span class="badge" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 800; border: none; margin-left: 5px;">SELL ${catShort}</span>`
                : '';
            const vipBadge = user.isVip
                ? '<span class="badge" style="background: linear-gradient(135deg, #a855f7, #7c3aed); color: #fff; font-weight: 800; border: none; margin-left: 5px;"><i class="fas fa-gem"></i> VIP</span>'
                : '';
            const rankBadges = (vipBadge + resellerBadge) || '<span class="badge" style="background: rgba(255,255,255,0.06); color: #9ca3af; border: 1px solid rgba(255,255,255,0.1); margin-left: 5px;">Thường</span>';

            const actionBtn = user.locked
                ? `<button class="btn-admin-action btn-unlock-user" onclick="executeUnlockUser('${user.username}')" style="background: rgba(16,185,129,0.1); color: #10b981; margin-left: 6px;"><i class="fas fa-user-check"></i> Mở Khóa</button>`
                : `<button class="btn-admin-action btn-lock-user" onclick="executeLockUser('${user.username}')" style="background: rgba(239,68,68,0.1); color: #ef4444; margin-left: 6px;"><i class="fas fa-user-slash"></i> Khóa</button>`;
            
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><span class="order-id">${user.username}</span></td>
                    <td>${user.email}</td>
                    <td class="text-primary font-weight-bold" id="user-balance-${user.username}">${user.balance.toLocaleString()}đ</td>
                    <td>${statusBadge} ${rankBadges}</td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center;">
                        <button class="btn-admin-action btn-add-money" onclick="openBalanceModal('${user.username}')"><i class="fas fa-plus-circle"></i> Nạp/Trừ</button>
                        <button class="btn-admin-action" onclick="toggleUserVip('${user.username}', ${!user.isVip})" style="background: rgba(168,85,247,0.18); color: #e9d5ff; border-color: rgba(168,85,247,0.4);"><i class="fas fa-gem"></i> ${user.isVip ? 'Gỡ VIP' : 'Cấp VIP'}</button>
                        <button class="btn-admin-action" onclick="openResellerModal('${user.username}')" style="background: rgba(245,158,11,0.15); color: #fbbf24; border-color: rgba(245,158,11,0.35);"><i class="fas fa-crown"></i> Cấp Sell</button>
                        ${actionBtn}
                    </td>
                </tr>`);
        });
        const totalUsersEl = document.getElementById('admin-total-users');
        if (totalUsersEl) totalUsersEl.innerText = users.length;
    } catch (error) {
        showToast('Lỗi tải danh sách thành viên!');
    }
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) {
        alert(message);
        return;
    }
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<i class="fas fa-shield-alt"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

async function fetchProducts() {
    try {
        const response = await fetch(API_URL + '/products', { cache: 'no-store' });
        const products = await response.json();
        allAdminProductsCache = Array.isArray(products) ? products : [];
        const tbody = document.getElementById('admin-products-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        allAdminProductsCache.forEach(prod => {
            const categoryBadge = prod.category === 'cheat' ? 'Bot & Cheat' : (prod.category === 'acc' ? 'Tài khoản' : 'Công cụ');
            const hotBadge = prod.isHot
                ? '<span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4);">🔥 HOT</span>'
                : '<span class="badge status-success">Thường</span>';
            const discountBadge = prod.isDiscountable !== false
                ? '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); margin-left: 4px;">Có giảm giá</span>'
                : '<span class="badge" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); margin-left: 4px;">Không giảm</span>';
            
            const imgPath = resolveDownloadImage(prod.imageUrl);
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>
                        <img src="${imgPath}" style="width:40px; height:40px; object-fit:contain; border-radius:8px; background:rgba(255,255,255,0.05); padding:2px; border:1px solid rgba(255,255,255,0.1);" onerror="this.src='logo.png'">
                    </td>
                    <td><strong>${prod.name}</strong></td>
                    <td><span class="badge badge-new">${categoryBadge}</span></td>
                    <td class="text-primary font-weight-bold" id="price-val-${prod._id}">${prod.price ? prod.price.toLocaleString() : 0}đ</td>
                    <td>${hotBadge} ${discountBadge}</td>
                    <td style="display:flex; gap:8px; justify-content:center;">
                        <button type="button" class="btn-admin-action btn-add-money" onclick="window.openEditFullProductModal('${prod._id}')"><i class="fas fa-edit"></i> Sửa Toàn Diện</button>
                        <button type="button" class="btn-admin-action" onclick="executeDeleteProduct('${prod._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>`);
        });
        if (allAdminProductsCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ffeb3b; padding: 20px;">Kho hàng đang trống. Hãy thêm sản phẩm!</td></tr>';
        }
    } catch (error) {
        showToast('Lỗi tải danh sách sản phẩm từ Database!');
    }
}

async function fetchOrders() {
    try {
        const response = await fetch(API_URL + '/admin/orders', { cache: 'no-store' });
        const orders = await response.json();
        const tbody = document.getElementById('admin-orders-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        orders.forEach(order => {
            const dateObj = new Date(order.date);
            const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
            let keyDisplay = `<div class="key-box"><span>${order.key || ''}</span></div>`;
            if (order.status === 'Đang chờ xử lý' || !order.key) {
                keyDisplay = '<span class="badge status-pending">Đang chờ xuất key...</span>';
            }
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><span class="order-id">${order.orderId}</span></td>
                    <td><strong>${order.username}</strong></td>
                    <td>${order.productName}</td>
                    <td class="text-primary">${(order.price || 0).toLocaleString()}đ</td>
                    <td class="text-muted">${dateStr}</td>
                    <td>${keyDisplay}</td>
                    <td>
                        <button class="btn-admin-action" onclick="executeDeleteOrder('${order._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 5px 10px; font-size: 0.8rem;"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>`);
        });
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ffeb3b; padding: 20px;">Chưa có đơn hàng nào được mua.</td></tr>';
        }
    } catch (error) {
        showToast('Lỗi khi lấy danh sách đơn hàng!');
        console.error(error);
    }
}

async function executeDeleteOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Khách hàng sẽ bị mất lịch sử mua hàng.')) return;
    try {
        const res = await fetch(API_URL + '/admin/orders/' + orderId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Xóa đơn hàng thành công!');
            fetchOrders();
            fetchInventory();
            fetchDashboardStats();
        } else {
            showToast(data.message || 'Xóa thất bại!');
        }
    } catch (err) {
        showToast('Lỗi khi xóa đơn hàng!');
    }
}

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

async function fetchInventory() {
    try {
        const response = await fetch(API_URL + '/admin/inventory', { cache: 'no-store' });
        const inventory = await response.json();
        const tbody = document.getElementById('admin-inventory-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        inventory.forEach(item => {
            const sold = item.status === 'sold';
            const statusBadge = sold
                ? '<span class="badge status-success"><i class="fas fa-check-circle"></i> Đã bán</span>'
                : '<span class="badge status-pending" style="color:#9ca3af; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">Chưa bán</span>';
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><div class="key-box" style="margin: 0; padding: 4px 8px; font-size: 0.8rem; display: inline-block;"><span>${item.key}</span></div></td>
                    <td><strong>${item.productName}</strong></td>
                    <td class="text-primary">${(item.price || 0).toLocaleString()}đ</td>
                    <td>${statusBadge}</td>
                    <td>${item.buyer ? `<strong>${item.buyer}</strong>` : '-'}</td>
                    <td class="text-muted">${formatDate(item.dateSold || item.date)}</td>
                    <td>
                        <button class="btn-admin-action" onclick="executeDeleteKey('${item._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 5px 10px; font-size: 0.8rem;"><i class="fas fa-trash"></i> Xóa Key</button>
                    </td>
                </tr>`);
        });
        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ffeb3b; padding: 20px;">Kho Key hiện đang trống hoàn toàn.</td></tr>';
        }
    } catch (error) {
        showToast('Lỗi khi lấy danh sách Kho Key!');
        console.error(error);
    }
}

async function executeDeleteKey(keyId) {
    if (!confirm('Bạn có chắc chắn muốn xóa Key này khỏi kho?')) return;
    try {
        const res = await fetch(API_URL + '/admin/keys/' + keyId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast('Xóa Key thành công!');
            fetchInventory();
        } else {
            showToast(data.message || 'Xóa thất bại!');
        }
    } catch (err) {
        showToast('Lỗi khi xóa Key!');
    }
}

function showProductModalEl() {
    injectFullProductModal();
    const modal = document.getElementById('admin-full-product-modal');
    if (!modal) return null;
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
    modal.classList.add('show');
    return modal;
}

const DEFAULT_IMG_LIBRARY = [
    '/Img/aurora.webp',
    '/Img/Bypass.webp',
    '/Img/Blue.webp',
    '/Img/MSI.webp',
    '/Img/anti_vius.webp',
    '/Img/file_game.webp',
    '/Img/setup_driver.webp',
    '/Img/GhostAI.webp',
    '/src/IMG/cover.jpg',
    '/src/IMG/default.svg'
];

async function loadProductImageOptions(selectId, selected) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const fallback = '/src/IMG/cover.jpg';
    const current = selected || select.value || fallback;
    try {
        const res = await fetch(API_URL + '/download-images', { cache: 'no-store' });
        const data = await res.json();
        const files = Array.isArray(data.files) ? data.files : [];
        select.innerHTML = '';
        const list = files.length ? files : DEFAULT_IMG_LIBRARY;
        list.forEach(file => {
            const opt = document.createElement('option');
            opt.value = file;
            opt.textContent = file.split('/').pop();
            if (file === current || file.split('/').pop() === String(current).split('/').pop()) opt.selected = true;
            select.appendChild(opt);
        });
        if (current && ![...select.options].some(o => o.value === current)) {
            const opt = document.createElement('option');
            opt.value = current;
            opt.textContent = String(current).split('/').pop();
            opt.selected = true;
            select.appendChild(opt);
        }
    } catch (e) {
        select.innerHTML = '';
        DEFAULT_IMG_LIBRARY.forEach(file => {
            const opt = document.createElement('option');
            opt.value = file;
            opt.textContent = file.split('/').pop();
            if (file === current) opt.selected = true;
            select.appendChild(opt);
        });
    }
}

async function openAddProductModal() {
    try {
        const modal = showProductModalEl();
        if (!modal) return showToast('Không tạo được form sản phẩm. Hãy F5 trang admin.');
        document.getElementById('pm-modal-title').innerHTML = '<i class="fas fa-plus-circle"></i> Thêm Sản Phẩm Mới';
        document.getElementById('pm-id').value = '';
        document.getElementById('pm-name').value = '';
        document.getElementById('pm-category').value = 'cheat';
        document.getElementById('pm-price').value = '';
        document.getElementById('pm-orig-price').value = '';
        document.getElementById('pm-allow-discount').checked = true;
        document.getElementById('pm-desc').value = '';
        document.getElementById('pm-ishot').checked = false;
        const tagEl = document.getElementById('pm-tag');
        if (tagEl) tagEl.value = '';
        await loadProductImageOptions('pm-img', '/Img/aurora.webp');
    } catch (e) {
        console.error(e);
        showToast('Không mở được form thêm sản phẩm!');
    }
}

async function openEditFullProductModal(id) {
    try {
        let prod = allAdminProductsCache.find(p => p._id === id);
        if (!prod) {
            const res = await fetch(API_URL + '/products', { cache: 'no-store' });
            const list = await res.json();
            allAdminProductsCache = Array.isArray(list) ? list : [];
            prod = allAdminProductsCache.find(p => p._id === id);
        }
        if (!prod) return showToast('Không tìm thấy sản phẩm!');
        const modal = showProductModalEl();
        if (!modal) return showToast('Không tạo được form sản phẩm. Hãy F5 trang admin.');
        document.getElementById('pm-modal-title').innerHTML = '<i class="fas fa-edit"></i> Chỉnh Sửa Chi Tiết Sản Phẩm';
        document.getElementById('pm-id').value = prod._id;
        document.getElementById('pm-name').value = prod.name || '';
        document.getElementById('pm-category').value = prod.category || 'cheat';
        document.getElementById('pm-price').value = prod.price || 0;
        document.getElementById('pm-orig-price').value = prod.originalPrice || '';
        document.getElementById('pm-allow-discount').checked = prod.isDiscountable !== false;
        document.getElementById('pm-desc').value = prod.description || '';
        document.getElementById('pm-ishot').checked = !!prod.isHot;
        const tagEl = document.getElementById('pm-tag');
        if (tagEl) tagEl.value = prod.tag || '';
        await loadProductImageOptions('pm-img', prod.imageUrl);
    } catch (e) {
        console.error(e);
        showToast('Không mở được form sửa sản phẩm!');
    }
}

function closeFullProductModal() {
    const modal = document.getElementById('admin-full-product-modal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
}

async function executeSaveFullProduct() {
    const id = document.getElementById('pm-id').value;
    const name = document.getElementById('pm-name').value.trim();
    const category = document.getElementById('pm-category').value;
    const price = document.getElementById('pm-price').value;
    const originalPrice = document.getElementById('pm-orig-price').value;
    const isDiscountable = document.getElementById('pm-allow-discount').checked;
    const description = document.getElementById('pm-desc').value;
    const isHot = document.getElementById('pm-ishot').checked;
    const imageUrl = document.getElementById('pm-img').value;
    const tag = document.getElementById('pm-tag') ? document.getElementById('pm-tag').value.trim() : '';

    if (!name || !price) return showToast('Vui lòng nhập Tên và Giá sản phẩm!');

    const payload = {
        name,
        category,
        price: parseInt(price, 10),
        originalPrice: parseInt(originalPrice, 10) || 0,
        isDiscountable,
        description,
        isHot,
        imageUrl,
        tag
    };

    try {
        const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            showToast(data.message || 'Lưu sản phẩm thất bại!');
            return;
        }
        showToast(data.message || 'Thao tác thành công!');
        closeFullProductModal();
        fetchProducts();
        loadKeyProductDropdown();
    } catch (e) {
        showToast('Lỗi kết nối máy chủ! Mở http://localhost:5000/bemy và chạy npm start.');
    }
}

async function executeDeleteProduct(id) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này? Key trong kho của sản phẩm cũng sẽ bị xóa.')) return;
    try {
        const res = await fetch(API_URL + '/products/' + id, { method: 'DELETE' });
        const data = await res.json();
        showToast(data.message || 'Đã xóa sản phẩm!');
        fetchProducts();
        loadKeyProductDropdown();
        fetchInventory();
    } catch (err) {
        showToast('Lỗi khi xóa sản phẩm!');
    }
}

function injectFullProductModal() {
    if (document.getElementById('admin-full-product-modal')) return;
    const modalHtml = `
        <div class="modal-overlay" id="admin-full-product-modal" style="display: none; align-items: center; justify-content: center; z-index: 99999;">
            <div class="modal-card glass-panel" style="width: 580px; max-width: 95vw; padding: 25px; background: #161622; border: 1px solid #7c3aed; border-radius: 16px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 id="pm-modal-title" style="margin: 0; color: #a855f7; font-size: 1.25rem;"></h3>
                    <button onclick="closeFullProductModal()" style="background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <input type="hidden" id="pm-id">

                <div style="margin-bottom: 15px;">
                    <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Tên sản phẩm</label>
                    <input type="text" id="pm-name" class="admin-input" placeholder="VD: KEY AIMBOT PC AURORA VN" style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #333; border-radius:8px;">
                </div>

                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Danh mục</label>
                        <select id="pm-category" class="admin-input" style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #333; border-radius:8px;">
                            <option value="cheat">Bot & Cheat</option>
                            <option value="acc">Tài khoản Game</option>
                            <option value="tool">Công cụ hỗ trợ</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Ảnh đại diện (Thư mục Img)</label>
                        <select id="pm-img" class="admin-input" style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #7c3aed; border-radius:8px;"></select>
                        <input type="file" id="pm-img-file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style="width:100%; margin-top:8px; color:#ccc; font-size:0.8rem;">
                    </div>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Tag (hiện trên card shop)</label>
                    <input type="text" id="pm-tag" class="admin-input" placeholder="VD: AIMBOT AURORAVN" style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #333; border-radius:8px;">
                </div>

                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Giá bán hiện tại (VNĐ)</label>
                        <input type="number" id="pm-price" class="admin-input" placeholder="VD: 16250" style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #333; border-radius:8px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Giá gốc trước khi giảm (VNĐ)</label>
                        <input type="number" id="pm-orig-price" class="admin-input" placeholder="VD: 25000 (để gạch ngang)" style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #333; border-radius:8px;">
                    </div>
                </div>

                <div style="margin-bottom: 15px; background: rgba(255,255,255,0.03); padding: 12px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <strong style="color: #10b981; font-size: 0.95rem; display: block;">Cho phép áp dụng Giảm Giá / Mã Coupon / Đại lý Sell</strong>
                        <small style="color: #888;">Nếu tắt, sản phẩm này sẽ bán đúng giá niêm yết, không nhận chiết khấu.</small>
                    </div>
                    <input type="checkbox" id="pm-allow-discount" style="width: 22px; height: 22px; cursor: pointer; accent-color: #10b981;" checked>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:6px;">Mô tả & Tính năng (Mỗi dòng 1 tính năng hoặc dùng dấu ✓)</label>
                    <textarea id="pm-desc" class="admin-input" rows="6" placeholder="✓ Aimbot Safe&#10;✓ Định vị ESP..." style="width:100%; padding:10px; background:#0d0d14; color:#fff; border:1px solid #333; border-radius:8px; font-family:inherit; font-size:0.88rem;"></textarea>
                </div>

                <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="pm-ishot" style="width: 18px; height: 18px; cursor: pointer; accent-color: #ef4444;">
                    <label for="pm-ishot" style="color: #ef4444; font-weight: 700; cursor: pointer;">🔥 Đánh dấu là sản phẩm HOT (Nổi bật)</label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeFullProductModal()" style="padding: 10px 18px; background: #333; color: #fff; border: none; border-radius: 8px; cursor: pointer;">Hủy</button>
                    <button type="button" onclick="executeSaveFullProduct()" style="padding: 10px 22px; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; font-weight: 800; border: none; border-radius: 8px; cursor: pointer;">Lưu Sản Phẩm</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const fileEl = document.getElementById('pm-img-file');
    if (fileEl && !fileEl.dataset.bound) {
        fileEl.dataset.bound = '1';
        fileEl.addEventListener('change', async () => {
            const file = fileEl.files && fileEl.files[0];
            if (!file) return;
            try {
                const url = await uploadDownloadImageFile(file);
                await loadProductImageOptions('pm-img', url);
                fileEl.value = '';
            } catch (err) {
                showToast(err.message || 'Tải ảnh thất bại');
            }
        });
    }
}

window.openAddProductModal = openAddProductModal;
window.openEditFullProductModal = openEditFullProductModal;
window.closeFullProductModal = closeFullProductModal;
window.executeSaveFullProduct = executeSaveFullProduct;
window.executeDeleteProduct = executeDeleteProduct;

function injectKeyDurationUI() {
    const bulkInput = document.getElementById('bulk-key-input');
    if (!bulkInput || document.getElementById('key-duration')) return;
    const fieldsDiv = document.createElement('div');
    fieldsDiv.style.display = 'flex';
    fieldsDiv.style.gap = '10px';
    fieldsDiv.style.marginBottom = '15px';
    fieldsDiv.innerHTML = `
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
            <input type="number" id="key-price" class="admin-input" placeholder="VD: 50000" style="width: 100%;">
        </div>`;
    bulkInput.parentNode.insertBefore(fieldsDiv, bulkInput);
}

function openImportKeyModal() {
    injectKeyDurationUI();
    const modal = document.getElementById('import-key-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeImportKeyModal() {
    const modal = document.getElementById('import-key-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

async function loadKeyProductDropdown() {
    try {
        const response = await fetch(API_URL + '/products', { cache: 'no-store' });
        const products = await response.json();
        const select = document.getElementById('key-product-id');
        if (!select) return;
        select.innerHTML = '<option value="">Chọn sản phẩm</option>';
        products.forEach(prod => {
            const opt = document.createElement('option');
            opt.value = prod._id;
            opt.textContent = prod.name;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Failed to load products for key dropdown', err);
    }
}

async function saveBulkKeys() {
    const productId = document.getElementById('key-product-id').value;
    if (!productId) {
        showToast('Vui lòng chọn sản phẩm trước khi lưu key!');
        return;
    }
    const rawKeys = document.getElementById('bulk-key-input').value;
    const keys = rawKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) {
        showToast('Không có key nào để lưu!');
        return;
    }
    const duration = document.getElementById('key-duration') ? document.getElementById('key-duration').value : '1 Ngày';
    const priceEl = document.getElementById('key-price');
    const price = priceEl ? parseInt(priceEl.value) || 0 : 0;
    try {
        const res = await fetch(API_URL + `/products/${productId}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keys, duration, price })
        });
        const data = await res.json();
        showToast(data.message || 'Lưu key thành công!');
        document.getElementById('bulk-key-input').value = '';
        document.getElementById('key-product-id').value = '';
        if (priceEl) priceEl.value = '';
        closeImportKeyModal();
        fetchInventory();
    } catch (err) {
        console.error(err);
        showToast('Lưu key thất bại!');
    }
}

async function fetchDashboardStats() {
    try {
        const response = await fetch(API_URL + '/admin/stats', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const revenueEl = document.getElementById('admin-total-revenue');
        const usersEl = document.getElementById('admin-total-users');
        const ordersEl = document.getElementById('admin-total-orders');
        if (revenueEl) revenueEl.innerText = (data.totalRevenue || 0).toLocaleString() + 'đ';
        if (usersEl) usersEl.innerText = (data.totalUsers || 0).toLocaleString();
        if (ordersEl) ordersEl.innerText = (data.totalOrders || 0).toLocaleString();
    } catch (err) {
        console.error('Lỗi khi tải thống kê:', err);
    }
}

const fetchStats = fetchDashboardStats;

async function fetchTopups() {
    try {
        const response = await fetch(API_URL + '/admin/topups', { cache: 'no-store' });
        const topups = await response.json();
        const tbody = document.getElementById('admin-topups-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        topups.forEach(item => {
            let dateStr = '-';
            if (item.date) {
                const dateObj = new Date(item.date);
                dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;
            }
            const txId = item._id ? String(item._id).slice(-8).toUpperCase() : '------';
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><span class="order-id">SP-${txId}</span></td>
                    <td><strong>${item.username}</strong></td>
                    <td class="text-primary font-weight-bold">+${(item.amount || 0).toLocaleString()}đ</td>
                    <td><span class="text-warning">${item.desc || item.type || 'Nạp tiền vào tài khoản'}</span></td>
                    <td class="text-muted">${dateStr}</td>
                </tr>`);
        });
        if (topups.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ffeb3b; padding: 20px;">Chưa có dữ liệu nạp tiền nào.</td></tr>';
        }
    } catch (error) {
        showToast('Lỗi khi lấy danh sách nạp tiền!');
        console.error(error);
    }
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function injectDownloadsAdminUI() {
    const sidebarUl = document.querySelector('.sidebar-nav ul') || document.querySelector('.sidebar-nav');
    if (sidebarUl && !document.getElementById('admin-menu-downloads')) {
        sidebarUl.insertAdjacentHTML('beforeend', `
            <li id="admin-menu-downloads">
                <a href="#" onclick="event.preventDefault(); switchAdminPage('downloads')">
                    <i class="fas fa-download"></i> Tải xuống
                </a>
            </li>`);
    }

    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper && !document.getElementById('admin-downloads-page')) {
        contentWrapper.insertAdjacentHTML('beforeend', `
            <div id="admin-downloads-page" class="page-section" style="display: none;">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                    <div>
                        <h2 class="gradient-text"><i class="fas fa-download"></i> QUẢN LÝ TẢI XUỐNG</h2>
                        <p class="desc-text">Các mục này hiện trên trang khách: Tải xuống phần mềm.</p>
                    </div>
                    <button class="btn-auth" style="width: auto; padding: 12px 25px;" onclick="openAddDownloadModal()">
                        <i class="fas fa-plus"></i> Thêm Link Tải
                    </button>
                </div>
                <div class="orders-container hover-glow">
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Tên ứng dụng</th>
                                    <th>Mô tả</th>
                                    <th>Tag</th>
                                    <th>Link</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody id="admin-downloads-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>`);
    }

    if (!document.getElementById('admin-add-download-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="admin-add-download-modal" class="modal-overlay" style="display: none;">
                <div class="modal-card glass-panel" style="width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto;">
                    <button class="close-modal" onclick="closeAddDownloadModal()">×</button>
                    <h2 class="gradient-text" id="dl-modal-title" style="text-align:center; margin-bottom: 25px;">
                        <i class="fas fa-plus-circle"></i> THÊM TẢI XUỐNG
                    </h2>
                    <div class="input-group"><i class="fas fa-box"></i><input type="text" id="dl-name" placeholder="Tên file (VD: FFInject.exe)"></div>
                    <div class="input-group"><i class="fas fa-tag"></i><input type="text" id="dl-tag" placeholder="Tag (VD: AIMBOT AURORAVN)"></div>
                    <div class="input-group"><i class="fas fa-info"></i><input type="text" id="dl-desc" placeholder="Mô tả (VD: Đây là file tải xuống của Aimbot AuroraVN)"></div>
                    <div class="input-group"><i class="fas fa-weight-hanging"></i><input type="text" id="dl-size" placeholder="Dung lượng (VD: 2.9 MB)"></div>
                    <div class="input-group"><i class="fas fa-chart-line"></i><input type="number" id="dl-count" placeholder="Số lượt tải hiện tại (VD: 16600)"></div>
                    <div class="input-group"><i class="fas fa-link"></i><input type="text" id="dl-url" placeholder="Link tải (bắt buộc)"></div>
                    <div class="input-group"><i class="fas fa-play-circle"></i><input type="text" id="dl-video" placeholder="Link VIDEO HD (YouTube/Drive)"></div>
                    <div style="margin-bottom: 18px;">
                        <label class="admin-label" style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:8px;">Ảnh bìa (chọn từ thư mục Img hoặc tải lên)</label>
                        <select id="dl-img" class="admin-input" style="width:100%; margin-bottom:10px; padding: 10px; background: #1a1a2e; color: #fff; border: 1px solid #7c3aed; border-radius: 8px;" onchange="updateDownloadImagePreview(this.value)">
                            <option value="/Img/aurora.webp">aurora.webp</option>
                            <option value="/Img/Blue.webp">Blue.webp</option>
                            <option value="/Img/Bypass.webp">Bypass.webp</option>
                            <option value="/Img/MSI.webp">MSI.webp</option>
                            <option value="/src/IMG/cover.jpg">cover.jpg</option>
                        </select>
                        <input type="file" id="dl-img-file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style="width:100%; color:#ccc; font-size:0.85rem;">
                        <div style="width:100%; height:120px; background:radial-gradient(circle at center, rgba(168, 85, 247, 0.15), #0a0a10); border-radius:10px; margin-top:10px; border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; overflow:hidden; padding:5px;">
                            <img id="dl-img-preview" alt="preview" src="/Img/aurora.webp" style="max-width:100%; max-height:100%; object-fit:contain; display:block;">
                        </div>
                    </div>
                    <div class="input-group"><i class="fas fa-palette"></i><input type="text" id="dl-color" placeholder="Màu (không bắt buộc)"></div>
                    <div class="input-group"><i class="fas fa-icons"></i><input type="text" id="dl-icon" placeholder="Icon (không bắt buộc)"></div>
                    <button class="btn-auth" onclick="executeSaveDownload()">LƯU ĐẦY ĐỦ</button>
                </div>
            </div>`);
    }

    if (!document.getElementById('admin-edit-dl-links-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="admin-edit-dl-links-modal" class="modal-overlay" style="display: none;">
                <div class="modal-card glass-panel" style="width: 480px; max-width: 95vw;">
                    <button class="close-modal" onclick="closeEditDownloadLinksModal()">×</button>
                    <h2 class="gradient-text" style="text-align:center; margin-bottom: 10px;">
                        <i class="fas fa-link"></i> SỬA LINK TẢI
                    </h2>
                    <p id="ql-name" class="desc-text" style="text-align:center; margin-bottom: 20px; color:#c4b5fd;"></p>
                    <div class="input-group"><i class="fas fa-download"></i><input type="text" id="ql-url" placeholder="Link tải file (bắt buộc)"></div>
                    <div class="input-group"><i class="fas fa-play-circle"></i><input type="text" id="ql-video" placeholder="Link VIDEO HD"></div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn-auth" style="flex:1;" onclick="executeSaveDownloadLinks()">LƯU LINK</button>
                        <button class="btn-admin-action" style="flex:1;" onclick="openFullEditFromLinks()">Sửa đầy đủ</button>
                    </div>
                </div>
            </div>`);
    }
}

async function fetchDownloadsAdmin() {
    try {
        const res = await fetch(API_URL + '/downloads', { cache: 'no-store' });
        const data = await res.json();
        const tbody = document.getElementById('admin-downloads-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!Array.isArray(data) || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ffeb3b; padding: 20px;">Chưa có link tải nào. Bấm Thêm Link Tải.</td></tr>';
            return;
        }
        data.forEach(dl => {
            const shortUrl = dl.url && dl.url.length > 36 ? dl.url.slice(0, 36) + '…' : (dl.url || '');
            const imgSrc = resolveDownloadImage(dl.imageUrl);
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${escapeHtml(imgSrc)}" alt="" style="width:48px; height:32px; object-fit:cover; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">
                            <strong><i class="${escapeHtml(dl.iconClass || 'fas fa-download')}" style="color:${escapeHtml(dl.iconColor || '#a855f7')}"></i> ${escapeHtml(dl.name)}</strong>
                        </div>
                    </td>
                    <td>${escapeHtml(dl.description)}</td>
                    <td>${escapeHtml(dl.tag || dl.version)}</td>
                    <td class="text-muted" title="${escapeHtml(dl.url)}">${escapeHtml(shortUrl)}</td>
                    <td style="flex-wrap:wrap; gap:6px; justify-content:center;">
                        <button class="btn-admin-action btn-add-money" onclick="openEditDownloadModal('${dl._id}')"><i class="fas fa-edit"></i> Sửa đầy đủ</button>
                        <button class="btn-admin-action" onclick="openEditDownloadLinksModal('${dl._id}')" style="background: rgba(59,130,246,0.12); color:#60a5fa; border-color: rgba(59,130,246,0.35);"><i class="fas fa-link"></i> Sửa link</button>
                        <button class="btn-admin-action" onclick="executeDeleteDownload('${dl._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>`);
        });
    } catch (e) {
        console.error(e);
        showToast('Lỗi khi tải danh sách download!');
    }
}

function resolveDownloadImage(imageUrl) {
    if (!imageUrl) return '/src/IMG/cover.jpg';
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/src/IMG/') || imageUrl.startsWith('/Img/') || imageUrl.startsWith('/img/')) {
        return imageUrl.startsWith('/Img/') && /\.png$/i.test(imageUrl)
            ? imageUrl.replace(/\.png$/i, '.webp')
            : imageUrl;
    }
    const clean = String(imageUrl).replace(/^.*[\\/]/, '');
    if (clean.toLowerCase().includes('default') || clean.toLowerCase().includes('cover')) {
        return '/src/IMG/' + clean;
    }
    return '/Img/' + clean;
}

async function loadDownloadImageOptions(selected) {
    const select = document.getElementById('dl-img');
    if (!select) return;
    try {
        const res = await fetch(API_URL + '/download-images', { cache: 'no-store' });
        const data = await res.json();
        const files = Array.isArray(data.files) && data.files.length ? data.files : DEFAULT_IMG_LIBRARY;
        const current = resolveDownloadImage(selected || select.value);
        select.innerHTML = '';
        
        files.forEach(file => {
            const name = file.split('/').pop();
            const opt = document.createElement('option');
            opt.value = file;
            opt.textContent = name + ' (' + file + ')';
            if (file === current || name === current.split('/').pop()) opt.selected = true;
            select.appendChild(opt);
        });

        if (current && ![...select.options].some(o => o.value === current)) {
            const opt = document.createElement('option');
            opt.value = current;
            opt.textContent = current.split('/').pop() + ' (' + current + ')';
            opt.selected = true;
            select.appendChild(opt);
        }
        updateDownloadImagePreview(select.value);
    } catch (e) {
        console.error(e);
    }
}

function updateDownloadImagePreview(src) {
    const preview = document.getElementById('dl-img-preview');
    if (!preview) return;
    const url = resolveDownloadImage(src);
    preview.src = url;
    preview.style.display = 'block';
    preview.onerror = () => {
        preview.src = '/src/IMG/cover.jpg';
    };
}

async function uploadDownloadImageFile(file) {
    const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    const res = await fetch(API_URL + '/download-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload thất bại');
    await loadDownloadImageOptions(json.imageUrl);
    const select = document.getElementById('dl-img');
    if (select && json.imageUrl) select.value = json.imageUrl;
    updateDownloadImagePreview(json.imageUrl);
    showToast(json.message);
    return json.imageUrl;
}

function resetDownloadForm() {
    ['dl-name', 'dl-tag', 'dl-desc', 'dl-size', 'dl-count', 'dl-url', 'dl-video', 'dl-color', 'dl-icon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const fileEl = document.getElementById('dl-img-file');
    if (fileEl) fileEl.value = '';
    currentEditDownloadId = null;
    const title = document.getElementById('dl-modal-title');
    if (title) title.innerHTML = '<i class="fas fa-plus-circle"></i> THÊM TẢI XUỐNG';
    loadDownloadImageOptions('/src/IMG/default.svg');
}

function bindDownloadImageInputs() {
    const select = document.getElementById('dl-img');
    const fileEl = document.getElementById('dl-img-file');
    if (select && !select.dataset.bound) {
        select.dataset.bound = '1';
        select.addEventListener('change', () => updateDownloadImagePreview(select.value));
    }
    if (fileEl && !fileEl.dataset.bound) {
        fileEl.dataset.bound = '1';
        fileEl.addEventListener('change', async () => {
            if (!fileEl.files || !fileEl.files[0]) return;
            try {
                await uploadDownloadImageFile(fileEl.files[0]);
            } catch (e) {
                showToast(e.message || 'Không lưu được ảnh!');
            }
        });
    }
}

function openAddDownloadModal() {
    resetDownloadForm();
    bindDownloadImageInputs();
    const modal = document.getElementById('admin-add-download-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeAddDownloadModal() {
    const modal = document.getElementById('admin-add-download-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; resetDownloadForm(); }, 300);
}

async function openEditDownloadModal(id) {
    try {
        const res = await fetch(API_URL + '/downloads', { cache: 'no-store' });
        const data = await res.json();
        const dl = Array.isArray(data) ? data.find(item => item._id === id) : null;
        if (!dl) return showToast('Không tìm thấy mục tải xuống!');
        currentEditDownloadId = id;
        document.getElementById('dl-name').value = dl.name || '';
        document.getElementById('dl-tag').value = dl.tag || dl.version || '';
        document.getElementById('dl-desc').value = dl.description || '';
        document.getElementById('dl-size').value = dl.fileSize || '';
        document.getElementById('dl-count').value = dl.downloadCount || 0;
        document.getElementById('dl-url').value = dl.url || '';
        document.getElementById('dl-video').value = dl.videoUrl || '';
        document.getElementById('dl-color').value = dl.iconColor || '';
        document.getElementById('dl-icon').value = dl.iconClass || '';
        bindDownloadImageInputs();
        await loadDownloadImageOptions(resolveDownloadImage(dl.imageUrl));
        const title = document.getElementById('dl-modal-title');
        if (title) title.innerHTML = '<i class="fas fa-edit"></i> SỬA TẢI XUỐNG';
        const modal = document.getElementById('admin-add-download-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    } catch (e) {
        showToast('Lỗi khi mở form sửa!');
    }
}

function serverUnreachableMessage(err) {
    const msg = String((err && err.message) || err || '');
    if (/Failed to fetch|NetworkError|Load failed|Unexpected token/i.test(msg)) {
        return 'Không kết nối được API. Chạy npm start rồi mở http://localhost:5000/bemy (không dùng cổng 5500).';
    }
    return msg || 'Lỗi server!';
}

async function parseApiJson(res) {
    const text = await res.text();
    if (!text) return {};
    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error('Unexpected token');
    }
}

let savingDownload = false;

async function executeSaveDownload() {
    if (savingDownload) return;
    const name = document.getElementById('dl-name').value.trim();
    const url = document.getElementById('dl-url').value.trim();
    if (!name || !url) return showToast('Vui lòng nhập Tên và Link tải!');
    const tag = document.getElementById('dl-tag').value.trim();
    const payload = {
        name,
        url,
        tag,
        version: tag,
        description: document.getElementById('dl-desc').value.trim(),
        fileSize: document.getElementById('dl-size').value.trim(),
        downloadCount: parseInt(document.getElementById('dl-count').value, 10) || 0,
        videoUrl: document.getElementById('dl-video').value.trim(),
        imageUrl: resolveDownloadImage(document.getElementById('dl-img').value.trim()),
        iconColor: document.getElementById('dl-color').value.trim() || '#a855f7',
        iconClass: document.getElementById('dl-icon').value.trim() || 'fas fa-download'
    };
    savingDownload = true;
    try {
        const isEdit = !!currentEditDownloadId;
        const res = await fetch(isEdit ? API_URL + '/downloads/' + currentEditDownloadId : API_URL + '/downloads', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await parseApiJson(res);
        if (!res.ok) {
            showToast(data.message || 'Lưu thất bại!');
            return;
        }
        showToast(data.message || (isEdit ? 'Đã cập nhật!' : 'Đã thêm link tải!'));
        closeAddDownloadModal();
        fetchDownloadsAdmin();
    } catch (e) {
        showToast(serverUnreachableMessage(e));
    } finally {
        savingDownload = false;
    }
}

async function executeDeleteDownload(id) {
    if (!confirm('Xóa link tải này khỏi trang khách?')) return;
    try {
        const res = await fetch(API_URL + '/downloads/' + id, { method: 'DELETE' });
        const data = await res.json();
        showToast(data.message || 'Đã xóa!');
        fetchDownloadsAdmin();
    } catch (e) {
        showToast('Lỗi khi xóa!');
    }
}

let currentQuickLinkId = null;

async function openEditDownloadLinksModal(id) {
    try {
        const res = await fetch(API_URL + '/downloads', { cache: 'no-store' });
        const data = await res.json();
        const dl = Array.isArray(data) ? data.find(item => item._id === id) : null;
        if (!dl) return showToast('Không tìm thấy mục tải xuống!');
        currentQuickLinkId = id;
        const nameEl = document.getElementById('ql-name');
        if (nameEl) nameEl.innerText = dl.name || '';
        document.getElementById('ql-url').value = dl.url || '';
        document.getElementById('ql-video').value = dl.videoUrl || '';
        const modal = document.getElementById('admin-edit-dl-links-modal');
        if (!modal) return showToast('Chưa có form sửa link. Hãy F5 trang admin.');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    } catch (e) {
        showToast('Lỗi khi mở sửa link!');
    }
}

function closeEditDownloadLinksModal() {
    const modal = document.getElementById('admin-edit-dl-links-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; currentQuickLinkId = null; }, 300);
}

async function executeSaveDownloadLinks() {
    if (!currentQuickLinkId) return;
    const url = document.getElementById('ql-url').value.trim();
    if (!url) return showToast('Vui lòng nhập Link tải!');
    try {
        const res = await fetch(API_URL + '/downloads/' + currentQuickLinkId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url,
                videoUrl: document.getElementById('ql-video').value.trim()
            })
        });
        const data = await res.json();
        showToast(data.message || 'Đã lưu link tải!');
        closeEditDownloadLinksModal();
        fetchDownloadsAdmin();
    } catch (e) {
        showToast('Lỗi khi lưu link!');
    }
}

function openFullEditFromLinks() {
    const id = currentQuickLinkId;
    closeEditDownloadLinksModal();
    if (id) setTimeout(() => openEditDownloadModal(id), 320);
}

window.openAddDownloadModal = openAddDownloadModal;
window.closeAddDownloadModal = closeAddDownloadModal;
window.openEditDownloadModal = openEditDownloadModal;
window.executeSaveDownload = executeSaveDownload;
window.executeDeleteDownload = executeDeleteDownload;
window.openEditDownloadLinksModal = openEditDownloadLinksModal;
window.closeEditDownloadLinksModal = closeEditDownloadLinksModal;
window.executeSaveDownloadLinks = executeSaveDownloadLinks;
window.openFullEditFromLinks = openFullEditFromLinks;

// ==========================================
// 🌟 QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) & CẤP BẬC SELL
// ==========================================
let currentResellerTargetUser = '';

function sellProdId(p) {
    return String((p && (p._id || p.id)) || '');
}

function defaultSellPercent() {
    const el = document.getElementById('reseller-discount-percent');
    const n = parseInt(el && el.value, 10);
    return n > 0 && n <= 100 ? n : 10;
}

function selectedSellProductRates() {
    return Array.from(document.querySelectorAll('.sell-prod-cb:checked')).map(cb => {
        const row = cb.closest('.sell-prod-row');
        const inp = row ? row.querySelector('.sell-prod-pct') : null;
        let percent = parseInt(inp && inp.value, 10);
        if (!(percent > 0 && percent <= 100)) percent = defaultSellPercent();
        return { productId: cb.value, percent };
    });
}

function onSellProdCheck(cb) {
    const row = cb.closest('.sell-prod-row');
    const inp = row ? row.querySelector('.sell-prod-pct') : null;
    if (!inp) return;
    inp.disabled = !cb.checked;
    if (cb.checked && !(parseInt(inp.value, 10) > 0)) inp.value = String(defaultSellPercent());
    updateSellProdCount();
}

function updateSellProdCount() {
    const countEl = document.getElementById('sell-prod-count');
    if (!countEl) return;
    const rates = selectedSellProductRates();
    const total = document.querySelectorAll('#sell-prod-picker .sell-prod-cb').length;
    countEl.textContent = rates.length
        ? (rates.length + ' món được giảm / ' + total + ' sản phẩm')
        : ('0 được giảm / ' + total + ' sản phẩm');
}

function filterSellProductPicker() {
    const q = String((document.getElementById('sell-prod-search') || {}).value || '').trim().toLowerCase();
    document.querySelectorAll('.sell-prod-group').forEach(group => {
        let visible = 0;
        group.querySelectorAll('.sell-prod-row').forEach(row => {
            const show = !q || (row.getAttribute('data-name') || '').indexOf(q) !== -1;
            row.style.display = show ? 'flex' : 'none';
            if (show) visible += 1;
        });
        group.style.display = visible ? '' : 'none';
    });
}

function sellProductCategory(p) {
    const raw = String((p && p.category) || '').trim().toLowerCase();
    if (raw === 'cheat' || raw === 'bot' || raw === 'aimbot') return 'cheat';
    if (raw === 'acc' || raw === 'account' || raw === 'accounts') return 'acc';
    if (raw === 'tool' || raw === 'tools') return 'tool';
    return raw || 'other';
}

function renderSellProductPicker(selectedRates) {
    const box = document.getElementById('sell-prod-picker');
    if (!box) return;
    const groups = { cheat: 'Bot & Cheat', acc: 'Tài khoản Game', tool: 'Công cụ hỗ trợ', other: 'Khác' };
    const rateMap = {};
    (selectedRates || []).forEach(r => {
        const id = String((r && (r.productId || r.id)) || '');
        const pct = Number(r && r.percent) || 0;
        if (id && pct > 0) rateMap[id] = pct;
    });
    const products = Array.isArray(allAdminProductsCache) ? allAdminProductsCache.slice() : [];
    if (!products.length) {
        box.innerHTML = '<p class="desc-text">Không tải được sản phẩm. F5 trang admin rồi mở lại.</p>';
        updateSellProdCount();
        return;
    }
    const used = {};
    products.forEach(p => { used[sellProductCategory(p)] = true; });
    let html = '';
    const order = ['cheat', 'acc', 'tool'].concat(Object.keys(used).filter(k => !groups[k]));
    if (used.other) order.push('other');
    const seen = new Set();
    const fallback = defaultSellPercent();
    order.forEach(cat => {
        if (seen.has(cat)) return;
        seen.add(cat);
        const list = products.filter(p => sellProductCategory(p) === cat);
        if (!list.length) return;
        const title = groups[cat] || cat;
        html += '<div class="sell-prod-group"><p class="sell-prod-cat">' + title + ' (' + list.length + ')</p>';
        list.forEach(p => {
            const id = sellProdId(p);
            const on = Object.prototype.hasOwnProperty.call(rateMap, id);
            const pct = on ? rateMap[id] : fallback;
            const name = String(p.name || 'Sản phẩm').replace(/[<>]/g, '');
            html += '<div class="sell-prod-row" data-name="' + name.toLowerCase().replace(/"/g, '') + '">'
                + '<label><input type="checkbox" class="sell-prod-cb" value="' + id + '"' + (on ? ' checked' : '') + '> '
                + '<span class="sell-prod-name">' + name + ' <small>' + Number(p.price || 0).toLocaleString() + 'đ</small></span></label>'
                + '<div class="sell-prod-pct-wrap"><input type="number" class="sell-prod-pct" min="1" max="100" value="' + pct + '"' + (on ? '' : ' disabled') + '><span>%</span></div>'
                + '</div>';
        });
        html += '</div>';
    });
    box.innerHTML = html || '<p class="desc-text">Không có sản phẩm để chọn.</p>';
    box.querySelectorAll('.sell-prod-cb').forEach(el => {
        el.addEventListener('change', function () { onSellProdCheck(el); });
    });
    box.querySelectorAll('.sell-prod-pct').forEach(el => {
        el.addEventListener('input', updateSellProdCount);
    });
    updateSellProdCount();
    filterSellProductPicker();
}

async function openResellerModal(username) {
    currentResellerTargetUser = username;
    document.getElementById('reseller-target-username').innerText = username;
    const user = allAdminUsersCache.find(u => u.username === username) || {};
    document.getElementById('reseller-is-active').checked = true;
    document.getElementById('reseller-discount-percent').value = user.discountPercent > 0 ? user.discountPercent : 10;
    const picker = document.getElementById('sell-prod-picker');
    if (picker) picker.innerHTML = '<p class="desc-text">Đang tải toàn bộ sản phẩm...</p>';
    const modal = document.getElementById('admin-reseller-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
    try {
        const res = await fetch(API_URL + '/products', { cache: 'no-store' });
        const products = await res.json();
        allAdminProductsCache = Array.isArray(products) ? products : [];
    } catch (_) {
        allAdminProductsCache = Array.isArray(allAdminProductsCache) ? allAdminProductsCache : [];
    }
    let rates = Array.isArray(user.sellProductRates) ? user.sellProductRates : [];
    if (!rates.length && Array.isArray(user.sellProductIds) && user.sellProductIds.length) {
        const fallback = user.discountPercent > 0 ? user.discountPercent : 10;
        rates = user.sellProductIds.map(id => ({ productId: String(id), percent: fallback }));
    }
    renderSellProductPicker(rates);
    const search = document.getElementById('sell-prod-search');
    if (search) {
        search.value = '';
        search.oninput = filterSellProductPicker;
    }
}

function closeResellerModal() {
    const modal = document.getElementById('admin-reseller-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

async function executeSaveReseller() {
    if (!currentResellerTargetUser) return;
    const checked = document.getElementById('reseller-is-active').checked;
    const discountPercent = defaultSellPercent();
    const sellProductRates = checked ? selectedSellProductRates() : [];
    const isReseller = checked && sellProductRates.length > 0;
    if (isReseller && !sellProductRates.length) {
        showToast('Tick sản phẩm và nhập % giảm cho từng món!');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/admin/users/${currentResellerTargetUser}/reseller`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isReseller, discountPercent, sellProductRates })
        });
        const data = await res.json();
        showToast(data.message || 'Đã cập nhật trạng thái Sell!');
        closeResellerModal();
        fetchUsers();
    } catch (e) {
        showToast('Lỗi khi cập nhật!');
    }
}

async function fetchCouponsAdmin() {
    try {
        const res = await fetch(API_URL + '/admin/coupons', { cache: 'no-store' });
        const coupons = await res.json();
        const tbody = document.getElementById('admin-coupons-tbody');
        if (!tbody) return;
        const list = Array.isArray(coupons) ? coupons : [];
        const now = Date.now();
        const activeCount = list.filter(c => {
            const expired = c.expiresAt && new Date(c.expiresAt).getTime() < now;
            const usedUp = c.maxUsage > 0 && (c.usedCount || 0) >= c.maxUsage;
            return c.status !== 'inactive' && !expired && !usedUp;
        }).length;
        const totalUses = list.reduce((sum, c) => sum + (c.usedCount || 0), 0);
        const totalEl = document.getElementById('coupon-stat-total');
        const activeEl = document.getElementById('coupon-stat-active');
        const usesEl = document.getElementById('coupon-stat-uses');
        if (totalEl) totalEl.textContent = String(list.length);
        if (activeEl) activeEl.textContent = String(activeCount);
        if (usesEl) usesEl.textContent = String(totalUses);

        tbody.innerHTML = '';
        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="coupon-empty">
                        <div class="coupon-empty-icon"><i class="fas fa-ticket-alt"></i></div>
                        <div style="color:#fff; font-weight:700; margin-bottom:6px;">Chưa có mã giảm giá</div>
                        <div style="color:#9ca3af; margin-bottom:16px;">Tạo mã để khách hàng nhập khi thanh toán.</div>
                        <button type="button" class="btn-auth" style="width:auto; padding:12px 22px;" onclick="openAddCouponModal()">
                            <i class="fas fa-plus"></i> Tạo mã đầu tiên
                        </button>
                    </td>
                </tr>`;
            return;
        }

        list.forEach(c => {
            const expired = c.expiresAt && new Date(c.expiresAt).getTime() < now;
            const usedUp = c.maxUsage > 0 && (c.usedCount || 0) >= c.maxUsage;
            const inactive = c.status === 'inactive';
            let statusHtml = '<span class="badge status-success">Đang chạy</span>';
            if (inactive) statusHtml = '<span class="badge" style="background:rgba(156,163,175,0.15); color:#9ca3af; border:1px solid rgba(156,163,175,0.3);">Tạm tắt</span>';
            else if (expired) statusHtml = '<span class="badge" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3);">Hết hạn</span>';
            else if (usedUp) statusHtml = '<span class="badge" style="background:rgba(245,158,11,0.15); color:#fbbf24; border:1px solid rgba(245,158,11,0.3);">Hết lượt</span>';

            const used = c.usedCount || 0;
            const max = c.maxUsage || 0;
            const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : Math.min(100, used ? 8 : 0);
            const usageLabel = max > 0 ? `${used} / ${max}` : `${used} / ∞`;
            const expStr = c.expiresAt ? formatDate(c.expiresAt) : 'Không hết hạn';
            const nextStatus = inactive ? 'active' : 'inactive';
            const toggleLabel = inactive ? 'Bật' : 'Tắt';
            const toggleIcon = inactive ? 'fa-play' : 'fa-pause';

            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>
                        <span class="coupon-code-chip">
                            ${escapeHtml(c.code)}
                            <button type="button" title="Sao chép mã" onclick="copyCouponCode('${escapeHtml(c.code)}')"><i class="fas fa-copy"></i></button>
                        </span>
                    </td>
                    <td><span class="badge" style="background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.35); font-weight: 800;">-${c.discountPercent}%</span></td>
                    <td>
                        <div class="coupon-usage">
                            <div class="coupon-usage-meta"><span>Đã dùng</span><span>${usageLabel}</span></div>
                            <div class="coupon-usage-bar"><span style="width:${pct}%"></span></div>
                        </div>
                    </td>
                    <td class="text-muted">${escapeHtml(expStr)}</td>
                    <td>${statusHtml}</td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center;">
                        <button type="button" class="btn-admin-action" onclick="toggleCouponStatus('${c._id}', '${nextStatus}')"><i class="fas ${toggleIcon}"></i> ${toggleLabel}</button>
                        <button type="button" class="btn-admin-action" onclick="executeDeleteCoupon('${c._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>`);
        });
    } catch (e) {
        console.error(e);
        showToast('Không tải được danh sách mã giảm giá!');
    }
}

function copyCouponCode(code) {
    const text = String(code || '');
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Đã sao chép ' + text)).catch(() => showToast(text));
        return;
    }
    showToast(text);
}

function generateCouponCode() {
    const el = document.getElementById('new-coupon-code');
    if (!el) return;
    el.value = 'TG' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function setCouponPercent(value) {
    const el = document.getElementById('new-coupon-percent');
    if (el) el.value = value;
    document.querySelectorAll('.coupon-preset').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.percent) === Number(value));
    });
}

function openAddCouponModal() {
    const modal = document.getElementById('admin-add-coupon-modal');
    if (!modal) {
        injectCouponAndResellerUI();
    }
    const m = document.getElementById('admin-add-coupon-modal');
    if (!m) return showToast('Không mở được form tạo mã. Hãy F5.');
    const codeEl = document.getElementById('new-coupon-code');
    const percentEl = document.getElementById('new-coupon-percent');
    const maxEl = document.getElementById('new-coupon-max');
    const expEl = document.getElementById('new-coupon-expires');
    if (codeEl) codeEl.value = '';
    if (percentEl) percentEl.value = '20';
    if (maxEl) maxEl.value = '0';
    if (expEl) expEl.value = '';
    setCouponPercent(20);
    m.style.display = 'flex';
    m.classList.add('show');
}

function closeAddCouponModal() {
    const modal = document.getElementById('admin-add-coupon-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 250);
}

async function executeAddCoupon() {
    const code = document.getElementById('new-coupon-code').value.trim();
    const discountPercent = document.getElementById('new-coupon-percent').value;
    const maxUsage = document.getElementById('new-coupon-max').value;
    const expiresAt = document.getElementById('new-coupon-expires').value;

    if (!code || !discountPercent) {
        return showToast('Vui lòng nhập Mã và % giảm giá!');
    }

    try {
        const res = await fetch(API_URL + '/admin/coupons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                discountPercent: parseInt(discountPercent, 10),
                maxUsage: parseInt(maxUsage, 10) || 0,
                expiresAt: expiresAt || null
            })
        });
        const data = await res.json();
        showToast(data.message || (res.ok ? 'Đã tạo mã!' : 'Tạo mã thất bại!'));
        if (res.ok) {
            closeAddCouponModal();
            fetchCouponsAdmin();
        }
    } catch (e) {
        showToast('Lỗi khi tạo mã giảm giá!');
    }
}

async function toggleCouponStatus(id, status) {
    try {
        const res = await fetch(API_URL + '/admin/coupons/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        showToast(data.message || 'Đã cập nhật!');
        fetchCouponsAdmin();
    } catch (e) {
        showToast('Không đổi được trạng thái mã!');
    }
}

async function executeDeleteCoupon(id) {
    if (!confirm('Xóa mã giảm giá này? Khách sẽ không dùng được nữa.')) return;
    try {
        const res = await fetch(API_URL + '/admin/coupons/' + id, { method: 'DELETE' });
        const data = await res.json();
        showToast(data.message || 'Đã xóa mã!');
        fetchCouponsAdmin();
    } catch (e) {
        showToast('Lỗi khi xóa mã!');
    }
}

function injectCouponAndResellerUI() {
    const sidebarUl = document.querySelector('.sidebar-nav ul') || document.querySelector('.sidebar-nav');
    if (sidebarUl && !document.getElementById('admin-menu-coupons')) {
        sidebarUl.insertAdjacentHTML('beforeend', `
            <li id="admin-menu-coupons">
                <a href="#" onclick="event.preventDefault(); switchAdminPage('coupons')">
                    <i class="fas fa-ticket-alt"></i> Mã giảm giá
                </a>
            </li>`);
    }

    const misplaced = document.getElementById('admin-coupons-page');
    if (misplaced && !misplaced.closest('.content-wrapper')) misplaced.remove();

    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper && !document.getElementById('admin-coupons-page')) {
        contentWrapper.insertAdjacentHTML('beforeend', `
            <div id="admin-coupons-page" class="page-section" style="display: none;">
                <div class="section-header coupon-page-header">
                    <div>
                        <h2 class="gradient-text"><i class="fas fa-ticket-alt"></i> MÃ GIẢM GIÁ</h2>
                        <p class="desc-text">Tạo coupon cho khách khi mua hàng. Chiết khấu Sell chỉnh ở Thành viên → Cấp Sell.</p>
                    </div>
                    <button type="button" class="btn-auth" style="width: auto; padding: 12px 25px;" onclick="openAddCouponModal()">
                        <i class="fas fa-plus"></i> Tạo mã mới
                    </button>
                </div>
                <div class="coupon-stats">
                    <div class="coupon-stat-card">
                        <div class="coupon-stat-icon" style="background:rgba(139,92,246,0.18); color:#c4b5fd;"><i class="fas fa-ticket-alt"></i></div>
                        <div><small>Tổng mã</small><strong id="coupon-stat-total">0</strong></div>
                    </div>
                    <div class="coupon-stat-card">
                        <div class="coupon-stat-icon" style="background:rgba(16,185,129,0.18); color:#34d399;"><i class="fas fa-check-circle"></i></div>
                        <div><small>Đang chạy</small><strong id="coupon-stat-active">0</strong></div>
                    </div>
                    <div class="coupon-stat-card">
                        <div class="coupon-stat-icon" style="background:rgba(236,72,153,0.18); color:#f9a8d4;"><i class="fas fa-chart-line"></i></div>
                        <div><small>Lượt đã dùng</small><strong id="coupon-stat-uses">0</strong></div>
                    </div>
                </div>
                <div class="coupon-panel hover-glow">
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Mã giảm giá</th>
                                    <th>Mức giảm</th>
                                    <th>Lượt dùng</th>
                                    <th>Hạn dùng</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody id="admin-coupons-tbody"></tbody>
                        </table>
                    </div>
                </div>
                <p class="coupon-hint"><i class="fas fa-info-circle"></i> Đại lý Sell không tạo ở đây — vào <strong>Thành viên</strong>, bấm <strong>Cấp Sell</strong> trên từng tài khoản.</p>
            </div>`);
    }

    const oldSellModal = document.getElementById('admin-reseller-modal');
    if (oldSellModal) oldSellModal.remove();
    document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="admin-reseller-modal" style="display: none;">
                <div class="modal-card glass-panel" style="width: 560px; max-width: 95vw; padding: 28px;">
                    <button type="button" class="close-modal" onclick="closeResellerModal()">×</button>
                    <h2 class="gradient-text" style="text-align:center; margin-bottom: 8px;"><i class="fas fa-crown"></i> CẤP SELL / CTV</h2>
                    <p class="desc-text" style="text-align:center; margin-bottom: 18px;">Tài khoản: <strong id="reseller-target-username" style="color:#fff;"></strong></p>
                    <div style="margin-bottom: 18px; display: flex; align-items: center; gap: 10px; background: rgba(245,158,11,0.08); padding: 12px 15px; border-radius: 10px; border: 1px solid rgba(245,158,11,0.25);">
                        <input type="checkbox" id="reseller-is-active" style="width: 20px; height: 20px; cursor: pointer; accent-color: #f59e0b;">
                        <label for="reseller-is-active" style="color: #fbbf24; font-weight: 700; cursor: pointer;">Kích hoạt đại lý (SELL)</label>
                    </div>
                    <div class="input-group"><i class="fas fa-percent"></i><input type="number" id="reseller-discount-percent" min="1" max="100" placeholder="Mặc định % khi tick mới (VD: 10)"></div>
                    <p style="color:#fbbf24; font-size:0.85rem; font-weight:700; margin:0 0 8px;">Tick sản phẩm rồi nhập % giảm riêng từng món</p>
                    <input type="search" id="sell-prod-search" placeholder="Tìm sản phẩm..." style="width:100%; margin-bottom:10px; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,.1); background:#0d0d14; color:#fff; font:inherit;">
                    <div id="sell-prod-picker" class="sell-prod-picker"></div>
                    <p id="sell-prod-count" class="desc-text" style="margin:8px 0 14px;">0 sản phẩm được giảm</p>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="btn-admin-action" style="flex:1; padding:12px;" onclick="closeResellerModal()">Hủy</button>
                        <button type="button" class="btn-auth" style="flex:1;" onclick="executeSaveReseller()">Lưu thay đổi</button>
                    </div>
                </div>
            </div>`);

    if (!document.getElementById('admin-add-coupon-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="admin-add-coupon-modal" style="display: none;">
                <div class="modal-card glass-panel" style="width: 480px; max-width: 95vw; padding: 28px;">
                    <button type="button" class="close-modal" onclick="closeAddCouponModal()">×</button>
                    <h2 class="gradient-text" style="text-align:center; margin-bottom: 8px;"><i class="fas fa-ticket-alt"></i> TẠO MÃ GIẢM GIÁ</h2>
                    <p class="desc-text" style="text-align:center; margin-bottom: 20px;">Mã sẽ được in hoa. Khách nhập khi thanh toán.</p>
                    <div class="input-group">
                        <i class="fas fa-barcode"></i>
                        <input type="text" id="new-coupon-code" placeholder="Mã code (VD: GHOSTVIP20)" style="text-transform:uppercase;">
                    </div>
                    <button type="button" class="btn-admin-action" style="width:100%; margin:-6px 0 16px;" onclick="generateCouponCode()">
                        <i class="fas fa-random"></i> Tạo mã ngẫu nhiên
                    </button>
                    <div class="input-group">
                        <i class="fas fa-percent"></i>
                        <input type="number" id="new-coupon-percent" min="1" max="100" placeholder="Mức giảm % (1-100)">
                    </div>
                    <div class="coupon-presets">
                        <button type="button" class="coupon-preset" data-percent="10" onclick="setCouponPercent(10)">-10%</button>
                        <button type="button" class="coupon-preset" data-percent="20" onclick="setCouponPercent(20)">-20%</button>
                        <button type="button" class="coupon-preset" data-percent="30" onclick="setCouponPercent(30)">-30%</button>
                        <button type="button" class="coupon-preset" data-percent="50" onclick="setCouponPercent(50)">-50%</button>
                    </div>
                    <div class="input-group" style="margin-top:16px;">
                        <i class="fas fa-users"></i>
                        <input type="number" id="new-coupon-max" min="0" value="0" placeholder="Giới hạn lượt dùng (0 = không giới hạn)">
                    </div>
                    <div class="input-group">
                        <i class="fas fa-calendar-alt"></i>
                        <input type="datetime-local" id="new-coupon-expires" title="Hạn dùng">
                    </div>
                    <p class="desc-text" style="margin-top:-8px; margin-bottom:16px;">Để trống hạn dùng nếu mã không hết hạn.</p>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="btn-admin-action" style="flex:1; padding:12px;" onclick="closeAddCouponModal()">Hủy</button>
                        <button type="button" class="btn-auth" style="flex:1;" onclick="executeAddCoupon()">Tạo mã</button>
                    </div>
                </div>
            </div>`);
    }
}

let allAdminNewsCache = [];
const NEWS_STYLE_PRESETS = [
    { label: 'Thành công', icon: 'fas fa-check-circle', color: '#10b981' },
    { label: 'Cập nhật', icon: 'fas fa-rocket', color: '#8b5cf6' },
    { label: 'Cảnh báo', icon: 'fas fa-exclamation-triangle', color: '#fbbf24' },
    { label: 'Bảo trì', icon: 'fas fa-wrench', color: '#38bdf8' },
    { label: 'Khẩn', icon: 'fas fa-bolt', color: '#f97316' }
];

function setNewsStylePreset(index) {
    const p = NEWS_STYLE_PRESETS[index];
    if (!p) return;
    const iconEl = document.getElementById('news-icon');
    const colorEl = document.getElementById('news-color');
    const accentEl = document.getElementById('news-accent');
    if (iconEl) iconEl.value = p.icon;
    if (colorEl) colorEl.value = p.color;
    if (accentEl) accentEl.value = p.color;
}

async function fetchNewsAdmin() {
    try {
        const res = await fetch(API_URL + '/news', { cache: 'no-store' });
        const data = await res.json();
        allAdminNewsCache = Array.isArray(data) ? data : [];
        const tbody = document.getElementById('admin-news-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!allAdminNewsCache.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ffeb3b; padding:24px;">Chưa có tin. Bấm Thêm tin tức.</td></tr>';
            return;
        }
        allAdminNewsCache.forEach(n => {
            const img = resolveDownloadImage(n.imageUrl);
            const important = n.isImportant
                ? '<span class="badge" style="background:rgba(251,146,60,0.2); color:#fb923c; border:1px solid rgba(251,146,60,0.35);">QUAN TRỌNG</span>'
                : '';
            const catLabel = n.category === 'blog' ? 'Blog' : 'Tin tức';
            tbody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td><img src="${escapeHtml(img)}" alt="" style="width:72px; height:44px; object-fit:cover; border-radius:8px; border:1px solid rgba(255,255,255,0.1);" onerror="this.src='/src/IMG/default.svg'"></td>
                    <td>
                        <strong>${escapeHtml(n.title)}</strong>
                        <div style="margin-top:6px;"><span class="badge badge-new">${catLabel}</span> ${important}</div>
                    </td>
                    <td class="text-muted">${escapeHtml(n.dateLabel || '')}</td>
                    <td class="text-muted" style="max-width:280px; white-space:normal;">${escapeHtml((n.description || '').slice(0, 90))}${(n.description || '').length > 90 ? '…' : ''}</td>
                    <td style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center;">
                        <button type="button" class="btn-admin-action btn-add-money" onclick="openNewsModal('${n._id}')"><i class="fas fa-edit"></i> Sửa</button>
                        <button type="button" class="btn-admin-action" onclick="executeDeleteNews('${n._id}')" style="background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>`);
        });
    } catch (e) {
        console.error(e);
        showToast('Không tải được tin tức!');
    }
}

async function openNewsModal(id) {
    injectNewsAdminUI();
    const modal = document.getElementById('admin-news-modal');
    if (!modal) return showToast('Không mở được form tin tức. Hãy F5.');
    currentEditNewsId = id || null;
    const item = id ? allAdminNewsCache.find(n => n._id === id) : null;
    document.getElementById('news-modal-title').innerHTML = item
        ? '<i class="fas fa-edit"></i> SỬA TIN TỨC'
        : '<i class="fas fa-plus-circle"></i> THÊM TIN TỨC';
    document.getElementById('news-title').value = item ? (item.title || '') : '';
    const catEl = document.getElementById('news-category');
    if (catEl) catEl.value = item && item.category === 'blog' ? 'blog' : 'news';
    document.getElementById('news-desc').value = item ? (item.description || '') : '';
    const contentEl = document.getElementById('news-content');
    if (contentEl) contentEl.value = item ? (item.content || item.description || '') : '';
    const linkEl = document.getElementById('news-link');
    if (linkEl) linkEl.value = item ? (item.linkUrl || '') : '';
    document.getElementById('news-date').value = item ? (item.dateLabel || '') : '';
    document.getElementById('news-icon').value = item ? (item.iconClass || 'fas fa-check-circle') : 'fas fa-check-circle';
    document.getElementById('news-color').value = item ? (item.iconColor || '#10b981') : '#10b981';
    document.getElementById('news-accent').value = item ? (item.accentColor || item.iconColor || '#10b981') : '#10b981';
    document.getElementById('news-order').value = item ? (item.order || 0) : (allAdminNewsCache.length + 1);
    document.getElementById('news-important').checked = !!(item && item.isImportant);
    document.getElementById('news-img-url').value = item ? (item.imageUrl || '') : '';
    await loadProductImageOptions('news-img', item && item.imageUrl ? item.imageUrl : '/src/IMG/default.svg');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

function closeNewsModal() {
    const modal = document.getElementById('admin-news-modal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
    currentEditNewsId = null;
}

async function executeSaveNews() {
    const title = document.getElementById('news-title').value.trim();
    if (!title) return showToast('Vui lòng nhập tiêu đề tin!');
    const customUrl = document.getElementById('news-img-url').value.trim();
    const selectedImg = document.getElementById('news-img').value;
    const payload = {
        title,
        description: document.getElementById('news-desc').value.trim(),
        content: (document.getElementById('news-content') && document.getElementById('news-content').value.trim()) || document.getElementById('news-desc').value.trim(),
        linkUrl: document.getElementById('news-link') ? document.getElementById('news-link').value.trim() : '',
        dateLabel: document.getElementById('news-date').value.trim(),
        iconClass: document.getElementById('news-icon').value.trim() || 'fas fa-newspaper',
        iconColor: document.getElementById('news-color').value.trim() || '#8b5cf6',
        accentColor: document.getElementById('news-accent').value.trim() || '#8b5cf6',
        order: parseInt(document.getElementById('news-order').value, 10) || 0,
        isImportant: document.getElementById('news-important').checked,
        imageUrl: customUrl || selectedImg,
        category: document.getElementById('news-category') ? document.getElementById('news-category').value : 'news'
    };
    try {
        const isEdit = !!currentEditNewsId;
        const res = await fetch(isEdit ? API_URL + '/news/' + currentEditNewsId : API_URL + '/news', {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        showToast(data.message || (isEdit ? 'Đã cập nhật tin!' : 'Đã thêm tin!'));
        if (res.ok) {
            closeNewsModal();
            fetchNewsAdmin();
        }
    } catch (e) {
        showToast('Không lưu được tin tức. Chạy npm start rồi mở http://localhost:5000/bemy');
    }
}

async function executeDeleteNews(id) {
    if (!confirm('Xóa tin này khỏi trang khách?')) return;
    try {
        const res = await fetch(API_URL + '/news/' + id, { method: 'DELETE' });
        const data = await res.json();
        showToast(data.message || 'Đã xóa tin!');
        fetchNewsAdmin();
    } catch (e) {
        showToast('Lỗi khi xóa tin!');
    }
}

function injectNewsAdminUI() {
    const sidebarUl = document.querySelector('.sidebar-nav ul') || document.querySelector('.sidebar-nav');
    if (sidebarUl && !document.getElementById('admin-menu-news')) {
        sidebarUl.insertAdjacentHTML('beforeend', `
            <li id="admin-menu-news">
                <a href="#" onclick="event.preventDefault(); switchAdminPage('news')">
                    <i class="fas fa-newspaper"></i> Tin tức
                </a>
            </li>`);
    }

    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper && !document.getElementById('admin-news-page')) {
        contentWrapper.insertAdjacentHTML('beforeend', `
            <div id="admin-news-page" class="page-section" style="display: none;">
                <div class="section-header coupon-page-header">
                    <div>
                        <h2 class="gradient-text"><i class="fas fa-newspaper"></i> TIN TỨC & BLOG</h2>
                        <p class="desc-text">Quản lý bài viết trang khách: lọc Tin tức / Blog, ảnh bìa, nội dung đọc.</p>
                    </div>
                    <button type="button" class="btn-auth" style="width:auto; padding:12px 25px;" onclick="openNewsModal()">
                        <i class="fas fa-plus"></i> Thêm tin tức
                    </button>
                </div>
                <div class="coupon-panel hover-glow">
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Ảnh</th>
                                    <th>Tiêu đề</th>
                                    <th>Ngày</th>
                                    <th>Nội dung</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody id="admin-news-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>`);
    }

    if (!document.getElementById('admin-news-modal')) {
        const presets = NEWS_STYLE_PRESETS.map((p, i) =>
            `<button type="button" class="coupon-preset" onclick="setNewsStylePreset(${i})"><i class="${p.icon}" style="color:${p.color}"></i> ${p.label}</button>`
        ).join('');
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal-overlay" id="admin-news-modal" style="display:none;">
                <div class="modal-card glass-panel" style="width:520px; max-width:95vw; padding:28px; max-height:90vh; overflow-y:auto;">
                    <button type="button" class="close-modal" onclick="closeNewsModal()">×</button>
                    <h2 class="gradient-text" id="news-modal-title" style="text-align:center; margin-bottom:16px;"><i class="fas fa-newspaper"></i> TIN TỨC</h2>
                    <div class="input-group"><i class="fas fa-heading"></i><input type="text" id="news-title" placeholder="Tiêu đề bài viết"></div>
                    <div class="input-group">
                        <i class="fas fa-folder"></i>
                        <select id="news-category" class="custom-select">
                            <option value="news">Tin tức</option>
                            <option value="blog">Blog</option>
                        </select>
                    </div>
                    <div style="margin-bottom:18px;">
                        <textarea id="news-desc" rows="2" placeholder="Mô tả ngắn trên card (1-2 dòng)" style="width:100%; padding:12px; background:#0d0d14; color:#fff; border:1px solid rgba(139,92,246,0.3); border-radius:12px; font-family:inherit; font-size:0.95rem;"></textarea>
                    </div>
                    <div style="margin-bottom:18px;">
                        <textarea id="news-content" rows="5" placeholder="Nội dung đầy đủ khi khách bấm Đọc tin" style="width:100%; padding:12px; background:#0d0d14; color:#fff; border:1px solid rgba(139,92,246,0.3); border-radius:12px; font-family:inherit; font-size:0.95rem;"></textarea>
                    </div>
                    <div class="input-group"><i class="fas fa-external-link-alt"></i><input type="text" id="news-link" placeholder="Link đọc thêm (không bắt buộc)"></div>
                    <div class="input-group"><i class="fas fa-calendar"></i><input type="text" id="news-date" placeholder="Ngày hiện trên card (VD: 13/04/2024)"></div>
                    <p class="desc-text" style="margin-top:-8px;">Kiểu icon / màu viền card</p>
                    <div class="coupon-presets" style="margin-bottom:14px;">${presets}</div>
                    <div class="input-group"><i class="fas fa-icons"></i><input type="text" id="news-icon" placeholder="Icon class (VD: fas fa-rocket)"></div>
                    <div class="input-group"><i class="fas fa-palette"></i><input type="text" id="news-color" placeholder="Màu icon (VD: #10b981)"></div>
                    <div class="input-group"><i class="fas fa-paint-brush"></i><input type="text" id="news-accent" placeholder="Màu viền trái card"></div>
                    <div class="input-group"><i class="fas fa-sort-numeric-down"></i><input type="number" id="news-order" placeholder="Thứ tự (1, 2, 3...)"></div>
                    <label style="color:#ccc; font-size:0.85rem; display:block; margin-bottom:8px;">Ảnh bìa (thư mục Img)</label>
                    <select id="news-img" class="admin-input" style="width:100%; margin-bottom:10px; padding:10px; background:#1a1a2e; color:#fff; border:1px solid #7c3aed; border-radius:8px;"></select>
                    <div class="input-group"><i class="fas fa-link"></i><input type="text" id="news-img-url" placeholder="Hoặc dán link ảnh (Imgur/URL). Ưu tiên hơn ảnh chọn."></div>
                    <div style="margin-bottom:18px; display:flex; align-items:center; gap:10px; background:rgba(251,146,60,0.08); padding:12px 15px; border-radius:10px; border:1px solid rgba(251,146,60,0.25);">
                        <input type="checkbox" id="news-important" style="width:18px; height:18px; accent-color:#fb923c;">
                        <label for="news-important" style="color:#fb923c; font-weight:700; cursor:pointer;">Hiện badge QUAN TRỌNG</label>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="btn-admin-action" style="flex:1; padding:12px;" onclick="closeNewsModal()">Hủy</button>
                        <button type="button" class="btn-auth" style="flex:1;" onclick="executeSaveNews()">Lưu tin</button>
                    </div>
                </div>
            </div>`);
    }
}

async function toggleUserVip(username, isVip) {
    try {
        const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(username)}/vip`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isVip: !!isVip })
        });
        const data = await res.json();
        showToast(data.message || 'Đã cập nhật VIP!');
        fetchUsers();
    } catch (e) {
        showToast('Lỗi khi cấp VIP!');
    }
}

window.toggleUserVip = toggleUserVip;
window.openResellerModal = openResellerModal;
window.closeResellerModal = closeResellerModal;
window.executeSaveReseller = executeSaveReseller;
window.openAddCouponModal = openAddCouponModal;
window.closeAddCouponModal = closeAddCouponModal;
window.executeAddCoupon = executeAddCoupon;
window.executeDeleteCoupon = executeDeleteCoupon;
window.fetchCouponsAdmin = fetchCouponsAdmin;
window.copyCouponCode = copyCouponCode;
window.generateCouponCode = generateCouponCode;
window.setCouponPercent = setCouponPercent;
window.toggleCouponStatus = toggleCouponStatus;
window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
window.executeSaveNews = executeSaveNews;
window.executeDeleteNews = executeDeleteNews;
window.fetchNewsAdmin = fetchNewsAdmin;
window.setNewsStylePreset = setNewsStylePreset;

function originalLoadAdminData() {
    fetchDashboardStats();
    fetchProducts();
    fetchOrders();
    fetchInventory();
    loadKeyProductDropdown();
    fetchUsers();
    fetchTopups();
    fetchDownloadsAdmin();
    fetchCouponsAdmin();
    fetchNewsAdmin();
}
window.loadAdminData = originalLoadAdminData;

document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    injectFullProductModal();
    injectKeyDurationUI();
    injectDownloadsAdminUI();
    injectCouponAndResellerUI();
    injectNewsAdminUI();
    setTimeout(injectFullProductModal, 200);
    setTimeout(injectDownloadsAdminUI, 400);
    setTimeout(injectCouponAndResellerUI, 450);
    setTimeout(injectNewsAdminUI, 500);
    const saved = sessionStorage.getItem('ADMIN_PASSWORD');
    if (saved) {
        const pwdInput = document.querySelector('input[type="password"]');
        if (pwdInput) pwdInput.value = saved;
        setTimeout(() => {
            if (typeof verifyAdminPassword === 'function') verifyAdminPassword();
        }, 200);
    }
});

// Universal click delegator to ensure Add & Edit product buttons work in all browser scenarios
document.addEventListener('click', function (e) {
    const editBtn = e.target.closest('button[onclick*="openEditFullProductModal"]');
    if (editBtn) {
        const match = editBtn.getAttribute('onclick').match(/openEditFullProductModal\(['"]([^'"]+)['"]\)/);
        if (match && match[1]) {
            e.preventDefault();
            e.stopPropagation();
            window.openEditFullProductModal(match[1]);
        }
    }
    const addBtn = e.target.closest('.btn-create-tool, button[onclick*="openAddProductModal"]');
    if (addBtn && addBtn.innerText.includes('Sản Phẩm')) {
        e.preventDefault();
        e.stopPropagation();
        window.openAddProductModal();
    }
});
