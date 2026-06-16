// ==========================================
// 🌟 LOGIC ĐIỀU HƯỚNG TABS ADMIN PANEL (SPA)
// ==========================================
function switchAdminPage(pageId) {
    // 1. Ẩn tất cả các khối tab admin
    document.querySelectorAll('.page-section').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });

    // 2. Tắt active tất cả nút trên Menu Admin
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });

    // 3. Hiển thị tab được chọn
    const targetPage = document.getElementById(`admin-${pageId}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
        setTimeout(() => targetPage.classList.add('active'), 10);
    }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

    // 4. Bật sáng nút menu tương ứng
    const targetMenu = document.getElementById(`admin-menu-${pageId}`);
    if (targetMenu) {
        targetMenu.classList.add('active');
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 BIẾN QUẢN LÝ MODAL CỘNG/TRỪ TIỀN GIẢ LẬP
// ==========================================
let currentTargetUser = "";

function openBalanceModal(username) {
    currentTargetUser = username;
    document.getElementById('modal-target-username').innerText = username;

    const modal = document.getElementById('admin-balance-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

function closeBalanceModal() {
    const modal = document.getElementById('admin-balance-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
    document.getElementById('balance-action-amount').value = "";
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// Thực thi thay đổi ví thành viên trực tiếp trên giao diện
async function executeBalanceChange() {
    const type = document.getElementById('balance-action-type').value;
    const amountInput = document.getElementById('balance-action-amount').value;
    const amount = amountInput ? parseInt(amountInput) : 0;

    if (amount <= 0) {
        showToast("Vui lòng nhập số tiền hợp lệ lớn hơn 0đ!");
        return;
    }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
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
            // Cập nhật lại số tiền hiển thị trên giao diện
            const balanceElement = document.getElementById(`user-balance-${currentTargetUser}`);
            if (balanceElement) {
                balanceElement.innerText = data.newBalance.toLocaleString() + "đ";
            }
            closeBalanceModal();
        } else {
            showToast(data.message);
        }
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// Lấy danh sách thành viên từ DB
async function fetchUsers() {
    try {
        const response = await fetch(API_URL + '/admin/users', { cache: 'no-store' });
        const users = await response.json();
        
        const tbody = document.getElementById('admin-users-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const statusBadge = user.locked ? '<span class="badge status-pending" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2);">Đã Khóa</span>' : '<span class="badge status-success">Hoạt động</span>';
            const actionBtn = user.locked 
                ? `<button class="btn-admin-action btn-unlock-user" onclick="executeUnlockUser('${user.username}')" style="background: rgba(16,185,129,0.1); color: #10b981; margin-left: 8px;"><i class="fas fa-user-check"></i> Mở Khóa</button>`
                : `<button class="btn-admin-action btn-lock-user" onclick="executeLockUser('${user.username}')" style="background: rgba(239,68,68,0.1); color: #ef4444; margin-left: 8px;"><i class="fas fa-user-slash"></i> Khóa</button>`;
            
            const row = `
                <tr>
                    <td><span class="order-id">${user.username}</span></td>
                    <td>${user.email}</td>
                    <td class="text-primary font-weight-bold" id="user-balance-${user.username}">${user.balance.toLocaleString()}đ</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-admin-action btn-add-money" onclick="openBalanceModal('${user.username}')"><i class="fas fa-plus-circle"></i> Cộng/Trừ Tiền</button>
                        ${actionBtn}
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        // Cập nhật thẻ hiển thị tổng thành viên (nếu có)
        const totalUsersEl = document.getElementById('admin-total-users');
        if (totalUsersEl) totalUsersEl.innerText = users.length;
    } catch (error) {
        showToast("Lỗi tải danh sách thành viên!");
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// Hàm hiện thông báo Toast phụ trợ
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<i class="fas fa-shield-alt"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4000);
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 TÍNH NĂNG QUẢN LÝ SẢN PHẨM (LIÊN KẾT DATABASE)
// ==========================================
const API_URL = "http://localhost:5000/api";
let currentEditProductId = null;

