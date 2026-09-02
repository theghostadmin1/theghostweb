// ==========================================
// 🌟 TẤT CẢ LOGIC CHO TRANG KHÁCH HÀNG (CLIENT)
// ==========================================
const API_URL = "/api";
let CURRENT_USER_ID = "guest"; // Mặc định chưa đăng nhập

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
        btn.setAttribute('aria-label', document.body.classList.contains('nav-open') ? 'Đóng menu' : 'Mở menu');
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

    // 2.1 Kích hoạt tải danh sách Download từ database
    fetchClientDownloads();

    fetchClientNews();
    setTimeout(fetchClientNews, 400);

    wireContactLinks();
    wireHomeQuickLinks();

    initMobileNav();

    // 3. Hiển thị thông báo chào mừng
    showWelcomeModal();
});

const CONTACT_FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61585402175537';
const CONTACT_DISCORD_URL = 'https://discord.gg/qczA6fMuP';
const CONTACT_ZALO_DISPLAY = '0347.784.189';
const CONTACT_ZALO_URL = 'https://zalo.me/0347784189';

function wireContactCard(card, url, labelText) {
    const label = card.querySelector('p');
    if (label) {
        label.innerHTML = '<a href="' + url + '" target="_blank" rel="noopener noreferrer" style="color:#9ca3af; text-decoration:none;">' + labelText + '</a>';
    }
    const btn = card.querySelector('button, a.btn-auth');
    if (btn) {
        btn.onclick = function (e) {
            e.preventDefault();
            window.open(url, '_blank', 'noopener');
        };
    }
    card.style.cursor = 'pointer';
    card.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        window.open(url, '_blank', 'noopener');
    });
}

function wireContactLinks() {
    const page = document.getElementById('contact-page');
    if (page) {
        page.querySelectorAll('.info-card').forEach(card => {
            if (card.querySelector('.fa-facebook-f, .fa-facebook')) {
                wireContactCard(card, CONTACT_FACEBOOK_URL, 'facebook.com/The Ghost');
            }
            if (card.querySelector('.fa-discord')) {
                wireContactCard(card, CONTACT_DISCORD_URL, 'discord.gg/qczA6fMuP');
            }
            if (card.querySelector('.fa-phone-alt, .fa-phone, .fa-comment-dots')) {
                wireContactCard(card, CONTACT_ZALO_URL, CONTACT_ZALO_DISPLAY);
            }
        });
    }
    applyShopPhoneNumber();
    setTimeout(applyShopPhoneNumber, 200);
}

function applyShopPhoneNumber() {
    const display = CONTACT_ZALO_DISPLAY;
    const compact = '0347784189';
    const bankStk = '6004012002';
    const dottedPhone = /0\d{3}[.\s-]\d{3}[.\s-]\d{3}/g;
    const compactPhone = /\b0(?:1|3|5|7|8|9)\d{8}\b/g;

    const rewrite = (value) => {
        if (!value) return value;
        let next = value.replace(/https?:\/\/zalo\.me\/\d+/gi, CONTACT_ZALO_URL);
        next = next.replace(dottedPhone, (m) => (m.replace(/\D/g, '') === bankStk ? m : display));
        next = next.replace(compactPhone, (m) => (m === bankStk ? m : compact));
        next = next.replace(/tel:\+?84?\d+/gi, 'tel:' + compact);
        return next;
    };

    document.querySelectorAll('a[href*="zalo.me"], a[href^="tel:"]').forEach(a => {
        if (/zalo\.me/i.test(a.href)) a.href = CONTACT_ZALO_URL;
        if (/^tel:/i.test(a.getAttribute('href') || '')) a.href = 'tel:' + compact;
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
        if (!node.nodeValue) return;
        const parent = node.parentElement;
        if (parent && (parent.id === 'stk-val' || parent.classList.contains('account-number'))) return;
        let next = node.nodeValue.replace(dottedPhone, (m) => (m.replace(/\D/g, '') === bankStk ? m : display));
        next = next.replace(compactPhone, (m) => (m === bankStk ? m : display));
        if (next !== node.nodeValue) node.nodeValue = next;
    });

    document.querySelectorAll('[onclick],[href],[placeholder],[title]').forEach(el => {
        ['onclick', 'href', 'placeholder', 'title'].forEach(attr => {
            const v = el.getAttribute(attr);
            if (!v || v.includes(bankStk)) return;
            const n = rewrite(v);
            if (n !== v) el.setAttribute(attr, n);
        });
    });
}

