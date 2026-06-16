// ==========================================
// 🌟 TẤT CẢ LOGIC CHO TRANG KHÁCH HÀNG (CLIENT)
// ==========================================
const API_URL = "http://localhost:5000/api";
let CURRENT_USER_ID = "guest"; // Mặc định chưa đăng nhập

document.addEventListener('DOMContentLoaded', () => {
    // 1. Menu Sidebar Active
    const sidebarLinks = document.querySelectorAll('.sidebar-nav li');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // 2. Kích hoạt lệnh tải sản phẩm ngay khi web vừa mở lên
    loadClientProducts();

    // 3. Hiển thị thông báo chào mừng
    showWelcomeModal();
});

function showWelcomeModal() {
    const modalHtml = `
        <div id="welcome-modal" class="modal-overlay" style="display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div class="modal-card glass-panel" style="max-width: 500px; text-align: center; padding: 30px;">
                <img src="logo.png" alt="Logo" style="width: 80px; margin-bottom: 20px;">
                <h2 class="gradient-text"><i class="fas fa-bell"></i> THÔNG BÁO TỪ THEGHOST</h2>
                <p style="margin: 20px 0; color: #d1d5db; line-height: 1.6; font-size: 1.05rem;">
                    Chào mừng bạn đến với <strong>TheGhost Coder</strong>!<br><br>
                    Hệ thống cung cấp Tool, Bot, và Tài khoản Game tự động uy tín nhất.<br>
                    Chúc bạn có một trải nghiệm mua sắm tuyệt vời!
                </p>
                <button class="btn-auth" onclick="closeWelcomeModal()" style="margin-top: 15px; font-weight: bold;"><i class="fas fa-check-circle"></i> TÔI ĐÃ HIỂU</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setTimeout(() => {
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.classList.add('show');
    }, 10);
}

function closeWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 400);
    }
}


// ==========================================
// 🌟 1. TÍNH NĂNG ĐA NGÔN NGỮ (MULTI-LANGUAGE TOÀN DIỆN)
// ==========================================
const translations = {
    'vi': {
        'menu_home': '<i class="fas fa-home"></i> Trang chủ', 'menu_topup': '<i class="fas fa-dollar-sign"></i> Nạp tiền', 'menu_products': '<i class="fas fa-shopping-cart"></i> Sản phẩm', 'menu_orders': '<i class="fas fa-box"></i> Đơn hàng', 'menu_history': '<i class="fas fa-clock"></i> Lịch sử GD',
        'search_placeholder': 'Tìm kiếm sản phẩm, dịch vụ... (Enter)',
        'stat_balance': 'Số dư', 'stat_orders': 'Đơn hàng', 'stat_member': 'Thành viên',
        'prod_title': '<i class="fas fa-store"></i> DANH MỤC SẢN PHẨM',
        'tab_cheat': 'Bot & Cheat', 'tab_acc': 'Tài khoản Game', 'tab_tool': 'Công cụ Check',
        'btn_buy': '<i class="fas fa-shopping-cart"></i> Mua', 'prod_desc': 'Sản phẩm uy tín, an toàn 100% từ hệ thống TheGhost.',
        'order_title': '<i class="fas fa-box-open"></i> QUẢN LÝ ĐƠN HÀNG', 'history_title': '<i class="fas fa-history"></i> LỊCH SỬ GIAO DỊCH',
        'chat_btn': '<i class="fas fa-wand-magic-sparkles"></i> Chat Hỗ Trợ AI'
    },
    'en': {
        'menu_home': '<i class="fas fa-home"></i> Home', 'menu_topup': '<i class="fas fa-dollar-sign"></i> Top Up', 'menu_products': '<i class="fas fa-shopping-cart"></i> Products', 'menu_orders': '<i class="fas fa-box"></i> Orders', 'menu_history': '<i class="fas fa-clock"></i> History',
        'search_placeholder': 'Search products, services... (Enter)',
        'stat_balance': 'Balance', 'stat_orders': 'Orders', 'stat_member': 'Member',
        'prod_title': '<i class="fas fa-store"></i> PRODUCTS CATALOG',
        'tab_cheat': 'Bot & Cheat', 'tab_acc': 'Game Accounts', 'tab_tool': 'Check Tools',
        'btn_buy': '<i class="fas fa-shopping-cart"></i> Buy', 'prod_desc': 'Trusted product, 100% safe from TheGhost system.',
        'order_title': '<i class="fas fa-box-open"></i> ORDER MANAGEMENT', 'history_title': '<i class="fas fa-history"></i> TRANSACTION HISTORY',
        'chat_btn': '<i class="fas fa-wand-magic-sparkles"></i> AI Support Chat'
    },
    'zh': {
        'menu_home': '<i class="fas fa-home"></i> 首页', 'menu_topup': '<i class="fas fa-dollar-sign"></i> 充值', 'menu_products': '<i class="fas fa-shopping-cart"></i> 产品', 'menu_orders': '<i class="fas fa-box"></i> 订单', 'menu_history': '<i class="fas fa-clock"></i> 历史',
        'search_placeholder': '搜索产品，服务... (Enter)',
        'stat_balance': '余额', 'stat_orders': '订单数', 'stat_member': '会员',
        'prod_title': '<i class="fas fa-store"></i> 产品目录',
        'tab_cheat': '外挂 & 辅助', 'tab_acc': '游戏账号', 'tab_tool': '检测工具',
        'btn_buy': '<i class="fas fa-shopping-cart"></i> 购买', 'prod_desc': '信誉产品，TheGhost系统100%安全。',
        'order_title': '<i class="fas fa-box-open"></i> 订单管理', 'history_title': '<i class="fas fa-history"></i> 交易历史',
        'chat_btn': '<i class="fas fa-wand-magic-sparkles"></i> AI 聊天支持'
    },
    'th': {
        'menu_home': '<i class="fas fa-home"></i> หน้าแรก', 'menu_topup': '<i class="fas fa-dollar-sign"></i> เติมเงิน', 'menu_products': '<i class="fas fa-shopping-cart"></i> สินค้า', 'menu_orders': '<i class="fas fa-box"></i> คำสั่งซื้อ', 'menu_history': '<i class="fas fa-clock"></i> ประวัติ',
        'search_placeholder': 'ค้นหาสินค้า บริการ... (Enter)',
        'stat_balance': 'ยอดคงเหลือ', 'stat_orders': 'คำสั่งซื้อ', 'stat_member': 'สมาชิก',
        'prod_title': '<i class="fas fa-store"></i> หมวดหมู่สินค้า',
        'tab_cheat': 'บอท & โปร', 'tab_acc': 'บัญชีเกม', 'tab_tool': 'เครื่องมือตรวจสอบ',
        'btn_buy': '<i class="fas fa-shopping-cart"></i> ซื้อ', 'prod_desc': 'สินค้าที่เชื่อถือได้ ปลอดภัย 100% จากระบบ TheGhost',
        'order_title': '<i class="fas fa-box-open"></i> จัดการคำสั่งซื้อ', 'history_title': '<i class="fas fa-history"></i> ประวัติการทำรายการ',
        'chat_btn': '<i class="fas fa-wand-magic-sparkles"></i> แชทสนับสนุน AI'
    },
    'ko': {
        'menu_home': '<i class="fas fa-home"></i> 홈', 'menu_topup': '<i class="fas fa-dollar-sign"></i> 충전', 'menu_products': '<i class="fas fa-shopping-cart"></i> 제품', 'menu_orders': '<i class="fas fa-box"></i> 주문', 'menu_history': '<i class="fas fa-clock"></i> 내역',
        'search_placeholder': '제품, 서비스 검색... (Enter)',
        'stat_balance': '잔액', 'stat_orders': '주문', 'stat_member': '회원',
        'prod_title': '<i class="fas fa-store"></i> 제품 카탈로그',
        'tab_cheat': '봇 & 치트', 'tab_acc': '게임 계정', 'tab_tool': '확인 도구',
        'btn_buy': '<i class="fas fa-shopping-cart"></i> 구매', 'prod_desc': 'TheGhost 시스템의 100% 안전한 신뢰할 수 있는 제품.',
        'order_title': '<i class="fas fa-box-open"></i> 주문 관리', 'history_title': '<i class="fas fa-history"></i> 거래 내역',
        'chat_btn': '<i class="fas fa-wand-magic-sparkles"></i> AI 채팅 지원'
    },
    'ja': {
        'menu_home': '<i class="fas fa-home"></i> ホーム', 'menu_topup': '<i class="fas fa-dollar-sign"></i> チャージ', 'menu_products': '<i class="fas fa-shopping-cart"></i> 製品', 'menu_orders': '<i class="fas fa-box"></i> 注文', 'menu_history': '<i class="fas fa-clock"></i> 履歴',
        'search_placeholder': '製品、サービスを検索... (Enter)',
        'stat_balance': '残高', 'stat_orders': '注文', 'stat_member': 'メンバー',
        'prod_title': '<i class="fas fa-store"></i> 製品カタログ',
        'tab_cheat': 'ボット＆チート', 'tab_acc': 'ゲームアカウント', 'tab_tool': '確認ツール',
        'btn_buy': '<i class="fas fa-shopping-cart"></i> 購入', 'prod_desc': 'TheGhostシステムの100％安全な信頼できる製品。',
        'order_title': '<i class="fas fa-box-open"></i> 注文管理', 'history_title': '<i class="fas fa-history"></i> 取引履歴',
        'chat_btn': '<i class="fas fa-wand-magic-sparkles"></i> AI チャットサポート'
    }
};

const langNames = {
    'vi': 'Tiếng Việt', 'en': 'English', 'zh': '中文 (Tiếng Trung)',
    'th': 'ภาษาไทย (Tiếng Thái)', 'ko': '한국어 (Tiếng Hàn)', 'ja': '日本語 (Tiếng Nhật)'
};

let currentSystemLang = 'vi'; // Biến lưu ngôn ngữ hiện tại

function toggleLangDropdown() {
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function changeLanguage(lang, event) {
    if (event) event.stopPropagation();
    currentSystemLang = lang;

    const currentLangLabel = document.getElementById('current-lang');
    if (currentLangLabel) currentLangLabel.innerText = lang.toUpperCase();

    // 🔥 SỨC MẠNH CỦA DATA-I18N: Quét toàn bộ web và dịch tự động
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT') {
                element.placeholder = translations[lang][key];
            } else {
                element.innerHTML = translations[lang][key];
            }
        }
    });

    const langDropdown = document.getElementById('lang-dropdown');
    if (langDropdown) langDropdown.classList.remove('show');
    showToast(`Đã chuyển ngôn ngữ sang ${langNames[lang]}`);
}

// Bấm ra ngoài để đóng menu
document.addEventListener('click', function (event) {
    const switcher = document.querySelector('.lang-switcher');
    if (switcher && !switcher.contains(event.target)) {
        const langMenu = document.getElementById('lang-dropdown');
        if (langMenu) langMenu.classList.remove('show');
    }
});


// ==========================================
// 🌟 2. KÉO DỮ LIỆU SẢN PHẨM THẬT TỪ DATABASE
// ==========================================
async function loadClientProducts() {
    try {
        const res = await fetch(`${API_URL}/products`, { cache: 'no-store' });
        const products = await res.json();
        window.globalProducts = products;

        const gridCheat = document.getElementById('grid-cheat');
        const gridAcc = document.getElementById('grid-acc');
        const gridTool = document.getElementById('grid-tool');

        if (gridCheat) gridCheat.innerHTML = '';
        if (gridAcc) gridAcc.innerHTML = '';
        if (gridTool) gridTool.innerHTML = '';

        products.forEach(prod => {
            // Xử lý giữ nguyên dấu xuống dòng (Enter) bằng lệnh replace
            const customDesc = prod.description ? prod.description.replace(/\n/g, '<br>') : 'Sản phẩm uy tín, an toàn 100% từ hệ thống TheGhost.';

            const cardHtml = `
                <div class="prod-card hover-glow">
                    ${prod.isHot ? '<div class="prod-badge">HOT</div>' : ''}
                    <img src="logo.png" class="prod-img" alt="${prod.name}">
                    <h4>${prod.name}</h4>
                    
                    <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px; line-height: 1.5;">${customDesc}</p>
                    
                    <div class="prod-bottom">
                        <span class="prod-price">${prod.price.toLocaleString()}đ</span>
                        <button class="btn-buy" onclick="openAdvancedBuyModal('${prod._id}')" data-i18n="btn_buy">
                            ${translations[currentSystemLang]['btn_buy']}
                        </button>
                    </div>
                </div>
            `;

            if (prod.category === 'cheat' && gridCheat) {
                gridCheat.insertAdjacentHTML('beforeend', cardHtml);
            } else if (prod.category === 'acc' && gridAcc) {
                gridAcc.insertAdjacentHTML('beforeend', cardHtml);
            } else if (prod.category === 'tool' && gridTool) {
                gridTool.insertAdjacentHTML('beforeend', cardHtml);
            }
        });
    } catch (err) {
        console.log("Lỗi tải sản phẩm từ máy chủ: ", err);
    }
}

// ==========================================
// 🌟 3. TẢI DỮ LIỆU CÁ NHÂN (SỐ DƯ, ĐƠN HÀNG, LỊCH SỬ)
// ==========================================
async function loadUserData(username) {
    try {
        const res = await fetch(`${API_URL}/user-data/${username}`);
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('header-balance').innerText = data.balance.toLocaleString() + "đ";
        document.getElementById('stat-balance').innerText = data.balance.toLocaleString() + "đ";

        const statOrders = document.getElementById('stat-orders');
        if (statOrders) statOrders.innerText = data.orders.length;

        const ordersTbody = document.getElementById('orders-tbody');
        if (ordersTbody) {
            ordersTbody.innerHTML = '';
            data.orders.forEach(order => {
                const d = new Date(order.date);
                const timeStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                const rowId = 'order-' + order._id;
                const row = `<tr>
                    <td><span class="order-id">${order.orderId}</span></td>
                    <td><strong>${order.productName}</strong></td>
                    <td class="text-primary">${order.price.toLocaleString()}đ</td>
                    <td class="text-muted">${timeStr}</td>
                    <td><span class="badge status-success">${order.status}</span></td>
                    <td>
                        <button class="btn-auth" style="padding: 5px 10px; font-size: 0.85rem;" onclick="toggleOrderKey('${rowId}')">
                            Xem Key <i class="fas fa-chevron-down"></i>
                        </button>
                    </td>
                </tr>
                <tr id="${rowId}" style="display: none; background: rgba(255,255,255,0.02);">
                    <td colspan="6" style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-start;">
                            <span style="color: #9ca3af; font-size: 0.9rem;">Key kích hoạt sản phẩm của bạn:</span>
                            <div class="key-box" style="width: 100%; max-width: 400px; justify-content: space-between;" onclick="copyText('${order.key}')">
                                <span style="font-family: monospace; letter-spacing: 1px; color: #fff;">${order.key}</span>
                                <i class="fas fa-copy" style="color: var(--primary-color);"></i>
                            </div>
                        </div>
                    </td>
                </tr>`;
                ordersTbody.insertAdjacentHTML('beforeend', row);
            });
        }

        const historyTbody = document.getElementById('history-tbody');
        let totalDeposited = 0;
        if (historyTbody) {
            historyTbody.innerHTML = '';
            data.history.forEach(hist => {
                if (hist.amount > 0) {
                    totalDeposited += hist.amount;
                }
                const d = new Date(hist.date);
                const timeStr = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                const row = `<tr>
                    <td><span class="order-id">#GD-${Math.floor(Math.random() * 90000)}</span></td>
                    <td><span class="badge ${hist.type === 'Mua Hàng' ? 'status-buy' : 'status-success'}">${hist.type}</span></td>
                    <td class="${hist.amount < 0 ? 'text-danger' : 'text-primary'}">${hist.amount > 0 ? '+' : ''}${hist.amount.toLocaleString()}đ</td>
                    <td>${hist.desc}</td>
                    <td class="text-muted">${timeStr}</td>
                </tr>`;
                historyTbody.insertAdjacentHTML('beforeend', row);
            });
        }

        // Không cần gán display cho account-info-block nữa vì nó nằm ở #account-page
        const guestStats = document.getElementById('guest-stats-grid');
        if (guestStats) guestStats.style.display = 'none';

        const accUsername = document.getElementById('acc-info-username');
        if (accUsername) accUsername.innerText = username;

        const accBalance = document.getElementById('acc-info-balance');
        if (accBalance) accBalance.innerText = data.balance.toLocaleString() + "đ";

        const accTotalDeposit = document.getElementById('acc-info-total-deposit');
        if (accTotalDeposit) accTotalDeposit.innerText = totalDeposited.toLocaleString() + "đ";

        const accOrdersCount = document.getElementById('acc-info-orders-count');
        if (accOrdersCount) accOrdersCount.innerText = data.orders.length;

    } catch (err) {
        console.log("Lỗi tải dữ liệu user:", err);
    }
}

function toggleOrderKey(rowId) {
    const row = document.getElementById(rowId);
    if (row) {
        if (row.style.display === 'none') {
            row.style.display = 'table-row';
        } else {
            row.style.display = 'none';
        }
    }
}

// ==========================================
// 🌟 4. MUA HÀNG & CHUYỂN TRANG
// ==========================================
async function buyProduct(productName, price) {
    if (CURRENT_USER_ID === "guest" || !CURRENT_USER_ID) {
        showToast("Vui lòng đăng nhập để mua sản phẩm!");
        openModal('login');
        return;
    }

    try {
        const response = await fetch(API_URL + '/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: CURRENT_USER_ID, productName, price })
        });
        const data = await response.json();

        if (response.ok) {
            showToast(data.message);
            // Kéo data cá nhân về để đồng bộ giao diện ngay lập tức
            loadUserData(CURRENT_USER_ID);
        } else {
            showToast(data.message);
            if (data.message.includes('Số dư không đủ')) openTopupModal('bank');
        }
    } catch (err) {
        showToast("Lỗi hệ thống kết nối mua hàng!");
    }
}

function switchPage(pageId) {
    document.querySelectorAll('.page-section').forEach(page => {
        page.style.display = 'none';
        page.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-nav li').forEach(li => {
        li.classList.remove('active');
    });
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.style.display = 'block';
        setTimeout(() => targetPage.classList.add('active'), 10);
    }
    const targetMenu = document.getElementById(`menu-${pageId}`);
    if (targetMenu) {
        targetMenu.classList.add('active');
    }
}

function scrollToProducts() {
    switchPage('home');
    setTimeout(() => {
        const sec = document.getElementById('products-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function switchProdTab(tabId, btnElement) {
    document.querySelectorAll('.prod-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.prod-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    btnElement.classList.add('active');
    const target = document.getElementById('prod-' + tabId);
    if (target) {
        target.style.display = 'block';
        setTimeout(() => target.classList.add('active'), 10);
    }
}


// ==========================================
// 🌟 5. ĐĂNG NHẬP / ĐĂNG KÝ
// ==========================================
function openModal(type) {
    const overlay = document.getElementById('auth-modal');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
    toggleForm(type);
}
function closeModal() {
    const overlay = document.getElementById('auth-modal');
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
}
function toggleForm(type) {
    document.getElementById('login-form').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('register-form').style.display = type === 'register' ? 'block' : 'none';
}

function applyLoginState(username) {
    document.getElementById('guest-area').style.display = 'none';
    document.getElementById('logged-in-area').style.display = 'flex';
    document.getElementById('display-username').innerText = username;
    CURRENT_USER_ID = username;
    updateSePayQR();
    loadUserData(username);
}

async function handleAuth(event, type) {
    event.preventDefault();
    let payload = {};
    let endpoint = type === 'login' ? '/login' : '/register';

    if (type === 'login') {
        payload.email = document.getElementById('login-email').value;
        payload.password = document.getElementById('login-password').value;
    } else {
        payload.username = document.getElementById('reg-username').value;
        payload.email = document.getElementById('reg-email').value;
        payload.password = document.getElementById('reg-password').value;
    }

    try {
        const response = await fetch(API_URL + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (response.ok) {
            showToast(data.message);
            closeModal();
            applyLoginState(data.username || payload.username);
        } else {
            showToast("Thất bại: " + data.message);
        }
    } catch (error) {
        showToast("Lỗi liên kết Cơ sở dữ liệu!");
    }
}

function logout() {
    document.getElementById('guest-area').style.display = 'flex';
    document.getElementById('logged-in-area').style.display = 'none';
    document.getElementById('stat-balance').innerText = "0đ";
    document.getElementById('header-balance').innerText = "0đ";

    document.getElementById('stat-orders').innerText = "0";
    if (document.getElementById('orders-tbody')) document.getElementById('orders-tbody').innerHTML = '';
    if (document.getElementById('history-tbody')) document.getElementById('history-tbody').innerHTML = '';

    const guestStats = document.getElementById('guest-stats-grid');
    if (guestStats) guestStats.style.display = 'grid';

    CURRENT_USER_ID = "guest";
    showToast("Đã đăng xuất tài khoản!");
}

function toggleDropdown() {
    const menu = document.getElementById('user-dropdown');
    if (menu) menu.classList.toggle('show');
}


// ==========================================
// 🌟 6. MODAL NẠP TIỀN & MÃ QR SEPAY
// ==========================================
function openTopupModal(tabId = 'bank') {
    const overlay = document.getElementById('topup-modal');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
    switchTopupTab(tabId);
}
function closeTopupModal() {
    const overlay = document.getElementById('topup-modal');
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 300);
}
function switchTopupTab(tabType) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });

    const targetBtn = document.getElementById(`btn-tab-${tabType}`);
    if (targetBtn) targetBtn.classList.add('active');

    const targetTab = document.getElementById(`tab-${tabType}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        setTimeout(() => targetTab.classList.add('active'), 10);
    }
    if (tabType === 'bank') updateSePayQR();
}

