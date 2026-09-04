require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ limit: '8mb', extended: true }));
app.use(cors({ origin: false }));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    next();
});

const rateHits = new Map();
function rateLimit(windowMs, max) {
    return (req, res, next) => {
        const ip = String(req.ip || req.socket.remoteAddress || 'unknown');
        const key = ip + ':' + req.method + ':' + req.path;
        const now = Date.now();
        const recent = (rateHits.get(key) || []).filter(t => now - t < windowMs);
        if (recent.length >= max) {
            return res.status(429).json({ success: false, message: 'Thử lại sau ít phút.' });
        }
        recent.push(now);
        rateHits.set(key, recent);
        next();
    };
}

app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    let pathname = req.path || '/';
    try { pathname = decodeURIComponent(pathname); } catch (_) {}
    pathname = pathname.replace(/\\/g, '/').toLowerCase();
    const blocked =
        pathname.includes('/node_modules') ||
        pathname.includes('/.git') ||
        pathname.endsWith('.env') ||
        pathname.endsWith('.map') ||
        pathname.endsWith('.md') ||
        pathname.endsWith('.log') ||
        /(^|\/)(server\.js|chatbot\.js|package\.json|package-lock\.json|protect\.js|\.gitignore|\.env\.example)$/.test(pathname) ||
        /(decoded|preview|backup|_seed_|update_features|update_prods|update_img|mail-thankyou|rendered_admin)/.test(pathname) ||
        /\/(script|admin_script|boot_shop|boot_admin|security)\.js$/.test(pathname);
    if (blocked) return res.status(404).end();
    next();
});

const IMG_DIR = path.join(__dirname, 'Img');
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

app.use(express.static(__dirname, {
    index: false,
    dotfiles: 'deny',
    extensions: ['css', 'js', 'png', 'jpg', 'webp', 'svg']
}));
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/Img', express.static(path.join(__dirname, 'Img')));
app.use('/img', express.static(path.join(__dirname, 'Img')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/bemy', (req, res) => {
    res.sendFile(path.join(__dirname, 'bemy.html'));
});

app.get('/sell', (req, res) => {
    res.sendFile(path.join(__dirname, 'sell.html'));
});

app.get(['/index.html', '/bemy.html', '/sell.html'], (req, res) => {
    if (req.path === '/bemy.html') return res.redirect('/bemy');
    if (req.path === '/sell.html') return res.redirect('/sell');
    res.redirect('/');
});

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || crypto.randomBytes(32).toString('hex');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(32).toString('hex');
if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET_KEY) {
    console.warn('⚠️  Thiếu ADMIN_PASSWORD hoặc ADMIN_SECRET_KEY — đăng nhập admin sẽ không dùng mật khẩu cũ.');
}
const EXPECTED_HMAC = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(ADMIN_PASSWORD).digest('hex');
const adminSessions = new Map();

function requireAdmin(req, res, next) {
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const session = token ? adminSessions.get(token) : null;
    if (!session || session.exp < Date.now()) {
        return res.status(401).json({ success: false, message: 'Phiên admin hết hạn. Đăng nhập lại.' });
    }
    next();
}

app.post('/api/admin/verify-hmac', rateLimit(15 * 60 * 1000, 8), (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu!" });

        const inputHmac = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(password).digest('hex');
        const inputBuf = Buffer.from(inputHmac, 'hex');
        const expectedBuf = Buffer.from(EXPECTED_HMAC, 'hex');
        const matched = inputBuf.length === expectedBuf.length && crypto.timingSafeEqual(inputBuf, expectedBuf);
        if (matched) {
            const token = crypto.randomBytes(32).toString('hex');
            adminSessions.set(token, { exp: Date.now() + 12 * 60 * 60 * 1000 });
            res.status(200).json({ success: true, message: "Xác thực Admin thành công!", token });
        } else {
            res.status(401).json({ success: false, message: "Sai mật khẩu! Báo động xâm nhập trái phép." });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống mã hóa." });
    }
});

app.use('/api/admin', (req, res, next) => {
    if (req.method === 'POST' && req.path === '/verify-hmac') return next();
    return requireAdmin(req, res, next);
});

// ==========================================
// 0. CẤU HÌNH GỬI EMAIL TỰ ĐỘNG
// ==========================================
// Có RESEND_API_KEY → gửi từ noreply@nroghost.com (SPF/DKIM).
// Chưa có key → tạm Gmail SMTP (dễ vào Spam).
const MAIL_USER = process.env.EMAIL_USER || '';
const MAIL_PASS = process.env.EMAIL_PASS || '';
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || '').trim();
const MAIL_FROM_ADDRESS = RESEND_API_KEY
    ? (process.env.EMAIL_FROM || 'noreply@nroghost.com')
    : MAIL_USER;
const MAIL_FROM_NAME = process.env.EMAIL_FROM_NAME
    || (String(MAIL_FROM_ADDRESS).toLowerCase().endsWith('@nroghost.com') ? 'TheGhost Coder' : 'The Ghost');
const MAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || MAIL_USER;
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport(SMTP_HOST ? {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: MAIL_USER, pass: MAIL_PASS },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 1
} : {
    service: 'gmail',
    auth: { user: MAIL_USER, pass: MAIL_PASS },
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 1
});

// ==========================================
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || "theghostweb";
if (!MONGO_URI) {
    console.error("❌ Thiếu MONGO_URI trong file .env — không kết nối database cũ.");
    process.exit(1);
}

mongoose.connect(MONGO_URI, { dbName: MONGO_DB })
    .then(() => {
        console.log(`👉 Đã kết nối MongoDB — database mới: ${MONGO_DB}`);
        seedNewsIfEmpty().catch(err => console.log('Seed tin tức:', err.message));
    })
    .catch(err => console.log("❌ Thất bại kết nối DB: ", err));


// ==========================================
// 2. KHAI BÁO CÁC BẢNG DỮ LIỆU (SCHEMAS)
// ==========================================
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    locked: { type: Boolean, default: false },
    isReseller: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    isVip: { type: Boolean, default: false },
    sellCategories: { type: [String], default: undefined },
    sellProductIds: { type: [String], default: undefined },
    referredBy: { type: String, default: '' }
});
const User = mongoose.model('User', UserSchema);