function scrollContentTop() {
    const wrap = document.querySelector('.content-wrapper');
    if (wrap) wrap.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToProductTab(tabId) {
    switchPage('home');
    setTimeout(() => {
        const btn = document.querySelector('.prod-tab[onclick*="\'' + tabId + '\'"]')
            || Array.from(document.querySelectorAll('.prod-tab')).find(b => {
                const t = (b.textContent || '').toLowerCase();
                if (tabId === 'tool') return /công cụ|check|tool/.test(t);
                if (tabId === 'cheat') return /bot|cheat/.test(t);
                if (tabId === 'acc') return /tài khoản|acc/.test(t);
                return false;
            });
        if (btn) switchProdTab(tabId, btn);
        const sec = document.getElementById('products-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
}

function wireHomeQuickLinks() {
    document.querySelectorAll('.notification-list li').forEach(li => {
        const text = (li.textContent || '').toLowerCase();
        let handler = null;
        if (text.includes('liên hệ') || text.includes('admin')) {
            handler = () => { switchPage('contact'); scrollContentTop(); };
        } else if (text.includes('download') || text.includes('tải')) {
            handler = () => { switchPage('download'); scrollContentTop(); };
        } else if (text.includes('nạp')) {
            handler = () => openTopupModal('bank');
        } else if (text.includes('bot')) {
            handler = () => goToProductTab('cheat');
        }
        if (!handler) return;
        li.style.cursor = 'pointer';
        const a = li.querySelector('a');
        if (a) {
            a.setAttribute('href', 'javascript:void(0)');
            a.onclick = function (e) {
                e.preventDefault();
                e.stopPropagation();
                handler();
            };
        }
        li.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            handler();
        });
    });

    const openCheckTools = () => goToProductTab('tool');
    document.querySelectorAll('.btn-discover').forEach(btn => {
        btn.onclick = function (e) {
            e.preventDefault();
            openCheckTools();
        };
    });
    document.querySelectorAll('.tool-list li').forEach(li => {
        li.style.cursor = 'pointer';
        li.onclick = openCheckTools;
    });
}

const WELCOME_SNOOZE_KEY = 'THEGHOST_WELCOME_SNOOZE_UNTIL';

function isWelcomeSnoozed() {
    const until = Number(localStorage.getItem(WELCOME_SNOOZE_KEY) || 0);
    return until > Date.now();
}

function showWelcomeModal() {
    if (isWelcomeSnoozed()) return;
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
                <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="btn-auth" onclick="closeWelcomeModal()" style="flex: 1; min-width: 140px; margin-top: 0; font-weight: bold;"><i class="fas fa-check-circle"></i> TÔI ĐÃ HIỂU</button>
                    <button type="button" onclick="snoozeWelcomeModal(1)" style="flex: 1; min-width: 140px; padding: 16px; border-radius: 12px; border: 1px solid rgba(139,92,246,0.45); background: rgba(17,17,27,0.9); color: #e5e7eb; font-weight: 800; cursor: pointer; font-size: 0.95rem; font-family: inherit;"><i class="fas fa-clock"></i> TẮT TRONG 1H</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    setTimeout(() => {
        const modal = document.getElementById('welcome-modal');
        if (modal) modal.classList.add('show');
    }, 10);
}

function snoozeWelcomeModal(hours) {
    const ms = Math.max(1, Number(hours) || 1) * 60 * 60 * 1000;
    localStorage.setItem(WELCOME_SNOOZE_KEY, String(Date.now() + ms));
    closeWelcomeModal();
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
            const prodImg = resolveClientDownloadImage(prod.imageUrl);
            const tag = (prod.tag && String(prod.tag).trim())
                || (prod.category === 'cheat' ? 'AIMBOT AURORAVN' : (prod.category === 'acc' ? 'TÀI KHOẢN GAME' : 'TOOL VIP'));
            
            // Format bullet points from description
            const rawDesc = prod.description || 'Sản phẩm uy tín, an toàn 100% từ hệ thống TheGhost.';
            const descLines = rawDesc.split(/\n|<br\s*\/?>/i).map(l => l.trim()).filter(l => l);
            const featuresHtml = descLines.map(line => {
                const clean = line.replace(/^[✓✔•\-\*]\s*/, '');
                return `<div><i class="fas fa-check"></i> <span>${clean}</span></div>`;
            }).join('');

            const discountBadgeHtml = (prod.isDiscountable !== false)
                ? '<div class="prod-discount-badge">Sản phẩm được giảm</div>'
                : '<div class="prod-discount-badge" style="background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #9ca3af;">Giá niêm yết chuẩn</div>';

            const originalPriceHtml = (prod.originalPrice && prod.originalPrice > prod.price)
                ? `<span style="font-size:0.8rem; color:#888; text-decoration:line-through; margin-left:6px;">${prod.originalPrice.toLocaleString()}đ</span>`
                : '';

            const cardHtml = `
                <div class="prod-card">
                    <div class="prod-card-banner-wrap">
                        <img src="${prodImg}" class="prod-card-banner" alt="${prod.name}" onerror="this.src='/src/IMG/cover.jpg'">
                        <div class="prod-card-status-badge">
                            <span class="prod-card-status-dot"></span>
                            <span>CÒN HÀNG</span>
                        </div>
                    </div>
                    <div class="prod-card-body">
                        <span class="prod-card-tag"><span class="prod-card-tag-dot"></span>${tag}</span>
                        <h3 class="prod-card-title">${prod.name}</h3>
                        
                        <div class="prod-card-features">
                            ${featuresHtml}
                        </div>
                        
                        <div class="prod-card-meta">
                            <span><i class="fas fa-cube"></i> Kho: <strong>432</strong></span>
                            <span>|</span>
                            <span><i class="fas fa-cubes"></i> Gói: <strong>6</strong></span>
                            <span>|</span>
                            <span><i class="fas fa-chart-line"></i> Đã bán: <strong>10162</strong></span>
                        </div>

                        ${discountBadgeHtml}
                        
                        <div class="prod-bottom">
                            <div class="prod-price-wrap">
                                <span>TỪ ${originalPriceHtml}</span>
                                <div class="prod-price">${prod.price.toLocaleString()}đ</div>
                            </div>
                            <button class="btn-buy" onclick="openAdvancedBuyModal('${prod._id}')">
                                <i class="fas fa-cart-shopping"></i> MUA
                            </button>
                        </div>
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
let CURRENT_USER_IS_RESELLER = false;
let CURRENT_USER_DISCOUNT = 0;
let CURRENT_USER_IS_VIP = false;
let currentAppliedCoupon = null; // { code, discountPercent }
let lastKnownBalance = -1;
let balancePollBusy = false;
let balanceEventSource = null;
let balancePollLoopStarted = false;
let burstUntil = 0;
let userDataSeq = 0;

function paintBalance(amount) {
    const formatted = Number(amount).toLocaleString() + 'đ';
    const header = document.getElementById('header-balance');
    if (header) header.innerText = formatted;
    const stat = document.getElementById('stat-balance');
    if (stat) stat.innerText = formatted;
    const acc = document.getElementById('acc-info-balance');
    if (acc) acc.innerText = formatted;
}

function showTopupSuccess(diff) {
    const topupModal = document.getElementById('topup-modal');
    const qrImg = document.getElementById('sepay-qr-img');
    const modalOpen = topupModal && (topupModal.classList.contains('show') || topupModal.style.display === 'flex');
    if (modalOpen && qrImg && !document.getElementById('qr-success-msg')) {
        qrImg.style.display = 'none';
        const successUI = document.createElement('div');
        successUI.id = 'qr-success-msg';
        successUI.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 10px;background:rgba(16,185,129,0.1);border:2px dashed #10b981;border-radius:10px;margin-top:10px;';
        successUI.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 3.5rem; color: #10b981; margin-bottom: 15px;"></i>
            <h3 style="color: #10b981; margin: 0 0 10px 0;">CHUYỂN KHOẢN THÀNH CÔNG!</h3>
            <p style="color: #fff; font-size: 1.1rem; margin: 0;">Hệ thống đã ghi nhận: <strong style="color: #a855f7;">+${diff.toLocaleString()}đ</strong></p>`;
        qrImg.parentElement.appendChild(successUI);
        if (typeof showToast === 'function') showToast('Nhận tiền thành công! Cảm ơn bạn.');
        setTimeout(() => {
            if (typeof closeTopupModal === 'function') closeTopupModal();
            qrImg.style.display = 'block';
            successUI.remove();
        }, 4000);
        return;
    }
    if (typeof showToast === 'function') {
        showToast('Tài khoản vừa được cộng: +' + diff.toLocaleString() + 'đ');
    }
}

function applyIncomingBalance(newBalance) {
    if (typeof newBalance !== 'number' || Number.isNaN(newBalance)) return;
    if (lastKnownBalance === -1) {
        lastKnownBalance = newBalance;
        paintBalance(newBalance);
        return;
    }
    if (newBalance === lastKnownBalance) return;
    const diff = newBalance - lastKnownBalance;
    lastKnownBalance = newBalance;
    paintBalance(newBalance);
    if (diff > 0) showTopupSuccess(diff);
    if (CURRENT_USER_ID && CURRENT_USER_ID !== 'guest') loadUserData(CURRENT_USER_ID);
}

function pollUserBalance() {
    if (balancePollBusy) return Promise.resolve();
    if (typeof CURRENT_USER_ID === 'undefined' || CURRENT_USER_ID === 'guest') return Promise.resolve();
    balancePollBusy = true;
    const api = typeof API_URL !== 'undefined' ? API_URL : '/api';
    return fetch(api + '/user-data/' + encodeURIComponent(CURRENT_USER_ID) + '?lite=1&t=' + Date.now())
        .then(res => {
            if (res.status === 404) {
                sessionStorage.removeItem('THEGHOST_SAVED_USER');
                CURRENT_USER_ID = 'guest';
                location.reload();
                return null;
            }
            return res.json();
        })
        .then(data => {
            if (data && typeof data.balance === 'number') applyIncomingBalance(data.balance);
        })
        .catch(() => {})
        .finally(() => { balancePollBusy = false; });
}

function connectBalanceStream() {
    if (!CURRENT_USER_ID || CURRENT_USER_ID === 'guest') return;
    if (balanceEventSource) {
        try { balanceEventSource.close(); } catch (e) {}
        balanceEventSource = null;
    }
    const api = typeof API_URL !== 'undefined' ? API_URL : '/api';
    try {
        balanceEventSource = new EventSource(api + '/balance-stream/' + encodeURIComponent(CURRENT_USER_ID));
        balanceEventSource.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                applyIncomingBalance(data.balance);
            } catch (e) {}
        };
    } catch (e) {}
}