function setAmount(val, btnElement) {
    document.getElementById('bank-amount-input').value = val;
    updateSePayQR();
    document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
}

function updateSePayQR() {
    const amountInput = document.getElementById('bank-amount-input').value;
    const amount = amountInput ? parseInt(amountInput) : 0;
    const syntax = `TGCODER ${CURRENT_USER_ID}`.toUpperCase();

    const subContentVal = document.getElementById('sub-content-val');
    if (subContentVal) subContentVal.innerText = syntax;

    const bankID = "MB";
    const accountNo = "6004012002";
    const accountName = "NGUYEN QUOC DUY";

    let qrImgUrl = `https://img.vietqr.io/image/${bankID}-${accountNo}-qr_only.png?accountName=${encodeURIComponent(accountName)}&addInfo=${encodeURIComponent(syntax)}`;
    if (amount > 0) qrImgUrl += `&amount=${amount}`;

    const qrImg = document.getElementById('sepay-qr-img');
    if (qrImg) qrImg.src = qrImgUrl;
}

async function handleCardTopup(event) {
    event.preventDefault();
    const type = document.getElementById('card-type').value;
    const amount = document.getElementById('card-amount').value;
    const serial = document.getElementById('card-serial').value;
    const code = document.getElementById('card-code').value;
    const submitBtn = document.getElementById('btn-submit-card');

    if (!type || !amount || !serial || !code) return showToast("Vui lòng điền đủ thông tin thẻ!");

    submitBtn.innerText = "ĐANG ĐẨY THẺ LÊN CỔNG...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/topup-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, amount, serial, code, userId: CURRENT_USER_ID })
        });
        const data = await response.json();

        if (response.ok) {
            showToast(`Thành công: ${data.message}`);
            closeTopupModal();
            document.getElementById('card-topup-form').reset();
        } else {
            showToast(`Lỗi cổng gạch: ${data.message}`);
        }
    } catch (error) {
        showToast("Không thể kết nối đến máy chủ cổng gạch!");
    } finally {
        submitBtn.innerText = "GỬI THẺ LÊN HỆ THỐNG GẠCH";
        submitBtn.disabled = false;
    }
}