// Lấy danh sách sản phẩm từ DB và hiển thị ra bảng
async function fetchProducts() {
    try {
        const response = await fetch(API_URL + '/products', { cache: 'no-store' });
        const products = await response.json();

        const tbody = document.getElementById('admin-products-tbody');
        if (!tbody) return;

        tbody.innerHTML = ''; // Xóa dữ liệu cũ

        products.forEach(prod => {
            const categoryBadge = prod.category === 'cheat' ? 'Bot & Cheat' : (prod.category === 'acc' ? 'Tài khoản' : 'Công cụ');
            const hotBadge = prod.isHot ? '<span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4);">🔥 HOT</span>' : '<span class="badge status-success">Thường</span>';

            const row = `
                <tr>
                    <td><img src="logo.png" style="width:30px; height:30px; object-fit:contain;"></td>
                    <td><strong>${prod.name}</strong></td>
                    <td><span class="badge badge-new">${categoryBadge}</span></td>
                    <td class="text-primary font-weight-bold" id="price-val-${prod._id}">${prod.price ? prod.price.toLocaleString() : 0}đ</td>
                    <td>${hotBadge}</td>
                    <td style="display:flex; gap:8px; justify-content:center;">
                        <button class="btn-admin-action btn-add-money" onclick="openEditPriceModal('${prod._id}', '${prod.name}', ${prod.price})"><i class="fas fa-edit"></i> Sửa</button>
                        <button class="btn-admin-action" onclick="executeDeleteProduct('${prod._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        if (products.length === 0) {
             tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ffeb3b; padding: 20px;">Kho hàng đang trống. Hãy thêm sản phẩm!</td></tr>';
        }
    } catch (error) {
        showToast("Lỗi tải danh sách sản phẩm từ Database!");
        alert("Chi tiết lỗi: " + error.message);
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 TẢI DỮ LIỆU ĐƠN HÀNG THỰC TẾ
// ==========================================
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
            
            let keyDisplay = `<div class="key-box"><span>${order.key}</span></div>`;
            if (order.status === 'Đang chờ xử lý' || !order.key) {
                keyDisplay = `<span class="badge status-pending">Đang chờ xuất key...</span>`;
            }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

            const row = `
                <tr>
                    <td><span class="order-id">${order.orderId}</span></td>
                    <td><strong>${order.username}</strong></td>
                    <td>${order.productName}</td>
                    <td class="text-primary">${order.price.toLocaleString()}đ</td>
                    <td class="text-muted">${dateStr}</td>
                    <td>${keyDisplay}</td>
                    <td>
                        <button class="btn-admin-action" onclick="executeDeleteOrder('${order._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 5px 10px; font-size: 0.8rem;"><i class="fas fa-trash"></i> Xóa</button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        if (orders.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ffeb3b; padding: 20px;">Chưa có đơn hàng nào được mua.</td></tr>';
        }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

    } catch (error) {
        showToast("Lỗi khi lấy danh sách đơn hàng!");
        console.error(error);
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 XÓA ĐƠN HÀNG
// ==========================================
async function executeDeleteOrder(orderId) {
    if (!confirm("Bạn có chắc chắn muốn xóa đơn hàng này? Khách hàng sẽ bị mất lịch sử mua hàng.")) return;
    try {
        const res = await fetch(API_URL + '/admin/orders/' + orderId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast("Xóa đơn hàng thành công!");
            fetchOrders();
            fetchInventory();
        } else {
            showToast(data.message || "Xóa thất bại!");
        }
    } catch (err) {
        showToast("Lỗi khi xóa đơn hàng!");
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 TẢI DỮ LIỆU KHO KEY (ĐÃ BÁN VÀ CHƯA BÁN)
// ==========================================
async function fetchInventory() {
    try {
        const response = await fetch(API_URL + '/admin/inventory', { cache: 'no-store' });
        const inventory = await response.json();
        
        const tbody = document.getElementById('admin-inventory-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        inventory.forEach(item => {
            // Hiển thị trạng thái
            let statusBadge = item.type === 'sold' 
                ? '<span class="badge status-success"><i class="fas fa-check-circle"></i> Đã bán</span>' 
                : '<span class="badge status-pending" style="color:#9ca3af; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);">Chưa bán</span>';
            
            // Xử lý ngày tháng
            let dateStr = '-';
            if (item.date) {
                const dateObj = new Date(item.date);
                dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
            }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

            const deleteAction = `<button class="btn-admin-action" onclick="executeDeleteKey('${item._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); padding: 5px 10px; font-size: 0.8rem;"><i class="fas fa-trash"></i> Xóa Key</button>`;

            const row = `
                <tr>
                    <td><div class="key-box" style="margin: 0; padding: 4px 8px; font-size: 0.8rem; display: inline-block;"><span>${item.key}</span></div></td>
                    <td><strong>${item.productName}</strong></td>
                    <td class="text-primary">${item.price.toLocaleString()}đ</td>
                    <td>${statusBadge}</td>
                    <td>${item.buyer ? `<strong>${item.buyer}</strong>` : '-'}</td>
                    <td class="text-muted">${dateStr}</td>
                    <td>${deleteAction}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        if (inventory.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #ffeb3b; padding: 20px;">Kho Key hiện đang trống hoàn toàn.</td></tr>';
        }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

    } catch (error) {
        showToast("Lỗi khi lấy danh sách Kho Key!");
        console.error(error);
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 XÓA KEY TỒN KHO
// ==========================================
async function executeDeleteKey(keyId) {
    if (!confirm("Bạn có chắc chắn muốn xóa Key này khỏi kho?")) return;
    try {
        const res = await fetch(API_URL + '/admin/keys/' + keyId, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast("Xóa Key thành công!");
            fetchInventory();
        } else {
            showToast(data.message || "Xóa thất bại!");
        }
    } catch (err) {
        showToast("Lỗi khi xóa Key!");
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// Chạy hàm lấy sản phẩm ngay khi load trang Admin
// Existing product table loading
// Also initialize the key import dropdown
// (Handled in the new DOMContentLoaded listener added above)

// ---- THÊM SẢN PHẨM (NÂNG CẤP) ----
function openAddProductModal() {
    const modal = document.getElementById('admin-add-product-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}
function closeAddProductModal() {
    const modal = document.getElementById('admin-add-product-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}
async function executeAddProduct() {
    const name = document.getElementById('new-prod-name').value;
    const category = document.getElementById('new-prod-category').value;
    const price = document.getElementById('new-prod-price').value;
    const description = document.getElementById('new-prod-desc').value;
    const isHot = document.getElementById('new-prod-ishot').checked;

    if (!name || !price) return showToast("Vui lòng nhập đủ tên và giá!");

    try {
        const res = await fetch(API_URL + '/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                category,
                price: parseInt(price),
                description: description || 'Sản phẩm uy tín, an toàn 100% từ hệ thống TheGhost.',
                isHot: isHot
            })
        });
        const data = await res.json();
        showToast(data.message);

        // Reset form
        document.getElementById('new-prod-name').value = '';
        document.getElementById('new-prod-price').value = '';
        document.getElementById('new-prod-desc').value = '';
        document.getElementById('new-prod-ishot').checked = false;

        closeAddProductModal();
        fetchProducts(); // Tải lại bảng ngay lập tức
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ---- XÓA SẢN PHẨM (MỚI) ----
async function executeDeleteProduct(id) {
    if (confirm("⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA SẢN PHẨM NÀY KHÔNG?\nHành động này không thể hoàn tác!")) {
        try {
            const res = await fetch(API_URL + `/products/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            showToast(data.message);
            fetchProducts(); // Cập nhật lại bảng ngay lập tức
        } catch (err) {
            showToast("Lỗi khi xóa sản phẩm!");
        }
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ---- SỬA GIÁ SẢN PHẨM ----
function openEditPriceModal(id, name, currentPrice) {
    currentEditProductId = id;
    document.getElementById('edit-prod-name').innerText = name;
    document.getElementById('edit-prod-price').value = currentPrice;

    const modal = document.getElementById('admin-edit-price-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}
function closeEditPriceModal() {
    const modal = document.getElementById('admin-edit-price-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}
async function executeEditPrice() {
    const newPrice = document.getElementById('edit-prod-price').value;
    if (!newPrice) return showToast("Vui lòng nhập giá mới!");

    try {
        const res = await fetch(API_URL + `/products/${currentEditProductId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ price: parseInt(newPrice) })
        });
        const data = await res.json();
        showToast(data.message);
        closeEditPriceModal();
        fetchProducts(); // Tải lại bảng để cập nhật số tiền mới
    } catch (err) {
        showToast("Lỗi kết nối Server!");
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

function openImportKeyModal() {
    const modal = document.getElementById('import-key-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}
function closeImportKeyModal() {
    const modal = document.getElementById("import-key-modal");
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

/**
 * Load products into the "key-product-id" dropdown for bulk key import.
 */
async function loadKeyProductDropdown() {
    try {
        const response = await fetch(API_URL + '/products', { cache: 'no-store' });
        const products = await response.json();
        const select = document.getElementById('key-product-id');
        // Clear existing options except the placeholder
        select.innerHTML = `<option value="">Chọn sản phẩm</option>`;
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

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

/**
 * Save bulk keys for the selected product.
 */
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
    try {
        const res = await fetch(API_URL + `/products/${productId}/keys`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keys })
        });
        const data = await res.json();
        showToast(data.message || 'Lưu key thành công!');
        // Reset inputs
        document.getElementById('bulk-key-input').value = '';
        document.getElementById('key-product-id').value = '';
        closeImportKeyModal();
    } catch (err) {
        console.error(err);
        showToast('Lưu key thất bại!');
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// 🌟 TẢI DỮ LIỆU THỐNG KÊ (DASHBOARD)
// ==========================================
async function fetchDashboardStats() {
    try {
        const response = await fetch(API_URL + '/admin/stats', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            
            // Cập nhật DOM
            document.getElementById('admin-total-revenue').innerText = (data.totalRevenue || 0).toLocaleString() + 'đ';
            document.getElementById('admin-total-users').innerText = (data.totalUsers || 0).toLocaleString();
            document.getElementById('admin-total-orders').innerText = (data.totalOrders || 0).toLocaleString();
        }
    } catch (err) {
        console.error('Lỗi khi tải thống kê:', err);
    }
}

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

// ==========================================
// TỰ ĐỘNG TẢI DỮ LIỆU KHI VÀO TRANG ADMIN (ĐÃ BỎ HMAC)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
    fetchProducts();
    fetchOrders();
    fetchInventory();
    loadKeyProductDropdown();
    fetchUsers();
    fetchTopups();
});

// ==========================================
// 🌟 TẢI DỮ LIỆU LỊCH SỬ NẠP (SEPAY & THỦ CÔNG)
// ==========================================
async function fetchTopups() {
    try {
        const response = await fetch(API_URL + '/admin/topups', { cache: 'no-store' });
        const topups = await response.json();
        
        const tbody = document.getElementById('admin-topups-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        topups.forEach(item => {
            // Xử lý ngày tháng
            let dateStr = '-';
            if (item.date) {
                const dateObj = new Date(item.date);
                dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;
            }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

            // Tạo mã giao dịch ảo nếu không có
            const txId = item._id.substring(item._id.length - 8).toUpperCase();

            const row = `
                <tr>
                    <td><span class="order-id">SP-${txId}</span></td>
                    <td><strong>${item.username}</strong></td>
                    <td class="text-primary font-weight-bold">+${item.amount.toLocaleString()}đ</td>
                    <td><span class="text-warning">${item.desc || 'Nạp tiền vào tài khoản'}</span></td>
                    <td class="text-muted">${dateStr}</td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        if (topups.length === 0) {
             tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ffeb3b; padding: 20px;">Chưa có dữ liệu nạp tiền nào.</td></tr>';
        }

// ---- KHÓA / MỞ KHÓA TÀI KHOẢN ----
async function executeLockUser(username) {
    if (!confirm(`Bạn có chắc muốn khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/lock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

async function executeUnlockUser(username) {
    if (!confirm(`Bạn có chắc muốn mở khóa tài khoản ${username} không?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}/unlock`, {
            method: 'PUT',
        });
        const data = await response.json();
        showToast(data.message);
        fetchUsers();
    } catch (err) {
        showToast("Lỗi kết nối tới Server!");
    }
}

    } catch (error) {
        showToast("Lỗi khi lấy danh sách nạp tiền!");
        console.error(error);
    }
}