function startBalancePollLoop() {
    if (balancePollLoopStarted) return;
    balancePollLoopStarted = true;
    (function loop() {
        const modal = document.getElementById('topup-modal');
        const waitingQr = modal && (modal.classList.contains('show') || modal.style.display === 'flex');
        const bursting = Date.now() < burstUntil;
        const delay = (waitingQr || bursting) ? 400 : 2000;
        setTimeout(() => {
            Promise.resolve(pollUserBalance()).finally(loop);
        }, delay);
    })();
}

function burstBalanceCheck() {
    burstUntil = Date.now() + 60000;
    pollUserBalance();
}

function startBalanceLive() {
    connectBalanceStream();
    startBalancePollLoop();
    burstBalanceCheck();
}

function stopBalanceLive() {
    lastKnownBalance = -1;
    burstUntil = 0;
    if (balanceEventSource) {
        try { balanceEventSource.close(); } catch (e) {}
        balanceEventSource = null;
    }
}

function onShopBecameVisible() {
    if (!CURRENT_USER_ID || CURRENT_USER_ID === 'guest') return;
    connectBalanceStream();
    burstBalanceCheck();
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) onShopBecameVisible();
});
window.addEventListener('focus', onShopBecameVisible);
window.addEventListener('pageshow', onShopBecameVisible);
window.addEventListener('online', onShopBecameVisible);

window.pollUserBalance = pollUserBalance;
window.burstBalanceCheck = burstBalanceCheck;