// ==========================================
// 🌟 7. CHATBOT AI VÀ TOAST THÔNG BÁO
// ==========================================
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.classList.add('toast-msg');
    toast.innerHTML = `<i class="fas fa-bolt"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4000);
}

function copyText(text) {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép: ${text}`);
}

function copyContentCode() {
    const el = document.getElementById('sub-content-val');
    if (el) copyText(el.innerText);
}

function toggleChat() {
    const chatBox = document.getElementById('ai-chat-box');
    if (chatBox) chatBox.style.display = chatBox.style.display === 'none' || chatBox.style.display === '' ? 'flex' : 'none';
}

function handleChatEnter(event) {
    if (event.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const inputField = document.getElementById('chat-input');
    const msgText = inputField.value.trim();
    if (!msgText) return;

    const chatMessages = document.getElementById('chat-messages');

    chatMessages.insertAdjacentHTML('beforeend', `
        <div class="message user-msg"><div class="msg-bubble">${msgText}</div></div>
    `);
    inputField.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const typingId = "typing-" + Date.now();
    chatMessages.insertAdjacentHTML('beforeend', `
        <div class="message bot-msg" id="${typingId}">
            <div class="msg-bubble"><i class="fas fa-circle-notch fa-spin"></i> AI đang suy nghĩ...</div>
        </div>
    `);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const res = await fetch(API_URL + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msgText })
        });
        const data = await res.json();

        document.getElementById(typingId).remove();
        chatMessages.insertAdjacentHTML('beforeend', `
            <div class="message bot-msg"><div class="msg-bubble">${data.reply}</div></div>
        `);
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (err) {
        document.getElementById(typingId).remove();
        chatMessages.insertAdjacentHTML('beforeend', `
            <div class="message bot-msg"><div class="msg-bubble text-danger">Lỗi mất kết nối với não bộ AI!</div></div>
        `);
    }
}
// --- QUẢN LÝ TẢI XUỐNG DYNAMIC ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(fetchClientDownloads, 500);
});