const SELL_CAT_KEYS = ['cheat', 'acc', 'tool'];
function normalizeSellCategories(list) {
    if (!Array.isArray(list)) return [];
    return SELL_CAT_KEYS.filter(c => list.map(x => String(x || '').toLowerCase()).includes(c));
}
function normalizeSellProductIds(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of list) {
        const id = String(raw || '').trim();
        if (!/^[a-f0-9]{24}$/i.test(id) || seen.has(id)) continue;
        seen.add(id);
        out.push(id);
        if (out.length >= 200) break;
    }
    return out;
}
function publicSellFields(user) {
    return {
        isReseller: !!(user && (user.isReseller || (user.discountPercent > 0))),
        discountPercent: (user && user.discountPercent) || 0,
        isVip: !!(user && user.isVip),
        sellCategories: normalizeSellCategories(user && user.sellCategories),
        sellProductIds: normalizeSellProductIds(user && user.sellProductIds)
    };
}
function sellDiscountOnProduct(user, product) {
    if (!user || !product) return false;
    if (!(user.isReseller || user.discountPercent > 0) || !(user.discountPercent > 0)) return false;
    if (product.isDiscountable === false) return false;
    const pid = String(product._id || '');
    const ids = normalizeSellProductIds(user.sellProductIds);
    if (ids.length) return ids.includes(pid);
    const cats = normalizeSellCategories(user.sellCategories);
    if (cats.length) return cats.includes(product.category);
    return false;
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function isRealGmail(email) {
    return /^[a-z0-9._%+\-]+@(gmail|googlemail)\.com$/.test(normalizeEmail(email));
}

function isValidUsername(username) {
    return /^[A-Za-z0-9_]{3,20}$/.test(String(username || '').trim());
}

function mailFrom() {
    return { name: MAIL_FROM_NAME, address: MAIL_FROM_ADDRESS };
}

function escapeMailHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildThankYouEmail(email, username) {
    const safeUser = escapeMailHtml(username);
    const safeEmail = escapeMailHtml(email);
    const zalo = '0347.784.189';
    const zaloLink = 'https://zalo.me/0347784189';
    const discord = 'https://discord.gg/qczA6fMuP';
    const site = 'https://nroghost.com';
    const font = 'Arial,Helvetica,sans-serif';
    const mailDomain = String(MAIL_FROM_ADDRESS).split('@')[1] || 'nroghost.com';

    const subject = `Chào mừng ${username} — tài khoản TheGhost Coder đã sẵn sàng`;
    const text = [
        `Xin chào ${username},`,
        '',
        'Cảm ơn bạn đã đăng ký TheGhost Coder. Tài khoản đã được tạo và có thể dùng ngay.',
        '',
        `Tên hiển thị: ${username}`,
        `Gmail: ${email}`,
        'Trạng thái: đã kích hoạt',
        'Số dư ban đầu: 0đ',
        'Website: ' + site,
        '',
        'Hướng dẫn bắt đầu:',
        '1. Đăng nhập bằng Gmail và mật khẩu vừa tạo',
        '2. Nạp tiền QR ngân hàng — hệ thống cộng số dư tự động 24/7',
        '3. Mua tool / bot / acc — key hiện ngay trong mục Đơn hàng',
        '4. Tải client ở mục Tải xuống trên website',
        '',
        `Hỗ trợ Admin: Zalo ${zalo} (${zaloLink})`,
        `Discord: ${discord}`,
        '',
        'Nếu bạn không đăng ký tài khoản này, hãy bỏ qua thư.',
        '',
        'TheGhost Coder'
    ].join('\n');

    const step = (n, title, desc) => `
              <tr>
                <td style="padding:0 0 10px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8ff;border:1px solid #eee8ff;border-radius:14px;">
                    <tr>
                      <td width="52" valign="middle" align="center" style="padding:14px 0 14px 14px;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="36" height="36" align="center" valign="middle" style="width:36px;height:36px;background:#7c3aed;border-radius:18px;font-family:${font};font-size:14px;font-weight:bold;color:#ffffff;">${n}</td>
                          </tr>
                        </table>
                      </td>
                      <td style="padding:14px 16px 14px 12px;font-family:${font};">
                        <p style="margin:0 0 3px;font-size:14px;font-weight:bold;color:#1f1235;">${title}</p>
                        <p style="margin:0;font-size:13px;line-height:1.55;color:#6b7280;">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`;

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Chào mừng đến TheGhost Coder</title>
</head>
<body style="margin:0;padding:0;background:#ebe4ff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ebe4ff;padding:28px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ddd4ff;">
        <tr>
          <td style="background:#5b21b6;padding:36px 32px 32px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px;">
              <tr>
                <td width="56" height="56" align="center" valign="middle" style="width:56px;height:56px;background:#7c3aed;border-radius:16px;font-family:${font};font-size:26px;font-weight:bold;color:#ffffff;">G</td>
              </tr>
            </table>
            <p style="margin:0 0 6px;font-family:${font};font-size:11px;letter-spacing:2.2px;font-weight:bold;color:#d8b4fe;">THEGHOST CODER</p>
            <p style="margin:0 0 8px;font-family:${font};font-size:26px;line-height:1.25;font-weight:bold;color:#ffffff;">Tài khoản đã sẵn sàng</p>
            <p style="margin:0;font-family:${font};font-size:15px;line-height:1.6;color:#e9d5ff;">Xin chào ${safeUser}, cảm ơn bạn đã tin tưởng và đăng ký.</p>
          </td>
        </tr>
        <tr>
          <td style="height:5px;background:#a78bfa;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;font-family:${font};font-size:15px;line-height:1.7;color:#4b5563;">
            <p style="margin:0;">Hệ thống đã <strong style="color:#059669;">kích hoạt</strong> tài khoản. Đăng nhập bằng Gmail và mật khẩu vừa tạo để nạp tiền, mua hàng và tải tool tại <a href="${site}" style="color:#7c3aed;font-weight:bold;text-decoration:none;">nroghost.com</a>.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border:1px solid #eee8ff;border-radius:16px;">
              <tr>
                <td style="width:6px;background:#7c3aed;font-size:0;line-height:0;">&nbsp;</td>
                <td style="padding:18px 20px;font-family:${font};">
                  <p style="margin:0 0 14px;font-size:12px;font-weight:bold;color:#7c3aed;letter-spacing:1px;">THÔNG TIN TÀI KHOẢN</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${font};font-size:14px;color:#1f1235;">
                    <tr>
                      <td style="padding:0 0 10px;color:#6b7280;width:38%;">Tên hiển thị</td>
                      <td style="padding:0 0 10px;font-weight:bold;">${safeUser}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-top:1px solid #eee8ff;color:#6b7280;">Gmail</td>
                      <td style="padding:10px 0;border-top:1px solid #eee8ff;font-weight:bold;">${safeEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0;border-top:1px solid #eee8ff;color:#6b7280;">Trạng thái</td>
                      <td style="padding:10px 0;border-top:1px solid #eee8ff;font-weight:bold;color:#047857;">Đã kích hoạt</td>
                    </tr>
                    <tr>
                      <td style="padding:10px 0 0;border-top:1px solid #eee8ff;color:#6b7280;">Số dư</td>
                      <td style="padding:10px 0 0;border-top:1px solid #eee8ff;font-weight:bold;">0đ</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 4px;font-family:${font};">
            <p style="margin:0 0 14px;font-size:16px;font-weight:bold;color:#1f1235;">Bắt đầu sử dụng</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${step('1', 'Đăng nhập', 'Dùng Gmail và mật khẩu vừa tạo trên website nroghost.com.')}
              ${step('2', 'Nạp tiền QR', 'Quét QR ngân hàng, hệ thống cộng số dư tự động 24/7.')}
              ${step('3', 'Mua hàng', 'Tool / bot / acc — key hiện ngay trong mục Đơn hàng.')}
              ${step('4', 'Tải client', 'Vào mục Tải xuống trên website để lấy bản cài.')}
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:20px 32px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#7c3aed" style="background:#7c3aed;border-radius:12px;">
                  <a href="${site}" style="display:inline-block;padding:14px 28px;font-family:${font};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">Mở website nroghost.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#5b21b6;border-radius:14px;">
              <tr>
                <td style="padding:18px 20px;font-family:${font};color:#ffffff;">
                  <p style="margin:0 0 4px;font-size:12px;color:#e9d5ff;">Hỗ trợ Admin 24/7</p>
                  <p style="margin:0 0 6px;font-size:18px;font-weight:bold;">Zalo ${zalo}</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;">
                    <a href="${zaloLink}" style="color:#ffffff;text-decoration:underline;">Nhắn tin Zalo</a>
                    &nbsp;·&nbsp;
                    <a href="${discord}" style="color:#e9d5ff;text-decoration:underline;">Discord</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f5ff;padding:18px 32px;font-family:${font};font-size:12px;line-height:1.7;color:#9ca3af;text-align:center;">
            Nếu bạn không đăng ký tài khoản này, hãy bỏ qua thư.<br>
            TheGhost Coder · nroghost.com · Thư tự động sau khi đăng ký
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

    return { subject, text, html, mailDomain };
}

async function sendViaResend(email, mail) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`,
            to: [email],
            reply_to: MAIL_REPLY_TO,
            subject: mail.subject,
            html: mail.html,
            text: mail.text
        })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(body.message || `Resend HTTP ${res.status}`);
    }
    return body;
}

function sendThankYouMail(email, username) {
    const mail = buildThankYouEmail(email, username);
    if (RESEND_API_KEY) {
        return sendViaResend(email, mail);
    }
    const token = crypto.randomBytes(10).toString('hex');
    return transporter.sendMail({
        from: mailFrom(),
        replyTo: MAIL_REPLY_TO,
        to: email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        encoding: 'utf-8',
        textEncoding: 'quoted-printable',
        xMailer: false,
        messageId: `<reg.${Date.now()}.${token}@${mail.mailDomain}>`,
        headers: {
            'X-Priority': '3',
            Importance: 'Normal'
        }
    });
}
// Schema Quản lý Mã Giảm Giá (Coupons)
const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 }, // % giảm giá
    maxUsage: { type: Number, default: 0 }, // 0 là không giới hạn
    usedCount: { type: Number, default: 0 },
    status: { type: String, default: 'active' }, // active | inactive
    expiresAt: { type: Date },
    dateCreated: { type: Date, default: Date.now }
});
const Coupon = mongoose.model('Coupon', CouponSchema);
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 }, // Giá gốc trước khi giảm (0 nếu không có)
    isDiscountable: { type: Boolean, default: true }, // Có cho phép áp dụng giảm giá / Coupon / Sell hay không
    description: { type: String, default: 'Sản phẩm uy tín, an toàn 100% từ hệ thống TheGhost.' },
    imageUrl: { type: String, default: '' },
    tag: { type: String, default: '' },
    isHot: { type: Boolean, default: false },
    status: { type: String, default: 'ON' },
    dateAdded: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', ProductSchema);

const DownloadSchema = new mongoose.Schema({
    name: { type: String, required: true },

    description: { type: String, default: '' },
    version: { type: String, default: '' },
    url: { type: String, required: true },
    iconClass: { type: String, default: 'fas fa-download' },
    iconColor: { type: String, default: '#3b82f6' },
    imageUrl: { type: String, default: '' },
    tag: { type: String, default: '' },
    fileSize: { type: String, default: '' },
    downloadCount: { type: Number, default: 0 },
    videoUrl: { type: String, default: '' },
    order: { type: Number, default: 0 }
});
const Download = mongoose.model('Download', DownloadSchema);

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    iconClass: { type: String, default: 'fas fa-newspaper' },
    iconColor: { type: String, default: '#8b5cf6' },
    accentColor: { type: String, default: '#8b5cf6' },
    dateLabel: { type: String, default: '' },
    isImportant: { type: Boolean, default: false },
    content: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    category: { type: String, default: 'news' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    order: { type: Number, default: 0 }
});
const News = mongoose.model('News', NewsSchema);

const DEFAULT_NEWS = [
    {
        title: 'Cập nhật Nạp Auto',
        description: 'Hệ thống nạp tiền tự động qua ngân hàng bằng SePay đã chính thức hoạt động ổn định 24/7. Tốc độ xử lý từ 1-5 giây sau khi chuyển khoản.',
        imageUrl: 'https://i.imgur.com/rN5G5h2.jpg',
        iconClass: 'fas fa-check-circle',
        iconColor: '#10b981',
        accentColor: '#10b981',
        dateLabel: '15/06/2026',
        isImportant: false,
        order: 1
    },
    {
        title: 'Aimbot Aurora V2.5',
        description: 'Phiên bản Aimbot Aurora V2.5 đã ra mắt với tính năng Bypass siêu cấp mới. An toàn hơn 99% cho tài khoản chính (Main). Hãy tải bản mới nhất.',
        imageUrl: 'https://i.imgur.com/PZc3X6H.jpg',
        iconClass: 'fas fa-rocket',
        iconColor: '#8b5cf6',
        accentColor: '#8b5cf6',
        dateLabel: '10/06/2026',
        isImportant: false,
        order: 2
    },
    {
        title: 'Lưu ý Thẻ Siêu Tốc',
        description: 'Khi nạp qua thẻ cào điện thoại, quý khách vui lòng chọn đúng Mệnh Giá. Nếu chọn sai mệnh giá, thẻ sẽ bị hủy và không thể hỗ trợ đền bù.',
        imageUrl: 'https://images.unsplash.com/photo-1614064641913-a53b15c8052e?q=80&w=2069&auto=format&fit=crop',
        iconClass: 'fas fa-exclamation-triangle',
        iconColor: '#fbbf24',
        accentColor: '#fbbf24',
        dateLabel: '05/06/2026',
        isImportant: true,
        order: 3
    }
];

async function seedNewsIfEmpty() {
    const count = await News.countDocuments();
    if (count > 0) return;
    await News.insertMany(DEFAULT_NEWS);
    console.log('👉 Đã tạo 3 tin tức mặc định (trang Tin tức & Thông báo).');
}

// Key schema for storing keys associated with products
const KeySchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    duration: { type: String },
    price: { type: Number },
    key: { type: String, required: true },
    status: { type: String, default: 'unsold' },
    buyer: { type: String },
    dateSold: { type: Date },
    orderId: { type: String }
});
const Key = mongoose.model('Key', KeySchema);

const OrderSchema = new mongoose.Schema({
    username: { type: String, required: true },
    orderId: { type: String, required: true },
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    key: { type: String, required: true },
    status: { type: String, default: 'Hoàn thành' },
    date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

const HistorySchema = new mongoose.Schema({
    username: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    desc: { type: String, required: true },
    status: { type: String, default: 'Thành công' },
    date: { type: Date, default: Date.now }
});
const History = mongoose.model('History', HistorySchema);

const SeoPostSchema = new mongoose.Schema({
    username: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
    links: { type: [String], default: [] },
    keys: { type: [String], default: [] },
    published: { type: Boolean, default: true },
    date: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const SeoPost = mongoose.model('SeoPost', SeoPostSchema);

function slugifySeo(input) {
    const base = String(input || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return base || ('bai-' + Date.now().toString(36));
}

function parseLines(value) {
    return String(value || '')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean)
        .slice(0, 50);
}

const sellSessions = new Map();
function requireSell(req, res, next) {
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    const session = token ? sellSessions.get(token) : null;
    if (!session || session.exp < Date.now()) {
        return res.status(401).json({ success: false, message: 'Phiên SELL hết hạn. Đăng nhập lại.' });
    }
    req.sellUser = session.username;
    next();
}

function isSellAccount(user) {
    return !!(user && (user.isReseller || (user.discountPercent > 0)));
}

const balanceSseClients = new Map();

function sseUserKey(username) {
    return String(username || '').trim().toLowerCase();
}

function pushBalanceToUser(username, payload) {
    const clients = balanceSseClients.get(sseUserKey(username));
    if (!clients || !clients.size) return;
    const line = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
        try { client.write(line); } catch (_) {}
    }
}

function extractSepayUsername(body) {
    const blobs = [body.content, body.description, body.code, body.transferContent]
        .filter(Boolean)
        .join(' ');
    const match = String(blobs).match(/TGCODER\s+([A-Za-z0-9_]+)/i);
    return match ? match[1].trim() : '';
}

// ==========================================
// 3. CÁC API DÀNH CHO ADMIN
// ==========================================
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ dateAdded: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- PACKAGE APIs ---

// Lấy danh sách các loại Key (theo thời hạn và giá) của một sản phẩm
app.get('/api/products/:id/packages', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        const basePrice = product ? product.price : 1000;
        
        const allKeys = await Key.find({ productId: req.params.id });
        
        const map = new Map();

        allKeys.forEach(k => {
            const duration = k.duration || '1 Ngày';
            const price = k.price || basePrice;
            const keyStr = duration + '|' + price;
            if (!map.has(keyStr)) {
                map.set(keyStr, {
                    _id: keyStr,
                    name: duration,
                    price: price,
                    originalPrice: 0,
                    stock: 0
                });
            }
            if (k.status === 'unsold') {
                map.get(keyStr).stock++;
            }
        });
        
        let availablePackages = Array.from(map.values()).filter(p => p.stock > 0);
        if (availablePackages.length === 0) {
            availablePackages.push({
                _id: 'TẠM HẾT HÀNG|0',
                name: 'TẠM HẾT HÀNG',
                price: 0,
                originalPrice: 0,
                stock: 0
            });
        }
        res.json(availablePackages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products/:id/keys', requireAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const { keys, duration, price } = req.body;
        if (!Array.isArray(keys) || keys.length === 0) return res.status(400).json({ message: 'No keys provided' });
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const unitPrice = Number(price) || product.price || 0;
        const keyDocs = keys.map(k => ({ productId: product._id, duration: duration || '1 Ngày', price: unitPrice, key: k, status: 'unsold' }));
        await Key.insertMany(keyDocs);
        res.status(201).json({ message: `Đã lưu ${keys.length} key thành công!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products', requireAdmin, async (req, res) => {
    try {
        const { name, category, price, originalPrice, isDiscountable, description, isHot, imageUrl, tag } = req.body;
        const newProduct = new Product({
            name,
            category,
            price: Number(price),
            originalPrice: Number(originalPrice) || 0,
            isDiscountable: isDiscountable !== undefined ? !!isDiscountable : true,
            description,
            isHot: !!isHot,
            imageUrl,
            tag: String(tag || '').trim()
        });
        await newProduct.save();
        res.status(201).json({ message: "Thêm sản phẩm vào Database thành công!", product: newProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        await Key.deleteMany({ productId: req.params.id });
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
    try {
        const updateData = {};
        if (req.body.price !== undefined) updateData.price = Number(req.body.price);
        if (req.body.originalPrice !== undefined) updateData.originalPrice = Number(req.body.originalPrice);
        if (req.body.isDiscountable !== undefined) updateData.isDiscountable = !!req.body.isDiscountable;
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
        if (req.body.category !== undefined) updateData.category = req.body.category;
        if (req.body.isHot !== undefined) updateData.isHot = !!req.body.isHot;
        if (req.body.tag !== undefined) updateData.tag = String(req.body.tag || '').trim();
        
        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.status(200).json({ message: "Cập nhật sản phẩm thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- API DOWNLOADS ---
function listDownloadImages() {
    const files = new Set();
    const dirs = [
        { path: path.join(__dirname, 'Img'), prefix: '/Img/' },
        { path: path.join(__dirname, 'src', 'IMG'), prefix: '/src/IMG/' }
    ];
    dirs.forEach(d => {
        if (fs.existsSync(d.path)) {
            fs.readdirSync(d.path)
                .filter(f => /\.(png|jpe?g|webp|gif|svg)$/i.test(f))
                .forEach(f => files.add(d.prefix + f));
        }
    });
    return Array.from(files);
}

app.get('/api/download-images', (req, res) => {
    try {
        res.status(200).json({ files: listDownloadImages() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/download-images', requireAdmin, (req, res) => {
    try {
        const { filename, data } = req.body || {};
        if (!filename || !data) return res.status(400).json({ message: 'Vui lòng chọn ảnh từ máy.' });
        const safe = path.basename(String(filename)).replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(safe)) {
            return res.status(400).json({ message: 'Chỉ nhận file ảnh: png, jpg, webp, gif, svg.' });
        }
        const base64 = String(data).replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const buf = Buffer.from(base64, 'base64');
        if (!buf.length) return res.status(400).json({ message: 'File ảnh không hợp lệ.' });
        fs.writeFileSync(path.join(IMG_DIR, safe), buf);
        res.status(201).json({ message: 'Đã lưu ảnh vào thư mục Img', imageUrl: '/Img/' + safe, files: listDownloadImages() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/downloads', async (req, res) => {
    try {
        const downloads = await Download.find().sort({ order: 1 });
        res.status(200).json(downloads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/downloads', requireAdmin, async (req, res) => {
    try {
        const newDownload = new Download(req.body);
        await newDownload.save();
        res.status(201).json({ message: "Thêm link tải thành công!", download: newDownload });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.put('/api/downloads/:id', requireAdmin, async (req, res) => {
    try {
        const allowed = ['name', 'url', 'tag', 'version', 'description', 'fileSize', 'downloadCount', 'videoUrl', 'imageUrl', 'iconColor', 'iconClass', 'order'];
        const update = {};
        allowed.forEach(key => {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        });
        const dl = await Download.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
        if (!dl) return res.status(404).json({ message: 'Không tìm thấy mục tải xuống!' });
        res.status(200).json({ message: "Cập nhật link tải thành công!", download: dl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.delete('/api/downloads/:id', requireAdmin, async (req, res) => {
    try {
        await Download.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Xóa link tải thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find().sort({ order: 1, _id: 1 });
        res.status(200).json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/news', requireAdmin, async (req, res) => {
    try {
        const { title, description, imageUrl, iconClass, iconColor, accentColor, dateLabel, isImportant, order, content, linkUrl, category, comments } = req.body;
        if (!title) return res.status(400).json({ message: 'Vui lòng nhập tiêu đề tin!' });
        const item = new News({
            title,
            description: description || '',
            content: content || description || '',
            linkUrl: linkUrl || '',
            imageUrl: imageUrl || '',
            iconClass: iconClass || 'fas fa-newspaper',
            iconColor: iconColor || '#8b5cf6',
            accentColor: accentColor || iconColor || '#8b5cf6',
            dateLabel: dateLabel || '',
            isImportant: !!isImportant,
            category: category === 'blog' ? 'blog' : 'news',
            comments: Number(comments) || 0,
            order: Number(order) || 0
        });
        await item.save();
        res.status(201).json({ message: 'Đã thêm tin tức!', news: item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.put('/api/news/:id', requireAdmin, async (req, res) => {
    try {
        const allowed = ['title', 'description', 'content', 'linkUrl', 'imageUrl', 'iconClass', 'iconColor', 'accentColor', 'dateLabel', 'isImportant', 'order', 'category', 'comments'];
        const update = {};
        allowed.forEach(key => {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        });
        if (update.order !== undefined) update.order = Number(update.order) || 0;
        if (update.isImportant !== undefined) update.isImportant = !!update.isImportant;
        if (update.category !== undefined) update.category = update.category === 'blog' ? 'blog' : 'news';
        if (update.comments !== undefined) update.comments = Number(update.comments) || 0;
        const item = await News.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy tin tức!' });
        res.status(200).json({ message: 'Đã cập nhật tin tức!', news: item });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.delete('/api/news/:id', requireAdmin, async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Đã xóa tin tức!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/news/:id/view', async (req, res) => {
    try {
        const item = await News.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy tin!' });
        res.status(200).json({ views: item.views });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/news/:id/like', async (req, res) => {
    try {
        const item = await News.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        if (!item) return res.status(404).json({ message: 'Không tìm thấy tin!' });
        res.status(200).json({ likes: item.likes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/downloads/:id/hit', async (req, res) => {
    try {
        const dl = await Download.findByIdAndUpdate(req.params.id, { $inc: { downloadCount: 1 } }, { new: true });
        if (!dl) return res.status(404).json({ message: 'Không tìm thấy file tải.' });
        res.status(200).json({ downloadCount: dl.downloadCount, url: dl.url });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy danh sách lịch sử nạp tiền (cho Admin)
app.get('/api/admin/topups', async (req, res) => {
    try {
        const topups = await History.find({
            type: { $in: ["Nạp Tiền (SePay)", "Cộng Tiền (Admin)", "Nạp Thẻ"] }
        }).sort({ date: -1 });
        res.json(topups);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy danh sách đơn hàng cho Admin
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Lấy danh sách kho Key tổng hợp cho Admin (từ collection Key độc lập)
app.get('/api/admin/inventory', async (req, res) => {
    try {
        const allKeys = await Key.find().populate('productId').sort({ _id: -1 });

        let inventory = [];

        allKeys.forEach(k => {
            let durationName = k.duration ? ` - ${k.duration}` : "";
            let finalPrice = k.price || (k.productId ? k.productId.price : 0);
            
            inventory.push({
                _id: k._id,
                productId: k.productId ? k.productId._id : null,
                productName: k.productId ? k.productId.name + durationName : "N/A",
                key: k.key,
                duration: k.duration,
                price: finalPrice,
                status: k.status,
                buyer: k.buyer,
                dateSold: k.dateSold
            });
        });
        
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Import Keys by Admin
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ _id: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// THÊM API XÓA KHO KEY VÀ ĐƠN HÀNG (BỔ SUNG)
// ==========================================
app.delete('/api/admin/keys/:id', async (req, res) => {
    try {
        await Key.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa Key thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/admin/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa Đơn hàng thành công!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// Lấy dữ liệu thống kê tổng quan (Admin Dashboard)
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();

        // Tính tổng doanh thu từ tất cả các đơn hàng
        const orders = await Order.find();
        const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);

        res.status(200).json({
            totalUsers,
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin cộng/trừ tiền thành viên
app.put('/api/admin/users/:username/balance', async (req, res) => {
    try {
        const { amount, type } = req.body;
        const username = req.params.username;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "Không tìm thấy user!" });

        let parsedAmount = parseInt(amount);
        if (type === 'deduct') {
            if (user.balance < parsedAmount) {
                return res.status(400).json({ message: "Số dư ví của khách hàng không đủ để trừ!" });
            }
            user.balance -= parsedAmount;
        } else {
            user.balance += parsedAmount;
        }
        await user.save();

        const actionText = type === 'add' ? "Cộng Tiền (Admin)" : "Trừ Tiền (Admin)";
        const historyAmount = type === 'add' ? parsedAmount : -parsedAmount;
        const newHistory = new History({ username, type: actionText, amount: historyAmount, desc: "Được điều chỉnh bởi Quản trị viên" });
        await newHistory.save();

        res.status(200).json({ message: `Đã ${type === 'add' ? 'cộng' : 'trừ'} ${parsedAmount.toLocaleString()}đ thành công!`, newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin khóa tài khoản
app.put('/api/admin/users/:username/lock', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOneAndUpdate({ username }, { locked: true }, { new: true });
        if (!user) return res.status(404).json({ message: "Không tìm thấy user!" });
        res.status(200).json({ message: `Đã khóa tài khoản ${username} thành công!` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// --- API QUẢN LÝ MÃ GIẢM GIÁ (COUPONS) ---
// ==========================================
app.get('/api/admin/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ dateCreated: -1 });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/coupons', async (req, res) => {
    try {
        const { code, discountPercent, maxUsage, expiresAt } = req.body;
        if (!code || !discountPercent) return res.status(400).json({ message: "Vui lòng nhập đầy đủ mã và % giảm giá!" });
        
        const cleanCode = String(code).trim().toUpperCase();
        const existing = await Coupon.findOne({ code: cleanCode });
        if (existing) return res.status(400).json({ message: "Mã giảm giá này đã tồn tại!" });

        const newCoupon = new Coupon({
            code: cleanCode,
            discountPercent: Math.min(100, Math.max(1, Number(discountPercent))),
            maxUsage: Number(maxUsage) || 0,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });
        await newCoupon.save();
        res.status(201).json({ message: "Tạo mã giảm giá thành công!", coupon: newCoupon });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/admin/coupons/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: 'Không tìm thấy mã giảm giá!' });
        coupon.status = req.body.status === 'inactive' ? 'inactive' : 'active';
        await coupon.save();
        res.status(200).json({
            message: coupon.status === 'active' ? 'Đã bật mã giảm giá!' : 'Đã tạm tắt mã giảm giá!',
            coupon
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/admin/coupons/:id', async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Xóa mã giảm giá thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API Kiểm tra mã giảm giá dành cho Client
app.post('/api/coupons/check', async (req, res) => {
    try {
        const { code, username } = req.body;
        if (!code) return res.status(400).json({ message: "Vui lòng nhập mã!" });
        
        const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), status: 'active' });
        if (!coupon) return res.status(404).json({ message: "Mã giảm giá không tồn tại hoặc đã hết hạn!" });

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn sử dụng!" });
        }
        if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage) {
            return res.status(400).json({ message: "Mã giảm giá đã hết số lượt sử dụng!" });
        }

        res.status(200).json({
            valid: true,
            code: coupon.code,
            discountPercent: coupon.discountPercent,
            message: `Áp dụng mã ${coupon.code} thành công! Giảm ${coupon.discountPercent}%.`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==========================================
// --- API QUẢN LÝ TÀI KHOẢN SELL / ĐẠI LÝ ---
// ==========================================
app.put('/api/admin/users/:username/reseller', async (req, res) => {
    try {
        const username = req.params.username;
        const { isReseller, discountPercent, sellCategories, sellProductIds } = req.body;
        let percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
        let active = !!isReseller;
        if (percent > 0) active = true;
        if (active && percent <= 0) percent = 10;
        let cats = [];
        let productIds = [];
        if (active) {
            productIds = normalizeSellProductIds(sellProductIds);
            if (productIds.length) {
                const products = await Product.find({ _id: { $in: productIds } }).select('_id category isDiscountable').lean();
                productIds = products
                    .filter(p => p.isDiscountable !== false)
                    .map(p => String(p._id));
                cats = normalizeSellCategories(products.map(p => p.category));
            } else {
                cats = normalizeSellCategories(sellCategories);
            }
            if (!productIds.length && !cats.length) {
                return res.status(400).json({ message: 'Chọn ít nhất 1 sản phẩm được giảm giá cho SELL!' });
            }
        }

        const escaped = String(username).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOneAndUpdate(
            { username: { $regex: new RegExp(`^${escaped}$`, 'i') } },
            { isReseller: active, discountPercent: percent, sellCategories: cats, sellProductIds: productIds },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng!" });
        
        const label = productIds.length
            ? (productIds.length + ' sản phẩm')
            : (cats.length ? cats.join(', ') : 'không sản phẩm');
        const msg = active
            ? `Đã nâng cấp ${user.username} thành SELL ${percent}% — ${label}`
            : `Đã chuyển ${user.username} về tài khoản Thường!`;
        res.status(200).json({ message: msg, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/admin/users/:username/vip', async (req, res) => {
    try {
        const username = req.params.username;
        const active = !!req.body.isVip;
        const escaped = String(username).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOneAndUpdate(
            { username: { $regex: new RegExp(`^${escaped}$`, 'i') } },
            { isVip: active },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng!" });
        res.status(200).json({
            message: active ? `Đã cấp logo VIP cho ${user.username}!` : `Đã gỡ VIP của ${user.username}.`,
            user
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin mở khóa tài khoản
app.put('/api/admin/users/:username/unlock', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOneAndUpdate({ username }, { locked: false }, { new: true });
        if (!user) return res.status(404).json({ message: "Không tìm thấy user!" });
        res.status(200).json({ message: `Đã mở khóa tài khoản ${username} thành công!` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// 4. CÁC API DÀNH CHO CLIENT & CHATBOT
// ==========================================
app.post('/api/chat', rateLimit(60 * 1000, 40), async (req, res) => {
    try {
        const { replyChat } = require('./chatbot');
        const reply = await replyChat({
            message: req.body && req.body.message,
            username: req.body && req.body.username,
            models: { Product, News, Download, User, Order, Coupon }
        });
        res.status(200).json({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Hệ thống AI đang tạm mất kết nối, bạn thử lại sau nhé!" });
    }
});

app.get('/api/balance-stream/:username', (req, res) => {
    const username = req.params.username;
    if (!username || username === 'guest') return res.status(400).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
    res.write(': connected\n\n');

    const key = sseUserKey(username);
    if (!balanceSseClients.has(key)) balanceSseClients.set(key, new Set());
    balanceSseClients.get(key).add(res);

    const ping = setInterval(() => {
        try { res.write(': ping\n\n'); } catch (_) { clearInterval(ping); }
    }, 15000);

    req.on('close', () => {
        clearInterval(ping);
        const set = balanceSseClients.get(key);
        if (!set) return;
        set.delete(res);
        if (!set.size) balanceSseClients.delete(key);
    });
});

app.get('/api/user-data/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const escaped = String(username).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ username: { $regex: new RegExp(`^${escaped}$`, 'i') } })
            .select('username balance isReseller discountPercent isVip sellCategories')
            .lean();
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng!" });

        if (req.query.lite === '1') {
            return res.status(200).json({ balance: user.balance });
        }

        const orders = await Order.find({ username: user.username }).sort({ date: -1 }).lean();
        const history = await History.find({ username: user.username }).sort({ date: -1 }).lean();

        res.status(200).json({
            balance: user.balance,
            ...publicSellFields(user),
            orders: orders,
            history: history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API MUA HÀNG & LƯU LỊCH SỬ THẬT
app.post('/api/buy', rateLimit(60 * 1000, 20), async (req, res) => {
    try {
        const { username, productName, packageId, quantity, couponCode } = req.body;
        const buyQuantity = parseInt(quantity) || 1;
        if (buyQuantity <= 0) return res.status(400).json({ message: "Số lượng không hợp lệ!" });

        const escapedBuyUser = String(username || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ username: { $regex: new RegExp(`^${escapedBuyUser}$`, 'i') } });
        if (!user) return res.status(404).json({ message: "Vui lòng đăng nhập lại!" });
        if (user.locked) return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa!" });

        const product = await Product.findOne({ name: productName });
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại!" });

        let queryCondition = { productId: product._id, status: 'unsold' };
        let pkgName = "";
        let pkgPrice = null;

        if (packageId) {
            const parts = String(packageId).split('|');
            if (parts[0] === 'TẠM HẾT HÀNG') {
                return res.status(400).json({ message: "Sản phẩm hiện đang tạm hết hàng!" });
            }
            if (parts[0]) {
                pkgName = " - " + parts[0];
                queryCondition.duration = parts[0];
            }
            if (parts.length >= 2 && parts[1] !== '') {
                const parsed = Number(parts[1]);
                if (!Number.isNaN(parsed)) pkgPrice = parsed;
            }
        }

        if (pkgPrice !== null) {
            if (pkgPrice === product.price) {
                queryCondition.$or = [{ price: pkgPrice }, { price: 0 }, { price: null }, { price: { $exists: false } }];
            } else {
                queryCondition.price = pkgPrice;
            }
        }

        const reserved = [];
        for (let i = 0; i < buyQuantity; i++) {
            const taken = await Key.findOneAndUpdate(
                queryCondition,
                { $set: { status: 'sold', buyer: username, dateSold: new Date() } },
                { new: true }
            );
            if (!taken) {
                if (reserved.length) {
                    await Key.updateMany(
                        { _id: { $in: reserved.map(k => k._id) } },
                        { $set: { status: 'unsold' }, $unset: { buyer: 1, dateSold: 1, orderId: 1 } }
                    );
                }
                return res.status(400).json({ message: `Sản phẩm hiện đang tạm hết key (Chỉ còn ${reserved.length} key). Vui lòng liên hệ Admin!` });
            }
            reserved.push(taken);
        }

        let basePrice = product.price;
        if (pkgPrice !== null && pkgPrice > 0) {
            basePrice = pkgPrice;
        } else if (reserved[0].price) {
            basePrice = reserved[0].price;
        }

        let rawTotal = basePrice * buyQuantity;
        let discountPercent = 0;
        let discountDesc = '';
        let couponDoc = null;

        const canDiscount = product.isDiscountable !== false;

        if (canDiscount) {
            if (sellDiscountOnProduct(user, product)) {
                discountPercent = user.discountPercent;
                discountDesc = ` (Đại lý Sell giảm ${discountPercent}%)`;
            }

            if (couponCode) {
                const cCode = String(couponCode).trim().toUpperCase();
                const foundCoupon = await Coupon.findOne({ code: cCode, status: 'active' });
                if (foundCoupon) {
                    const notExpired = !foundCoupon.expiresAt || new Date(foundCoupon.expiresAt) >= new Date();
                    const hasUses = !foundCoupon.maxUsage || foundCoupon.usedCount < foundCoupon.maxUsage;
                    if (notExpired && hasUses && foundCoupon.discountPercent > discountPercent) {
                        discountPercent = foundCoupon.discountPercent;
                        discountDesc = ` (Mã ${foundCoupon.code} giảm ${discountPercent}%)`;
                        couponDoc = foundCoupon;
                    }
                }
            }
        }

        let totalCost = rawTotal;
        if (discountPercent > 0) {
            totalCost = Math.round(rawTotal * (100 - discountPercent) / 100);
        }

        const paidUser = await User.findOneAndUpdate(
            { username: user.username, locked: { $ne: true }, balance: { $gte: totalCost } },
            { $inc: { balance: -totalCost } },
            { new: true }
        );

        if (!paidUser) {
            await Key.updateMany(
                { _id: { $in: reserved.map(k => k._id) } },
                { $set: { status: 'unsold' }, $unset: { buyer: 1, dateSold: 1, orderId: 1 } }
            );
            return res.status(400).json({ message: "Số dư không đủ. Vui lòng nạp thêm!" });
        }

        // Cập nhật số lần dùng của Coupon
        if (couponDoc) {
            await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: 1 } });
        }

        const orderId = "#TG-" + Math.floor(10000 + Math.random() * 90000);
        const boughtKeys = reserved.map(k => k.key).join('\n');

        await Key.updateMany(
            { _id: { $in: reserved.map(k => k._id) } },
            { $set: { orderId } }
        );

        const newOrder = new Order({ 
            username, 
            orderId, 
            productName: productName + pkgName + discountDesc, 
            price: totalCost, 
            key: boughtKeys 
        });
        await newOrder.save();

        const newHistory = new History({ username, type: "Mua Hàng", amount: -totalCost, desc: `Thanh toán: ${productName}${pkgName} x${buyQuantity}` });
        await newHistory.save();

        res.status(200).json({ message: "Mua hàng thành công! Key đã được lưu trong Đơn Hàng.", balance: paidUser.balance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/register', rateLimit(15 * 60 * 1000, 6), async (req, res) => {
    try {
        const username = String(req.body.username || '').trim();
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        if (!isValidUsername(username)) {
            return res.status(400).json({ message: "Username 3-20 ký tự, chỉ chữ/số/_ !" });
        }
        if (!isRealGmail(email)) {
            return res.status(400).json({ message: "Vui lòng dùng Gmail thật (@gmail.com)!" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu tối thiểu 6 ký tự!" });
        }

        const exists = await User.findOne({
            $or: [
                { email },
                { username: { $regex: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
        });
        if (exists) return res.status(400).json({ message: "Tài khoản hoặc Gmail đã tồn tại!" });

        let referredBy = '';
        const rawRef = String(req.body.referredBy || '').trim();
        if (isValidUsername(rawRef) && rawRef.toLowerCase() !== username.toLowerCase()) {
            const referrer = await User.findOne({
                username: { $regex: new RegExp(`^${rawRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
            if (referrer && isSellAccount(referrer)) referredBy = referrer.username;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, balance: 0, referredBy });
        await newUser.save();

        sendThankYouMail(email, username).catch(err => console.log("Lỗi gửi mail cảm ơn:", err));

        res.status(201).json({ message: "Đăng ký thành công! Đã gửi mail cảm ơn về Gmail của bạn.", username, balance: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/login', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
    try {
        const { password } = req.body;
        const email = normalizeEmail(req.body.email);
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Tài khoản không tồn tại!" });

        if (user.locked) {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Admin." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

        res.status(200).json({
            message: "Đăng nhập thành công!",
            username: user.username,
            balance: user.balance,
            ...publicSellFields(user)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/topup-card', async (req, res) => {
    const { type, amount, serial, code, userId } = req.body;
    const TST_API_KEY = "MÃ_API_KEY_THE_SIEU_TOC_CỦA_BẠN";
    const TST_PARTNER_ID = "MÃ_PARTNER_ID_CỦA_BẠN";
    const request_id = Math.floor(Math.random() * 99999999);

    const payload = {
        telco: type, code: code, serial: serial, amount: amount,
        request_id: request_id.toString(), partner_id: TST_PARTNER_ID,
        sign: md5(TST_API_KEY + code + serial)
    };

    try {
        const tstResponse = await fetch("https://thesieutoc.com/api/card-auto", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        const tstData = await tstResponse.json();

        if (tstData.status === 1) {
            const parsedAmount = parseInt(amount) || 0;
            await User.findOneAndUpdate({ username: userId }, { $inc: { balance: parsedAmount } });
            const h = new History({ username: userId, type: "Nạp Thẻ", amount: parsedAmount, desc: `${type} - ${serial}`, status: 'Thành công' });
            await h.save();
            return res.status(200).json({ message: "Nạp thẻ thành công!" });
        } else if (tstData.status === 99) {
            const h = new History({ username: userId, type: "Nạp Thẻ", amount: parseInt(amount) || 0, desc: `${type} - ${serial}`, status: 'Chờ xử lý' });
            await h.save();
            return res.status(200).json({ message: "Thẻ đã đẩy lên cổng, đang chờ xử lý!" });
        } else {
            const h = new History({ username: userId, type: "Nạp Thẻ", amount: parseInt(amount) || 0, desc: `${type} - ${serial}`, status: 'Thất bại' });
            await h.save();
            return res.status(400).json({ message: tstData.message || "Thẻ cào không hợp lệ." });
        }
    } catch (error) {
        return res.status(500).json({ message: "Không kết nối được cổng gạch thẻ. Vui lòng thử lại sau." });
    }
});

app.post('/api/sepay-webhook', async (req, res) => {
    try {
        const { transferAmount } = req.body;
        const username = extractSepayUsername(req.body);
        if (!username) return res.status(400).send("Không tìm thấy user.");

        const amount = parseFloat(transferAmount);
        if (!amount || amount <= 0) return res.status(400).send("Số tiền không hợp lệ.");

        const escaped = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({ username: { $regex: new RegExp(`^${escaped}$`, "i") } });
        if (!user) return res.status(400).send("Không tìm thấy user.");

        const recentDup = await History.findOne({
            username: user.username,
            type: "Nạp Tiền (SePay)",
            amount: amount,
            date: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
        });
        if (recentDup) {
            pushBalanceToUser(user.username, { balance: user.balance, credited: 0 });
            return res.status(200).json({ success: true, message: "Giao dịch đã được ghi nhận." });
        }

        user.balance += amount;
        await user.save();
        const newHistory = new History({ username: user.username, type: "Nạp Tiền (SePay)", amount: amount, desc: `Nạp tự động MB Bank` });
        await newHistory.save();
        pushBalanceToUser(user.username, { balance: user.balance, credited: amount });
        return res.status(200).json({ success: true, message: "Cộng tiền tự động thành công!" });
    } catch (error) {
        res.status(500).send("Lỗi xử lý Webhook.");
    }
});


function md5(string) {
    return require('crypto').createHash('md5').update(string).digest('hex');
}

app.post('/api/sell/login', rateLimit(15 * 60 * 1000, 10), async (req, res) => {
    try {
        const password = String(req.body.password || '');
        const email = normalizeEmail(req.body.email);
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại!' });
        if (user.locked) return res.status(403).json({ message: 'Tài khoản đã bị khóa!' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Sai mật khẩu!' });
        if (!isSellAccount(user)) {
            return res.status(403).json({ message: 'Tài khoản chưa được cấp SELL. Liên hệ Admin.' });
        }
        const token = crypto.randomBytes(32).toString('hex');
        sellSessions.set(token, { username: user.username, exp: Date.now() + 12 * 60 * 60 * 1000 });
        res.status(200).json({
            token,
            username: user.username,
            balance: user.balance,
            ...publicSellFields(user)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/sell/me', requireSell, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.sellUser }).select('-password').lean();
        if (!user || !isSellAccount(user)) {
            return res.status(403).json({ message: 'Tài khoản không còn quyền SELL.' });
        }
        const [orderCount, postCount, referralCount] = await Promise.all([
            Order.countDocuments({ username: user.username }),
            SeoPost.countDocuments({ username: user.username }),
            User.countDocuments({ referredBy: user.username })
        ]);
        const sell = publicSellFields(user);
        let sellProducts = [];
        if (sell.sellProductIds.length) {
            sellProducts = await Product.find({ _id: { $in: sell.sellProductIds } })
                .select('name category')
                .lean();
        }
        res.status(200).json({
            username: user.username,
            email: user.email,
            balance: user.balance,
            ...sell,
            sellProducts: sellProducts.map(p => ({
                id: String(p._id),
                name: p.name,
                category: p.category
            })),
            orderCount,
            postCount,
            referralCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/sell/orders', requireSell, async (req, res) => {
    try {
        const orders = await Order.find({ username: req.sellUser })
            .sort({ date: -1 })
            .limit(15)
            .select('orderId productName price status date')
            .lean();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/sell/referrals', requireSell, async (req, res) => {
    try {
        const users = await User.find({ referredBy: req.sellUser })
            .select('username balance isVip')
            .sort({ _id: -1 })
            .limit(50)
            .lean();
        res.status(200).json(users.map(u => ({
            username: u.username,
            balance: u.balance || 0,
            isVip: !!u.isVip
        })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/sell/posts', requireSell, async (req, res) => {
    try {
        const posts = await SeoPost.find({ username: req.sellUser }).sort({ date: -1 }).lean();
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/sell/posts', requireSell, rateLimit(15 * 60 * 1000, 20), async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        if (!title) return res.status(400).json({ message: 'Nhập tiêu đề bài viết!' });
        let slug = slugifySeo(req.body.slug || title);
        const exists = await SeoPost.findOne({ slug });
        if (exists) slug = slug + '-' + Date.now().toString(36);
        const post = await SeoPost.create({
            username: req.sellUser,
            title,
            slug,
            description: String(req.body.description || '').trim().slice(0, 300),
            content: String(req.body.content || '').trim().slice(0, 20000),
            links: parseLines(req.body.links),
            keys: parseLines(req.body.keys),
            published: req.body.published !== false
        });
        res.status(201).json({ message: 'Đã đăng bài SEO!', post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/sell/posts/:id', requireSell, async (req, res) => {
    try {
        const post = await SeoPost.findOne({ _id: req.params.id, username: req.sellUser });
        if (!post) return res.status(404).json({ message: 'Không tìm thấy bài!' });
        if (req.body.title !== undefined) post.title = String(req.body.title || '').trim();
        if (req.body.description !== undefined) post.description = String(req.body.description || '').trim().slice(0, 300);
        if (req.body.content !== undefined) post.content = String(req.body.content || '').trim().slice(0, 20000);
        if (req.body.links !== undefined) post.links = parseLines(req.body.links);
        if (req.body.keys !== undefined) post.keys = parseLines(req.body.keys);
        if (req.body.published !== undefined) post.published = !!req.body.published;
        if (req.body.slug) {
            let slug = slugifySeo(req.body.slug);
            const clash = await SeoPost.findOne({ slug, _id: { $ne: post._id } });
            if (!clash) post.slug = slug;
        }
        post.updatedAt = new Date();
        await post.save();
        res.status(200).json({ message: 'Đã cập nhật bài!', post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/sell/posts/:id', requireSell, async (req, res) => {
    try {
        const deleted = await SeoPost.findOneAndDelete({ _id: req.params.id, username: req.sellUser });
        if (!deleted) return res.status(404).json({ message: 'Không tìm thấy bài!' });
        res.status(200).json({ message: 'Đã xóa bài.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

function renderSeoPage(post, origin) {
    const title = escapeMailHtml(post.title);
    const desc = escapeMailHtml(post.description || post.title);
    const body = escapeMailHtml(post.content).replace(/\n/g, '<br>');
    const links = (post.links || []).map(u => {
        const safe = escapeMailHtml(u);
        const href = /^https?:\/\//i.test(u) ? u : '#';
        return `<li><a href="${escapeMailHtml(href)}" rel="nofollow noopener" target="_blank">${safe}</a></li>`;
    }).join('');
    const keys = (post.keys || []).map(k => `<li><code>${escapeMailHtml(k)}</code></li>`).join('');
    const url = origin + '/p/' + post.slug;
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | TheGhost Coder</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${escapeMailHtml(url)}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<style>
body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#060608;color:#eee;line-height:1.65}
.wrap{max-width:760px;margin:0 auto;padding:28px 18px 80px}
a{color:#c4b5fd} .muted{color:#9ca3af;font-size:.9rem}
h1{font-size:1.8rem;margin:8px 0 12px}
.box{background:#121218;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px;margin:16px 0}
code{background:#0d0d14;padding:2px 8px;border-radius:6px;color:#fbbf24}
ul{padding-left:18px} .top a{color:#a78bfa;text-decoration:none;font-weight:700}
</style>
</head>
<body>
<div class="wrap">
<p class="top"><a href="/">← TheGhost Coder</a></p>
<p class="muted">Đăng bởi ${escapeMailHtml(post.username)} · ${new Date(post.date).toLocaleDateString('vi-VN')}</p>
<h1>${title}</h1>
<p>${desc}</p>
<div class="box">${body || '<p class="muted">Chưa có nội dung.</p>'}</div>
${links ? `<div class="box"><h2>Liên kết</h2><ul>${links}</ul></div>` : ''}
${keys ? `<div class="box"><h2>Key</h2><ul>${keys}</ul></div>` : ''}
<p class="muted"><a href="/sell">Cổng đại lý SELL</a> · <a href="/">Mua hàng</a></p>
</div>
</body></html>`;
}

app.get('/p/:slug', async (req, res) => {
    try {
        const post = await SeoPost.findOne({ slug: String(req.params.slug || '').toLowerCase(), published: true }).lean();
        if (!post) return res.status(404).send('Không tìm thấy bài viết.');
        const origin = (req.protocol + '://' + req.get('host'));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(renderSeoPage(post, origin));
    } catch (error) {
        res.status(500).send('Lỗi tải bài viết.');
    }
});

app.get('/sitemap.xml', async (req, res) => {
    try {
        const origin = req.protocol + '://' + req.get('host');
        const posts = await SeoPost.find({ published: true }).select('slug updatedAt').lean();
        const urls = [
            `<url><loc>${origin}/</loc></url>`,
            `<url><loc>${origin}/sell</loc></url>`,
            ...posts.map(p => `<url><loc>${origin}/p/${p.slug}</loc><lastmod>${new Date(p.updatedAt || Date.now()).toISOString()}</lastmod></url>`)
        ];
        res.setHeader('Content-Type', 'application/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
    } catch (error) {
        res.status(500).end();
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Hệ thống lõi Server chạy tại port ${PORT}`);
    if (RESEND_API_KEY) {
        console.log(`✉️  Mail: Resend → ${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`);
    } else {
        console.log('✉️  Mail: Gmail SMTP (thêm RESEND_API_KEY để gửi từ nroghost.com)');
    }
});