async function loadUserData(username) {
    const seq = ++userDataSeq;
    try {
        const res = await fetch(`${API_URL}/user-data/${username}`);
        if (!res.ok) return;
        if (seq !== userDataSeq) return;
        const data = await res.json();
        if (seq !== userDataSeq) return;

        CURRENT_USER_IS_RESELLER = !!data.isReseller || (data.discountPercent > 0);
        CURRENT_USER_DISCOUNT = data.discountPercent || 0;
        CURRENT_USER_IS_VIP = !!data.isVip;
        applyResellerBadge();

        document.getElementById('header-balance').innerText = data.balance.toLocaleString() + "đ";
        document.getElementById('stat-balance').innerText = data.balance.toLocaleString() + "đ";
        lastKnownBalance = data.balance;

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
                    <td><span class="order-id">#GD-${String(hist._id).slice(-6).toUpperCase()}</span></td>
                    <td><span class="badge ${hist.type === 'Mua Hàng' ? 'status-buy' : 'status-success'}">${hist.type}</span></td>
                    <td class="${hist.amount < 0 ? 'text-danger' : 'text-primary'}">${hist.amount > 0 ? '+' : ''}${hist.amount.toLocaleString()}đ</td>
                    <td>${hist.desc}</td>
                    <td class="text-muted">${timeStr}</td>
                </tr>`;
                historyTbody.insertAdjacentHTML('beforeend', row);
            });
        }

        const guestStats = document.getElementById('guest-stats-grid');
        if (guestStats) guestStats.style.display = 'grid';

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
    if (pageId === 'download' && typeof fetchClientDownloads === 'function') {
        fetchClientDownloads();
    }
    closeMobileNav();
}

function scrollToProducts() {
    switchPage('home');
    setTimeout(() => {
        const sec = document.getElementById('products-section');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function switchProdTab(tabId, btnElement) {
    if (!btnElement) {
        btnElement = document.querySelector('.prod-tab[onclick*="\'' + tabId + '\'"]');
    }
    document.querySelectorAll('.prod-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.prod-content').forEach(c => {
        c.classList.remove('active');
        c.style.display = 'none';
    });
    if (btnElement) btnElement.classList.add('active');
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

function applyResellerBadge() {
    const isSell = CURRENT_USER_IS_RESELLER && CURRENT_USER_DISCOUNT > 0;
    const isVip = !!CURRENT_USER_IS_VIP;
    let rank = document.getElementById('stat-member');
    if (!rank) {
        const grid = document.getElementById('guest-stats-grid');
        const titles = grid ? grid.querySelectorAll('.stat-card h3') : [];
        if (titles.length) {
            rank = titles[titles.length - 1];
            rank.id = 'stat-member';
        }
    }
    if (rank) {
        if (isVip && isSell) {
            rank.className = 'gradient-text vip-rank';
            rank.innerHTML = '<i class="fas fa-gem"></i> VIP <span class="header-sell-badge" style="margin-left:6px;"><i class="fas fa-crown"></i> SELL</span>';
        } else if (isVip) {
            rank.className = 'gradient-text vip-rank';
            rank.innerHTML = '<i class="fas fa-gem"></i> VIP';
        } else if (isSell) {
            rank.className = 'gradient-text sell-rank';
            rank.innerHTML = '<i class="fas fa-crown"></i> SELL';
        } else {
            rank.className = 'gradient-text';
            rank.textContent = 'Member';
        }
    }
    const label = rank && rank.parentElement ? rank.parentElement.querySelector('p') : null;
    if (label) {
        if (isVip && isSell) label.textContent = 'VIP + Đại lý -' + CURRENT_USER_DISCOUNT + '%';
        else if (isVip) label.textContent = 'Thành viên VIP';
        else if (isSell) label.textContent = 'Đại lý -' + CURRENT_USER_DISCOUNT + '%';
        else label.textContent = 'Thành viên';
    }
    const nameEl = document.getElementById('display-username');
    if (nameEl && nameEl.parentElement) {
        let headerVip = document.getElementById('header-vip-badge');
        if (!headerVip) {
            headerVip = document.createElement('span');
            headerVip.id = 'header-vip-badge';
            nameEl.insertAdjacentElement('afterend', headerVip);
        }
        if (isVip) {
            headerVip.className = 'header-vip-badge';
            headerVip.innerHTML = '<i class="fas fa-gem"></i> VIP';
            headerVip.style.display = 'inline-flex';
        } else {
            headerVip.style.display = 'none';
        }
        let headerBadge = document.getElementById('header-sell-badge');
        if (!headerBadge) {
            headerBadge = document.createElement('span');
            headerBadge.id = 'header-sell-badge';
            headerVip.insertAdjacentElement('afterend', headerBadge);
        }
        if (isSell) {
            headerBadge.className = 'header-sell-badge';
            headerBadge.innerHTML = '<i class="fas fa-crown"></i> SELL';
            headerBadge.style.display = 'inline-flex';
        } else {
            headerBadge.style.display = 'none';
        }
    }
}

function applyLoginState(username, extra) {
    document.getElementById('guest-area').style.display = 'none';
    document.getElementById('logged-in-area').style.display = 'flex';
    document.getElementById('display-username').innerText = username;
    CURRENT_USER_ID = username;
    sessionStorage.setItem('THEGHOST_SAVED_USER', username);
    if (extra) {
        CURRENT_USER_IS_RESELLER = !!extra.isReseller || (extra.discountPercent > 0);
        CURRENT_USER_DISCOUNT = extra.discountPercent || 0;
        CURRENT_USER_IS_VIP = !!extra.isVip;
        applyResellerBadge();
    }
    updateSePayQR();
    loadUserData(username);
    startBalanceLive();
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
        const email = String(payload.email || '').trim().toLowerCase();
        if (!/^[a-z0-9._%+\-]+@(gmail|googlemail)\.com$/.test(email)) {
            showToast('Vui lòng dùng Gmail thật (@gmail.com)!');
            return;
        }
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
            applyLoginState(data.username || payload.username, data);
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
    CURRENT_USER_IS_RESELLER = false;
    CURRENT_USER_DISCOUNT = 0;
    CURRENT_USER_IS_VIP = false;
    applyResellerBadge();
    sessionStorage.removeItem('THEGHOST_SAVED_USER');
    stopBalanceLive();
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
    burstBalanceCheck();
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
            if (CURRENT_USER_ID && CURRENT_USER_ID !== 'guest') loadUserData(CURRENT_USER_ID);
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
            body: JSON.stringify({
                message: msgText,
                username: (typeof CURRENT_USER_ID !== 'undefined' && CURRENT_USER_ID !== 'guest') ? CURRENT_USER_ID : ''
            })
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
function resolveDownloadImage(imageUrl) {
    if (!imageUrl) return '/src/IMG/default.svg';
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/src/IMG/')) return imageUrl;
    return '/src/IMG/' + String(imageUrl).replace(/^.*[\\/]/, '');
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(fetchClientDownloads, 500);
});

function escapeDl(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatDownloadCount(n) {
    const num = Number(n) || 0;
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm lượt';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k lượt';
    return num + ' lượt';
}

async function fetchClientDownloads() {
    try {
        const res = await fetch(API_URL + '/downloads');
        const data = await res.json();
        
        const downloadContainer = document.querySelector('#download-page .stagger-2');
        if (!downloadContainer) return;
        
        downloadContainer.classList.add('dl-grid');
        downloadContainer.style.display = '';
        downloadContainer.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            downloadContainer.classList.remove('dl-grid');
            downloadContainer.innerHTML = '<p style="color: #fff;">Đang cập nhật link tải...</p>';
            return;
        }
        
        data.forEach(dl => {
            const imgSrc = resolveDownloadImage(dl.imageUrl);
            const tag = dl.tag || dl.version || 'DOWNLOAD';
            const title = dl.name || 'File tải xuống';
            const desc = dl.description || 'File tải xuống từ hệ thống TheGhost.';
            const size = dl.fileSize || '—';
            const count = formatDownloadCount(dl.downloadCount);
            const videoBtn = dl.videoUrl
                ? `<button class="dl-btn-video" onclick="openDownloadVideo(${JSON.stringify(dl.videoUrl)})"><i class="far fa-play-circle"></i> VIDEO HD</button>`
                : '';
            const card = `
                <div class="dl-card">
                    <img class="dl-card-banner" src="${escapeDl(imgSrc)}" alt="${escapeDl(title)}">
                    <div class="dl-card-body">
                        <span class="dl-card-tag">${escapeDl(tag)}</span>
                        <h3 class="dl-card-title">${escapeDl(title)}</h3>
                        <p class="dl-card-desc">${escapeDl(desc)}</p>
                        <div class="dl-card-meta">
                            <span><i class="fas fa-download"></i> ${escapeDl(count)}</span>
                            <span><i class="fas fa-th-large"></i> ${escapeDl(size)}</span>
                        </div>
                        <div class="dl-btn-row">
                            <button class="dl-btn-main" onclick="startDownloadFile('${dl._id}', ${JSON.stringify(dl.url || '')})">
                                <i class="fas fa-download"></i> TẢI XUỐNG NGAY
                            </button>
                            <button class="dl-btn-copy" title="Sao chép link" onclick="copyDownloadLink(${JSON.stringify(dl.url || '')})">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>
                        ${videoBtn}
                    </div>
                </div>
            `;
            downloadContainer.insertAdjacentHTML('beforeend', card);
        });
    } catch (e) { console.error("Lỗi khi tải downloads:", e); }
}

async function startDownloadFile(id, url) {
    if (!url) return showToast('Chưa có link tải!');
    try {
        fetch(API_URL + '/downloads/' + id + '/hit', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    window.open(url, '_blank');
}

function copyDownloadLink(url) {
    if (!url) return showToast('Chưa có link để sao chép!');
    if (typeof copyText === 'function') copyText(url);
    else {
        navigator.clipboard.writeText(url);
        showToast('Đã sao chép link tải!');
    }
}

function openDownloadVideo(url) {
    if (!url) return showToast('Chưa có video HD!');
    window.open(url, '_blank');
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
                <div style="width: 100%; height: 260px; border-radius: 12px; overflow: hidden; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1); background: #08080c;">
                    <img src="/src/IMG/cover.jpg" id="adv-prod-img" style="width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block;">
                </div>
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
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <div style="flex: 1; position: relative;">
                        <i class="fas fa-tag" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #888;"></i>
                        <input type="text" id="adv-coupon-input" placeholder="Nhập mã..." style="width: 100%; padding: 10px 10px 10px 30px; background: #0f0f1a; border: 1px solid #333; border-radius: 8px; color: #fff; box-sizing: border-box; outline: none; text-transform: uppercase;">
                    </div>
                    <button onclick="applyCouponCode()" style="background: #7c3aed; color: #fff; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; font-weight: 700;">Áp dụng</button>
                </div>
                <div id="adv-coupon-msg" style="font-size: 0.8rem; margin-top: -10px; margin-bottom: 15px; display: none;"></div>

                <div style="background: #0f0f1a; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; border: 1px solid #333;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #888;">Đơn giá:</span> <strong id="adv-unit-price" style="color: #a855f7;">0đ</strong></div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span style="color: #888;">Số lượng:</span> <strong id="adv-qty-text" style="color: #fff;">1</strong></div>
                    <div id="adv-discount-row" style="display: none; justify-content: space-between; margin-bottom: 8px;"><span style="color: #10b981;">Chiết khấu giảm:</span> <strong id="adv-discount-val" style="color: #10b981;">-0đ</strong></div>
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
    currentAppliedCoupon = null;

    const couponInput = document.getElementById('adv-coupon-input');
    if (couponInput) couponInput.value = '';
    const couponMsg = document.getElementById('adv-coupon-msg');
    if (couponMsg) { couponMsg.style.display = 'none'; couponMsg.innerText = ''; }

    document.getElementById('adv-prod-name').innerText = prod.name;
    document.getElementById('adv-prod-desc').innerHTML = prod.description ? prod.description.replace(/\n/g, '<br>') : 'Sản phẩm uy tín từ TheGhost.';
    document.getElementById('adv-prod-price').innerText = prod.price.toLocaleString() + 'đ';
    
    // Set Product Image (not ghost logo)
    const imgEl = document.getElementById('adv-prod-img');
    if (imgEl) {
        const prodImg = resolveClientDownloadImage(prod.imageUrl);
        imgEl.src = prodImg;
        imgEl.onerror = () => { imgEl.src = '/src/IMG/cover.jpg'; };
    }

    const stockEl = document.getElementById('adv-prod-stock');
    if (stockEl) stockEl.innerText = 'Đang tải...';
    document.getElementById('adv-packages-container').innerHTML = '<div style="color: #888; text-align: center;">Đang tải gói...</div>';

    updateBuyCalc();
    const m = document.getElementById('advanced-buy-modal'); m.style.display = 'flex'; setTimeout(() => m.classList.add('show'), 10);

    try {
        const res = await fetch(API_URL + '/products/' + prodId + '/packages');
        const pkgs = await res.json();
        
        const pkgContainer = document.getElementById('adv-packages-container');
        pkgContainer.innerHTML = '';
        
        let totalStock = 0;
        let html = '';

        const sellable = Array.isArray(pkgs) ? pkgs.filter(pkg => pkg && pkg.name !== 'TẠM HẾT HÀNG' && pkg.stock > 0) : [];

        if (sellable.length === 0) {
            html += `<div style="padding: 12px; border: 1px solid #ef4444; border-radius: 8px; color: #ef4444; text-align: center;">TẠM HẾT HÀNG</div>`;
            currentSelectedPackage = null;
            document.getElementById('adv-prod-stock').innerText = 'Hết hàng';
            document.getElementById('adv-status-tag').style.color = '#ef4444';
            document.getElementById('adv-status-tag').innerText = '• HẾT HÀNG';
        } else {
            document.getElementById('adv-status-tag').style.color = '#10b981';
            document.getElementById('adv-status-tag').innerText = '• CÒN HÀNG';
            sellable.forEach((pkg, index) => {
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

async function applyCouponCode() {
    const input = document.getElementById('adv-coupon-input');
    const msgEl = document.getElementById('adv-coupon-msg');
    const code = input ? input.value.trim().toUpperCase() : '';
    if (!code) {
        showToast('Vui lòng nhập mã giảm giá!');
        return;
    }

    try {
        const res = await fetch(API_URL + '/coupons/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, username: CURRENT_USER_ID })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
            currentAppliedCoupon = { code: data.code, discountPercent: data.discountPercent };
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.style.color = '#10b981';
                msgEl.innerText = `✓ ${data.message}`;
            }
            showToast(`Áp dụng mã ${data.code} thành công: Giảm ${data.discountPercent}%!`);
            updateBuyCalc();
        } else {
            currentAppliedCoupon = null;
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.style.color = '#ef4444';
                msgEl.innerText = `✕ ${data.message || 'Mã không hợp lệ'}`;
            }
            showToast(data.message || 'Mã không hợp lệ!');
            updateBuyCalc();
        }
    } catch (e) {
        showToast('Lỗi kết nối kiểm tra mã!');
    }
}

window.applyCouponCode = applyCouponCode;

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
    if (currentSelectedPackage && typeof currentSelectedPackage.stock === 'number' && newQ > currentSelectedPackage.stock) {
        newQ = currentSelectedPackage.stock;
    }
    currentBuyQuantity = newQ;
    document.getElementById('adv-quantity').value = currentBuyQuantity;
    updateBuyCalc();
}

function updateBuyCalc() {
    if (!currentBuyProduct) return;
    const unitPrice = currentSelectedPackage ? currentSelectedPackage.price : currentBuyProduct.price;
    const rawTotal = unitPrice * currentBuyQuantity;

    // Calculate Highest Discount: Reseller vs Coupon
    let effectiveDiscountPercent = 0;
    let discountSource = '';

    const productAllowsDiscount = !currentBuyProduct || currentBuyProduct.isDiscountable !== false;
    if (productAllowsDiscount && CURRENT_USER_IS_RESELLER && CURRENT_USER_DISCOUNT > 0) {
        effectiveDiscountPercent = CURRENT_USER_DISCOUNT;
        discountSource = `SELL -${CURRENT_USER_DISCOUNT}%`;
    }

    if (currentAppliedCoupon && currentAppliedCoupon.discountPercent > 0) {
        if (currentAppliedCoupon.discountPercent > effectiveDiscountPercent) {
            effectiveDiscountPercent = currentAppliedCoupon.discountPercent;
            discountSource = `MÃ ${currentAppliedCoupon.code} -${currentAppliedCoupon.discountPercent}%`;
        }
    }

    let finalTotal = rawTotal;
    const discountRow = document.getElementById('adv-discount-row');
    const discountVal = document.getElementById('adv-discount-val');

    if (effectiveDiscountPercent > 0) {
        const discountAmount = Math.round(rawTotal * effectiveDiscountPercent / 100);
        finalTotal = rawTotal - discountAmount;
        if (discountRow && discountVal) {
            discountRow.style.display = 'flex';
            discountVal.innerText = `-${discountAmount.toLocaleString()}đ (${discountSource})`;
        }
    } else if (discountRow) {
        discountRow.style.display = 'none';
    }
    
    const userBalance = parseInt(document.getElementById('header-balance').innerText.replace(/[^0-9]/g, '')) || 0;
    const remain = userBalance - finalTotal;

    document.getElementById('adv-unit-price').innerText = unitPrice.toLocaleString() + 'đ';
    document.getElementById('adv-qty-text').innerText = currentBuyQuantity;
    document.getElementById('adv-total-price').innerText = finalTotal.toLocaleString() + 'đ';
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
}

function closeAdvancedBuyModal() {
    const m = document.getElementById('advanced-buy-modal'); m.classList.remove('show'); setTimeout(() => m.style.display = 'none', 300);
}

async function executeAdvancedBuy() {
    if (!currentBuyProduct) return;
    if (CURRENT_USER_ID === 'guest' || !CURRENT_USER_ID) {
        showToast("Vui lòng đăng nhập để mua sản phẩm!");
        openModal('login');
        return;
    }
    if (!currentSelectedPackage || currentSelectedPackage.stock === 0) {
        showToast("Sản phẩm hiện đang tạm hết hàng!");
        return;
    }
    const pkgId = currentSelectedPackage.id || null;
    const couponCode = currentAppliedCoupon ? currentAppliedCoupon.code : null;

    try {
        const response = await fetch(API_URL + '/buy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: CURRENT_USER_ID,
                productName: currentBuyProduct.name,
                packageId: pkgId,
                quantity: currentBuyQuantity,
                couponCode: couponCode
            })
        });

        const data = await response.json();
        if (response.ok) {
            showToast(data.message);
            closeAdvancedBuyModal();
            loadUserData(CURRENT_USER_ID);
        } else {
            showToast("Lỗi: " + data.message);
            if (data.message && data.message.includes('Số dư không đủ')) openTopupModal('bank');
        }
    } catch (e) {
        showToast("Lỗi kết nối!");
    }
}

// ==========================================
// 🌟 5. TẢI VÀ ĐỒNG BỘ MỤC DOWNLOAD TỪ DATABASE
// ==========================================
function resolveClientDownloadImage(imageUrl) {
    if (!imageUrl) return '/src/IMG/cover.jpg';
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/src/IMG/') || imageUrl.startsWith('/Img/') || imageUrl.startsWith('/img/')) return imageUrl;
    return '/Img/' + String(imageUrl).replace(/^.*[\\/]/, '');
}

let allClientDownloads = [];
let currentDownloadFilterTag = 'all';
let currentDownloadSearchKeyword = '';

function renderDownloadCards() {
    const container = document.querySelector('#download-page .stagger-2') || document.querySelector('#download-page > div:not(.section-header):not(.dl-search-box-container)');
    if (!container) return;

    container.innerHTML = '';
    
    // Filter by tag and search keyword
    const filtered = allClientDownloads.filter(dl => {
        const tag = (dl.tag || dl.version || '').trim();
        const matchesTag = currentDownloadFilterTag === 'all' || tag.toLowerCase() === currentDownloadFilterTag.toLowerCase();
        const searchLower = currentDownloadSearchKeyword.toLowerCase();
        const matchesSearch = !currentDownloadSearchKeyword || 
            (dl.name && dl.name.toLowerCase().includes(searchLower)) || 
            (tag && tag.toLowerCase().includes(searchLower)) ||
            (dl.description && dl.description.toLowerCase().includes(searchLower));
        return matchesTag && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: #9ca3af;"><i class="fas fa-search" style="font-size: 2.5rem; margin-bottom: 12px; opacity: 0.5;"></i><p style="font-size: 1.05rem;">Không tìm thấy bản tải xuống phù hợp.</p></div>';
        return;
    }

    filtered.forEach(dl => {
        const imgSrc = resolveClientDownloadImage(dl.imageUrl);
        const tag = dl.tag || dl.version || 'OFFICIAL';
        const size = dl.fileSize || 'Auto';
        const count = dl.downloadCount !== undefined ? dl.downloadCount : 0;
        const desc = (dl.description || 'Tải xuống phần mềm chính thức từ TheGhost.').replace(/\n/g, '<br>');
        const hasVideo = !!dl.videoUrl;
        const countDisplay = count > 1000 ? (count / 1000).toFixed(1) + 'k' : count;

        const cardHtml = `
            <div class="dl-card">
                <div class="dl-card-banner-wrap">
                    <img src="${imgSrc}" alt="${dl.name}" class="dl-card-banner" onerror="this.src='/src/IMG/cover.jpg'">
                    <div class="dl-card-banner-overlay"></div>
                </div>
                <div class="dl-card-body">
                    <span class="dl-card-tag"><i class="fas fa-shield-halved"></i> ${tag}</span>
                    <h3 class="dl-card-title">${dl.name}</h3>
                    <p class="dl-card-desc">${desc}</p>
                    <div class="dl-card-meta">
                        <span><i class="fas fa-arrow-down-to-bracket"></i> ${countDisplay} lượt</span>
                        <span><i class="fas fa-hard-drive"></i> ${size}</span>
                    </div>
                    <div class="dl-btn-row">
                        <button class="dl-btn-main" onclick="triggerDownloadHit('${dl._id}', '${dl.url}')">
                            <i class="fas fa-download"></i> TẢI XUỐNG NGAY
                        </button>
                        <button class="dl-btn-copy" onclick="copyText('${dl.url}')" title="Sao chép link">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    ${hasVideo ? `
                    <button class="dl-btn-video" onclick="window.open('${dl.videoUrl}', '_blank')">
                        <i class="fas fa-circle-play"></i> VIDEO HD
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function filterDownloadByTag(tag, element) {
    currentDownloadFilterTag = tag;
    document.querySelectorAll('.dl-tag-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    renderDownloadCards();
}

function handleDownloadSearch(keyword) {
    currentDownloadSearchKeyword = keyword.trim();
    renderDownloadCards();
}

function renderDownloadSearchAndFilterBox(tags) {
    const downloadPage = document.getElementById('download-page');
    if (!downloadPage) return;

    let searchBox = document.getElementById('dl-search-box');
    if (!searchBox) {
        searchBox = document.createElement('div');
        searchBox.id = 'dl-search-box';
        searchBox.className = 'dl-search-box-container';
        
        const sectionHeader = downloadPage.querySelector('.section-header');
        if (sectionHeader && sectionHeader.nextSibling) {
            downloadPage.insertBefore(searchBox, sectionHeader.nextSibling);
        } else {
            downloadPage.prepend(searchBox);
        }
    }

    const uniqueTags = Array.from(new Set(tags.filter(t => t && t.trim())));

    const tagButtonsHtml = `
        <button class="dl-tag-btn ${currentDownloadFilterTag === 'all' ? 'active' : ''}" onclick="filterDownloadByTag('all', this)">
            <i class="fas fa-folder-open"></i> Tất cả
        </button>
        ${uniqueTags.map(tag => `
            <button class="dl-tag-btn ${currentDownloadFilterTag.toLowerCase() === tag.toLowerCase() ? 'active' : ''}" onclick="filterDownloadByTag('${tag.replace(/'/g, "\\'")}', this)">
                ${tag}
            </button>
        `).join('')}
    `;

    searchBox.innerHTML = `
        <div class="dl-search-input-wrap">
            <i class="fas fa-search"></i>
            <input type="text" class="dl-search-input" placeholder="Tìm kiếm..." oninput="handleDownloadSearch(this.value)" value="${currentDownloadSearchKeyword}">
        </div>
        <div class="dl-tags-filter">
            ${tagButtonsHtml}
        </div>
    `;
}

async function fetchClientDownloads() {
    try {
        const res = await fetch(API_URL + '/downloads', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        allClientDownloads = Array.isArray(data) ? data : [];

        // Collect all tags from DB
        const tags = allClientDownloads.map(d => d.tag || d.version || '').filter(t => t);
        renderDownloadSearchAndFilterBox(tags);
        renderDownloadCards();
    } catch (e) {
        console.error("Lỗi khi tải downloads:", e);
    }
}

async function triggerDownloadHit(id, url) {
    if (!url || url === '#' || url === 'undefined') {
        showToast("Link tải đang được bảo trì, vui lòng quay lại sau!");
        return;
    }
    try {
        fetch(API_URL + '/downloads/' + id + '/hit', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    window.open(url, '_blank');
}

function copyText(text) {
    if (!text || text === '#') {
        showToast("Không có link để sao chép!");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast("Đã sao chép link tải!");
    }).catch(() => {
        showToast("Không thể sao chép link!");
    });
}

function escapeClientHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

let allClientNews = [];
let currentNewsFilter = 'all';
let currentNewsSearch = '';

function newsLikedIds() {
    try { return JSON.parse(localStorage.getItem('THEGHOST_NEWS_LIKES') || '[]'); } catch (e) { return []; }
}
function saveNewsLikedIds(ids) {
    localStorage.setItem('THEGHOST_NEWS_LIKES', JSON.stringify(ids));
}

function ensureNewsBlogLayout() {
    const page = document.getElementById('news-page');
    if (!page) return null;
    if (!document.getElementById('nb-grid')) {
        page.insertAdjacentHTML('beforeend', `
            <div class="nb-wrap">
                <div class="nb-header">
                    <div>
                        <h2 class="nb-title">Tin Tức &amp; Blog</h2>
                        <p class="nb-sub">Hướng dẫn, chia sẻ và cập nhật từ TheGhost.</p>
                    </div>
                    <div class="nb-tools">
                        <div class="nb-filters">
                            <button type="button" class="nb-filter active" data-cat="all" onclick="filterNewsCategory('all', this)">Tất cả</button>
                            <button type="button" class="nb-filter" data-cat="news" onclick="filterNewsCategory('news', this)">Tin tức</button>
                            <button type="button" class="nb-filter" data-cat="blog" onclick="filterNewsCategory('blog', this)">Blog</button>
                        </div>
                        <div class="nb-search">
                            <i class="fas fa-search"></i>
                            <input type="text" id="nb-search-input" placeholder="Tìm kiếm bài viết..." oninput="handleNewsSearch(this.value)">
                        </div>
                    </div>
                </div>
                <div class="nb-grid" id="nb-grid"></div>
            </div>`);
    }
    return document.getElementById('nb-grid');
}

function ensureNewsDetailModal() {
    if (document.getElementById('news-detail-modal')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay" id="news-detail-modal" style="display:none;">
            <div class="modal-card glass-panel" style="width:620px; max-width:94vw; max-height:88vh; overflow-y:auto; padding:28px;">
                <button type="button" class="close-modal" onclick="closeNewsDetail()">&times;</button>
                <img id="news-detail-img" class="news-detail-img" alt="" onerror="this.style.display='none'">
                <div class="nb-card-date" id="news-detail-date"></div>
                <h3 id="news-detail-title" style="margin:6px 0 12px; font-size:1.25rem; color:#fff;"></h3>
                <div id="news-detail-body" class="news-detail-body"></div>
                <div class="nb-card-stats" id="news-detail-stats" style="padding-top:16px;"></div>
                <a id="news-detail-link" href="#" target="_blank" rel="noopener" class="btn-auth" style="display:none; width:auto; padding:12px 18px; margin-top:18px; text-decoration:none; text-align:center;">Mở liên kết</a>
            </div>
        </div>`);
    const overlay = document.getElementById('news-detail-modal');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeNewsDetail();
    });
}