async function fetchClientDownloads() {
    try {
        const res = await fetch(API_URL + '/downloads');
        const data = await res.json();
        
        const downloadContainer = document.querySelector('#download-page .stagger-2');
        if (!downloadContainer) return;
        
        downloadContainer.innerHTML = '';
        
        if (data.length === 0) {
            downloadContainer.innerHTML = '<p style="color: #fff;">Đang cập nhật link tải...</p>';
            return;
        }
        
        data.forEach(dl => {
            const card = `
                <div class="info-card hover-glow" style="border-top: 4px solid ${dl.iconColor}; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    <img src="${dl.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'}" alt="App" style="width: 100%; height: 160px; object-fit: cover;">
                    <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                        <div class="card-title">
                            <h4><i class="${dl.iconClass}" style="color: ${dl.iconColor};"></i> ${dl.name}</h4>
                        </div>
                        <p class="desc-text" style="margin-top: 10px; flex: 1;">${dl.description}</p>
                        <button class="btn-auth" style="margin-top: 15px; background: ${hexToRgba(dl.iconColor, 0.1)}; border-color: ${hexToRgba(dl.iconColor, 0.3)}; color: ${dl.iconColor};" onclick="window.open('${dl.url}', '_blank')"><i class="fas fa-download"></i> Tải Ngay (${dl.version})</button>
                    </div>
                </div>
            `;
            downloadContainer.insertAdjacentHTML('beforeend', card);
        });
    } catch (e) { console.error("Lỗi khi tải downloads:", e); }
}

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return 'rgba(59, 130, 246, ' + alpha + ')';
}

