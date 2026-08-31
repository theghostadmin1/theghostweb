/**
 * ============================================================
 *  SỬA BOT CHAT HỖ TRỢ TẠI FILE NÀY (chatbot.js)
 * ============================================================
 *
 *  1) Đổi Zalo / tên bot  →  phần CONFIG bên dưới
 *  2) Đổi câu trả lời cứng →  mảng INTENTS (keywords + reply)
 *  3) Ý định lấy data thật (sản phẩm, tin, số dư...) nằm ở DYNAMIC
 *
 *  Không cần sửa server.js. Sửa xong thì restart: npm start
 * ============================================================
 */

const CONFIG = {
    botName: 'Ghost AI',
    zalo: '0347.784.189',
    facebook: 'https://www.facebook.com/profile.php?id=61585402175537',
    discord: 'https://discord.gg/qczA6fMuP',
    shopName: 'TheGhost'
};

function zaloLine() {
    return `Zalo Admin: <b>${CONFIG.zalo}</b>`;
}

function facebookLine() {
    return `Facebook: <a href="${CONFIG.facebook}" target="_blank" rel="noopener noreferrer">${CONFIG.facebook.replace('https://www.', '')}</a>`;
}

function discordLine() {
    return `Discord: <a href="${CONFIG.discord}" target="_blank" rel="noopener noreferrer">${CONFIG.discord.replace('https://', '')}</a>`;
}

const INTENTS = [
    {
        id: 'greeting',
        keywords: ['xin chào', 'chào bạn', 'chào shop', 'hello', 'hi shop', 'hey', 'chào'],
        reply: () =>
            `Dạ chào bạn, mình là <b>${CONFIG.botName}</b> của ${CONFIG.shopName} ạ.<br>` +
            `Bạn có thể hỏi mình: <b>giá sản phẩm</b>, <b>nạp tiền</b>, <b>đơn hàng</b>, <b>mã giảm giá</b>, <b>tải tool</b> hoặc <b>tin tức</b>.`
    },
    {
        id: 'thanks',
        keywords: ['cảm ơn', 'cam on', 'thanks', 'thank you', 'ok cảm ơn'],
        reply: () => `Dạ không có gì ạ. Cần gì nữa cứ nhắn mình, hoặc alo Admin qua ${zaloLine()} nhé!`
    },
    {
        id: 'hours',
        keywords: ['giờ làm', 'mở cửa', 'bao giờ', '24/7', 'trực'],
        reply: () => `Shop nạp tiền + giao key <b>tự động 24/7</b>. Admin hỗ trợ qua ${zaloLine()}.`
    },
    {
        id: 'topup',
        keywords: ['nạp tiền', 'nạp thẻ', 'chuyển khoản', 'ngân hàng', 'qr', 'sepay', 'mb bank', 'momo', 'nạp'],
        reply: () =>
            `<b>Cách nạp tiền ${CONFIG.shopName}:</b><br>` +
            `1. Bấm nút <b>Nạp tiền</b> trên web<br>` +
            `2. <b>QR MB Bank (SePay)</b>: chuyển đúng nội dung, khoảng 1–10 giây là cộng tiền<br>` +
            `3. <b>Thẻ cào</b>: Viettel / Vina / Mobi — chọn đúng mệnh giá (sai mệnh giá là mất thẻ)<br>` +
            `Nếu lâu không lên tiền, gửi bill + username cho ${zaloLine()}.`
    },
    {
        id: 'coupon',
        keywords: ['mã giảm', 'coupon', 'voucher', 'khuyến mãi', 'giảm giá'],
        reply: () =>
            `Khi mua hàng, ô <b>Mã giảm giá</b> nằm ngay trong form xác nhận mua.<br>` +
            `Nhập mã → bấm <b>Áp dụng</b> → giá sẽ trừ %. Tài khoản Sell thì chiết khấu tự chạy, không cần mã.`
    },
    {
        id: 'buy_guide',
        keywords: ['cách mua', 'mua như nào', 'mua thế nào', 'làm sao mua', 'hướng dẫn mua', 'mua hàng'],
        reply: () =>
            `<b>Mua key tự động:</b><br>` +
            `1. Đăng nhập → nạp tiền<br>` +
            `2. Vào menu <b>Sản phẩm</b>, chọn gói (1 ngày / 3 ngày...)<br>` +
            `3. Bấm <b>Xác nhận mua</b> — key hiện trong <b>Đơn hàng</b> ngay.`
    },
    {
        id: 'key_use',
        keywords: ['dùng key', 'nhập key', 'key ở đâu', 'lấy key', 'key nào'],
        reply: () =>
            `Sau khi mua, vào menu <b>Đơn hàng</b> để copy key.<br>` +
            `Tool/client tải ở mục <b>Tải xuống</b>. Kẹt bước nào thì gửi mã đơn <b>#TG-...</b> cho ${zaloLine()}.`
    },
    {
        id: 'download',
        keywords: ['tải xuống', 'tải tool', 'download', 'file tải', 'client'],
        reply: 'dynamic:downloads'
    },
    {
        id: 'news',
        keywords: ['tin tức', 'thông báo', 'blog', 'hôm nay', 'cập nhật'],
        reply: 'dynamic:news'
    },
    {
        id: 'balance',
        keywords: ['số dư', 'còn bao nhiêu tiền', 'ví', 'tài khoản tôi', 'bao nhiêu tiền'],
        reply: 'dynamic:balance'
    },
    {
        id: 'order',
        keywords: ['đơn hàng', 'lịch sử mua', 'đã mua', 'mã đơn', 'key của tôi'],
        reply: 'dynamic:orders'
    },
    {
        id: 'product',
        keywords: ['sản phẩm', 'bảng giá', 'giá bao nhiêu', 'aimbot', 'bypass', 'tool', 'báo giá', 'giá', 'mua'],
        reply: 'dynamic:products'
    },
    {
        id: 'login',
        keywords: ['đăng nhập', 'đăng ký', 'quên mật khẩu', 'tài khoản'],
        reply: () =>
            `Bấm <b>Đăng nhập</b> góc phải web. Chưa có tài khoản thì <b>Đăng ký</b> (username + email + mật khẩu).<br>` +
            `Quên mật khẩu: nhắn ${zaloLine()} kèm email đã đăng ký.`
    },
    {
        id: 'support',
        keywords: ['hỗ trợ', 'admin', 'zalo', 'liên hệ', 'gặp lỗi', 'báo lỗi', 'lỗi', 'facebook', 'fanpage', 'fb', 'discord'],
        reply: () =>
            `Bạn gửi <b>username</b> + mã đơn <b>#TG-...</b> (nếu có) + ảnh lỗi cho Admin.<br>` +
            `${zaloLine()} — trực hỗ trợ nhanh nhất có thể.<br>` +
            `${facebookLine()}<br>` +
            `${discordLine()}`
    }
];