function newsCategoryOf(item) {
    return item.category === 'blog' ? 'blog' : 'news';
}

function filteredClientNews() {
    const q = currentNewsSearch.toLowerCase();
    return allClientNews.filter(n => {
        const cat = newsCategoryOf(n);
        const matchCat = currentNewsFilter === 'all' || cat === currentNewsFilter;
        const matchQ = !q || (n.title || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q);
        return matchCat && matchQ;
    });
}

function renderNewsCards() {
    const grid = ensureNewsBlogLayout();
    if (!grid) return;
    ensureNewsDetailModal();
    const items = filteredClientNews();
    grid.innerHTML = '';
    if (!items.length) {
        grid.innerHTML = '<div class="nb-empty"><i class="fas fa-newspaper" style="font-size:2rem; opacity:.4; display:block; margin-bottom:10px;"></i>Không tìm thấy bài viết.</div>';
        return;
    }
    const liked = newsLikedIds();
    items.forEach(n => {
        const id = String(n._id);
        const imgSrc = resolveClientDownloadImage(n.imageUrl);
        const views = n.views || 0;
        const likes = n.likes || 0;
        const comments = n.comments || 0;
        const isLiked = liked.includes(id);
        grid.insertAdjacentHTML('beforeend', `
            <article class="nb-card" onclick="openNewsDetail('${id}')">
                <div class="nb-card-cover">
                    <img src="${escapeClientHtml(imgSrc)}" alt="${escapeClientHtml(n.title)}" onerror="this.src='/src/IMG/default.svg'">
                </div>
                <div class="nb-card-info">
                    <div class="nb-card-date">${escapeClientHtml(n.dateLabel || '')}</div>
                    <h3 class="nb-card-title">${escapeClientHtml(n.title)}</h3>
                    <p class="nb-card-excerpt">${escapeClientHtml(n.description || '')}</p>
                    <div class="nb-card-stats">
                        <span><i class="far fa-eye"></i> ${views}</span>
                        <button type="button" class="nb-like${isLiked ? ' liked' : ''}" onclick="likeNews(event, '${id}')">
                            <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i> ${likes}
                        </button>
                        <span><i class="far fa-comment"></i> ${comments}</span>
                    </div>
                </div>
            </article>`);
    });
}