// --- ADVANCED BUY MODAL ---
let currentBuyProduct = null;
let currentSelectedPackage = null;
let currentBuyQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
    const advancedModalHtml = `
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
    </div>`;

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
    const m = document.getElementById('advanced-buy-modal'); m.style.display = 'flex'; setTimeout(() => m.classList.add('show'), 10);

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
            html += `<div class="pkg-option active" onclick="selectPackage(null, ${prod.price}, '??')" style="padding: 12px; border: 1px solid #a855f7; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; background: rgba(168,85,247,0.1);">
                <strong>MẶC ĐỊNH</strong>
                <span style="color: #a855f7;">${prod.price.toLocaleString()}đ</span>
            </div>`;
            currentSelectedPackage = { id: null, price: prod.price, stock: '??' };
            document.getElementById('adv-prod-stock').innerText = 'Sẵn sàng';
        } else {
            pkgs.forEach((pkg, index) => {
                totalStock += pkg.stock;
                let displayName = pkg.name.toUpperCase();
                if (!displayName.includes('KEY')) displayName = 'KEY ' + displayName;
                
                html += `<div class="pkg-option ${index === 0 ? 'active' : ''}" id="pkg-opt-${pkg._id}" onclick="selectPackage('${pkg._id}', ${pkg.price}, ${pkg.stock})" style="padding: 12px 15px; border: 1px solid ${index === 0 ? '#a855f7' : '#333'}; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: ${index === 0 ? 'rgba(168,85,247,0.1)' : '#111122'};">
                    <div>
                        <strong style="color: #fff; font-size: 0.95rem;">${displayName}</strong><br>
                        <span style="font-size: 0.8rem; color: #888;">Còn ${pkg.stock} key</span>
                    </div>
                    <div style="text-align: right;">
                        <strong style="color: #a855f7;">${pkg.price.toLocaleString()}đ</strong>
                        ${pkg.originalPrice ? `<br><span style="font-size: 0.8rem; color: #666; text-decoration: line-through;">${pkg.originalPrice.toLocaleString()}đ</span>` : ''}
                    </div>
                </div>`;
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
        document.getElementById('adv-original-price').innerHTML = `Giá gốc <span style="text-decoration: line-through;">${currentBuyProduct.originalPrice.toLocaleString()}đ</span>`;
        const percent = Math.round(100 - (unitPrice / currentBuyProduct.originalPrice) * 100);
        document.getElementById('adv-discount-tag').innerText = 'Giảm ' + percent + '%';
    } else {
        // Fake discount if none
        const fakeOriginal = Math.round(unitPrice * 1.35 / 1000) * 1000;
        document.getElementById('adv-discount-tag').style.display = 'inline-block';
        document.getElementById('adv-original-price').style.display = 'inline-block';
        document.getElementById('adv-original-price').innerHTML = `Giá gốc <span style="text-decoration: line-through;">${fakeOriginal.toLocaleString()}đ</span>`;
        document.getElementById('adv-discount-tag').innerText = 'Giảm 35%';
    }
}

function closeAdvancedBuyModal() {
    const m = document.getElementById('advanced-buy-modal'); m.classList.remove('show'); setTimeout(() => m.style.display = 'none', 300);
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
            updateBalanceUI(data.balance);
            closeAdvancedBuyModal();
            fetchOrders();
            fetchHistory();
        } else {
            showToast("Lỗi: " + data.message);
        }
    } catch (e) {
        showToast("Lỗi kết nối!");
    }
}