function normalize(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFC')
        .replace(/\s+/g, ' ')
        .trim();
}

function noMark(text) {
    return normalize(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function escapeReg(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsKeyword(msg, keyword) {
    const m = normalize(msg);
    const k = normalize(keyword);
    const m2 = noMark(msg);
    const k2 = noMark(keyword);
    if (k.length <= 2) {
        const re = new RegExp(`(?:^|\\s)${escapeReg(k)}(?:$|\\s|[?.!,])`);
        return re.test(m) || re.test(m2);
    }
    return m.includes(k) || m2.includes(k2);
}

function pickIntent(message) {
    let best = null;
    let bestScore = 0;
    for (const intent of INTENTS) {
        let score = 0;
        for (const kw of intent.keywords) {
            if (containsKeyword(message, kw)) {
                score += kw.length + (kw.includes(' ') ? 4 : 0);
            }
        }
        if (score > bestScore) {
            bestScore = score;
            best = intent;
        }
    }
    return bestScore > 0 ? best : null;
}

function fallbackReply() {
    return (
        `Mình chưa nắm đúng ý bạn ạ. Bạn hỏi ngắn gọn giúp mình, ví dụ:<br>` +
        `• "giá aimbot" &nbsp;• "cách nạp tiền" &nbsp;• "đơn hàng của tôi"<br>` +
        `• "mã giảm giá" &nbsp;• "tải tool"<br>` +
        `Hoặc chat thẳng Admin: ${zaloLine()}.`
    );
}

async function handleDynamic(kind, ctx) {
    const { Product, News, Download, User, Order, username } = ctx;

    if (kind === 'products') {
        const products = await Product.find({ status: { $ne: 'OFF' } }).sort({ dateAdded: -1 }).limit(12);
        if (!products.length) {
            return 'Kho sản phẩm đang cập nhật, bạn quay lại sau hoặc hỏi Admin nhé.';
        }
        const msg = noMark(ctx.message);
        const matched = products.filter(p => noMark(p.name).split(/\s+/).some(w => w.length > 3 && msg.includes(w)));
        const list = (matched.length ? matched : products)
            .map(p => `• <b>${p.name}</b> — <span style="color:#fbbf24">${Number(p.price || 0).toLocaleString()}đ</span>`)
            .join('<br>');
        const hint = matched.length ? 'Mình thấy sản phẩm gần với câu hỏi của bạn:' : `Kho ${CONFIG.shopName} hiện có:`;
        return `${hint}<br>${list}<br><br>Vào menu <b>Sản phẩm</b> chọn gói rồi bấm mua. Hết key thì báo Admin.`;
    }

    if (kind === 'news') {
        const news = await News.find().sort({ order: 1, _id: -1 }).limit(4);
        if (!news.length) {
            return `Vào menu <b>Tin tức & Blog</b> trên web để xem bài mới nhất nhé.`;
        }
        const lines = news.map(n => `• <b>${n.title}</b>${n.dateLabel ? ` <span style="color:#9ca3af">(${n.dateLabel})</span>` : ''}`).join('<br>');
        return `<b>Bài mới trên shop:</b><br>${lines}<br><br>Bấm vào card ở mục <b>Tin tức & Blog</b> để đọc đầy đủ.`;
    }

    if (kind === 'downloads') {
        const files = await Download.find().sort({ order: 1 }).limit(8);
        if (!files.length) {
            return `Vào menu <b>Tải xuống</b> trên web để lấy client/tool. Nếu trống, báo ${zaloLine()}.`;
        }
        const lines = files.map(d => `• <b>${d.name}</b>${d.tag || d.version ? ` (${d.tag || d.version})` : ''}`).join('<br>');
        return `<b>File đang mở tải:</b><br>${lines}<br><br>Vào <b>Tải xuống</b> để bấm tải / xem video HD.`;
    }

    if (kind === 'balance') {
        if (!username || username === 'guest') {
            return `Bạn cần <b>đăng nhập</b> rồi hỏi lại "số dư" để mình xem ví giúp.`;
        }
        const user = await User.findOne({ username });
        if (!user) return `Không thấy tài khoản <b>${username}</b>. Thử đăng xuất rồi đăng nhập lại nhé.`;
        return `Ví của <b>${user.username}</b> đang còn <span style="color:#fbbf24"><b>${Number(user.balance || 0).toLocaleString()}đ</b></span>. Nạp thêm ở nút <b>Nạp tiền</b>.`;
    }

    if (kind === 'orders') {
        if (!username || username === 'guest') {
            return `Đăng nhập rồi hỏi "đơn hàng" để mình liệt kê key đã mua.`;
        }
        const orders = await Order.find({ username }).sort({ date: -1 }).limit(5);
        if (!orders.length) {
            return `Tài khoản <b>${username}</b> chưa có đơn nào. Vào <b>Sản phẩm</b> để mua key nhé.`;
        }
        const lines = orders.map(o => `• <b>${o.orderId}</b> — ${o.productName} — ${Number(o.price || 0).toLocaleString()}đ`).join('<br>');
        return `Đơn gần đây của <b>${username}</b>:<br>${lines}<br><br>Key nằm trong menu <b>Đơn hàng</b>.`;
    }

    return fallbackReply();
}

async function replyChat({ message, username, models }) {
    const text = String(message || '').trim();
    if (!text) {
        return `Bạn nhập câu hỏi giúp mình với, ví dụ: "giá aimbot" hoặc "cách nạp tiền".`;
    }

    const intent = pickIntent(text);
    if (!intent) return fallbackReply();

    if (typeof intent.reply === 'function') return intent.reply();
    if (typeof intent.reply === 'string' && intent.reply.startsWith('dynamic:')) {
        const kind = intent.reply.slice('dynamic:'.length);
        return handleDynamic(kind, { ...models, username, message: text });
    }
    return String(intent.reply);
}

module.exports = { replyChat, CONFIG, INTENTS };