function filterNewsCategory(cat, btn) {
    currentNewsFilter = cat;
    document.querySelectorAll('.nb-filter').forEach(el => el.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderNewsCards();
}

function handleNewsSearch(value) {
    currentNewsSearch = (value || '').trim();
    renderNewsCards();
}

function openNewsDetail(id) {
    ensureNewsDetailModal();
    const n = allClientNews.find(item => String(item._id) === String(id));
    if (!n) return;
    const modal = document.getElementById('news-detail-modal');
    const img = document.getElementById('news-detail-img');
    const title = document.getElementById('news-detail-title');
    const date = document.getElementById('news-detail-date');
    const body = document.getElementById('news-detail-body');
    const link = document.getElementById('news-detail-link');
    const stats = document.getElementById('news-detail-stats');
    const imgSrc = resolveClientDownloadImage(n.imageUrl);
    if (img) {
        img.style.display = 'block';
        img.src = imgSrc;
        img.alt = n.title || '';
    }
    if (title) title.textContent = n.title || '';
    if (date) date.textContent = n.dateLabel || '';
    if (body) body.textContent = n.content || n.description || '';
    if (link) {
        if (n.linkUrl) {
            link.href = n.linkUrl;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    }
    const liked = newsLikedIds().includes(String(id));
    if (stats) {
        stats.innerHTML = `
            <span><i class="far fa-eye"></i> ${(n.views || 0) + 1}</span>
            <button type="button" class="nb-like${liked ? ' liked' : ''}" onclick="likeNews(event, '${id}')">
                <i class="${liked ? 'fas' : 'far'} fa-heart"></i> ${n.likes || 0}
            </button>
            <span><i class="far fa-comment"></i> ${n.comments || 0}</span>`;
    }
    modal.style.display = 'flex';
    modal.classList.add('show');
    fetch(API_URL + '/news/' + id + '/view', { method: 'POST' }).then(r => r.json()).then(data => {
        const item = allClientNews.find(x => String(x._id) === String(id));
        if (item && data.views != null) item.views = data.views;
        renderNewsCards();
    }).catch(() => {});
}

function closeNewsDetail() {
    const modal = document.getElementById('news-detail-modal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.display = 'none';
}

async function likeNews(event, id) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const liked = newsLikedIds();
    if (liked.includes(String(id))) return;
    try {
        const res = await fetch(API_URL + '/news/' + id + '/like', { method: 'POST' });
        const data = await res.json();
        liked.push(String(id));
        saveNewsLikedIds(liked);
        const item = allClientNews.find(x => String(x._id) === String(id));
        if (item && data.likes != null) item.likes = data.likes;
        renderNewsCards();
        const n = allClientNews.find(x => String(x._id) === String(id));
        const stats = document.getElementById('news-detail-stats');
        if (n && stats && document.getElementById('news-detail-modal').classList.contains('show')) {
            stats.innerHTML = `
                <span><i class="far fa-eye"></i> ${n.views || 0}</span>
                <button type="button" class="nb-like liked" onclick="likeNews(event, '${id}')">
                    <i class="fas fa-heart"></i> ${n.likes || 0}
                </button>
                <span><i class="far fa-comment"></i> ${n.comments || 0}</span>`;
        }
    } catch (e) {}
}

async function fetchClientNews() {
    try {
        const res = await fetch(API_URL + '/news', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        allClientNews = Array.isArray(data) ? data : [];
        renderNewsCards();
    } catch (e) {
        console.error('Lỗi khi tải tin tức:', e);
    }
}

window.openNewsDetail = openNewsDetail;
window.closeNewsDetail = closeNewsDetail;
window.filterNewsCategory = filterNewsCategory;
window.handleNewsSearch = handleNewsSearch;
window.likeNews = likeNews;
