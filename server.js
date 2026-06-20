require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// BẢO MẬT URL: PHÂN PHỐI FILE TĨNH VÀ GIẤU ĐUÔI .HTML
// ==========================================
// Chặn truy cập trực tiếp file .html nhưng vẫn cho phép tải css, js, ảnh
app.use(express.static(__dirname, {
    index: false,
    extensions: ['css', 'js', 'png', 'jpg']
}));

// Route Trang Chủ (domain.com/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route Trang Quản Trị (domain.com/bemy)
app.get('/bemy', (req, res) => {
    res.sendFile(path.join(__dirname, 'bemy.html'));
});

// ==========================================
// BẢO MẬT ADMIN BẰNG THUẬT TOÁN BĂM HMAC
// ==========================================
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "TheGhostAdminSuperSecretKey_2026";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "theghostadmin04012002"; // Bạn có thể đổi mật khẩu tại đây
const EXPECTED_HMAC = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(ADMIN_PASSWORD).digest('hex');

app.post('/api/admin/verify-hmac', (req, res) => {
    try {
        const { password } = req.body;
        if (!password) return res.status(400).json({ success: false, message: "Vui lòng nhập mật khẩu!" });

        // Tạo mã băm HMAC từ mật khẩu người dùng nhập vào
        const inputHmac = crypto.createHmac('sha256', ADMIN_SECRET_KEY).update(password).digest('hex');

        // So sánh mã băm một cách an toàn (tránh Timing Attack)
        if (inputHmac === EXPECTED_HMAC) {
            res.status(200).json({ success: true, message: "Xác thực Admin thành công!", token: inputHmac });
        } else {
            res.status(401).json({ success: false, message: "Sai mật khẩu! Báo động xâm nhập trái phép." });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Lỗi hệ thống mã hóa." });
    }
});

// ==========================================
// 0. CẤU HÌNH GỬI EMAIL TỰ ĐỘNG
// ==========================================
// Vui lòng thay thế YOUR_GMAIL và YOUR_APP_PASSWORD bằng thông tin thật
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'Theghostgame300@gmail.com', // Thay bằng Gmail của bạn
        pass: process.env.EMAIL_PASS || 'ayhfxpwabgsgolqc'     // Thay bằng Mật khẩu ứng dụng (App Password)
    }
});

// ==========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://theghost:u1Hyw25y5bZWPADW@cluster0.jzucovy.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
    .then(() => console.log("👉 Cơ sở dữ liệu MongoDB Atlas đã kết nối thành công!"))
    .catch(err => console.log("❌ Thất bại kết nối DB: ", err));


// ==========================================
// 2. KHAI BÁO CÁC BẢNG DỮ LIỆU (SCHEMAS)
// ==========================================
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    locked: { type: Boolean, default: false }
});
const User = mongoose.model('User', UserSchema);
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: 'Sản phẩm uy tín, an toàn 100% từ hệ thống TheGhost.' },
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
    order: { type: Number, default: 0 }
});
const Download = mongoose.model('Download', DownloadSchema);

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
    date: { type: Date, default: Date.now }
});
const History = mongoose.model('History', HistorySchema);


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
        
        const defaultDurations = [
            { dur: '1 Ngày', multiplier: 1 },
            { dur: '3 Ngày', multiplier: 3 },
            { dur: '7 Ngày', multiplier: 7 },
            { dur: '14 Ngày', multiplier: 14 },
            { dur: '1 Tháng', multiplier: 30 },
            { dur: 'Vĩnh viễn', multiplier: 100 }
        ];
        
        const map = new Map();
        
        defaultDurations.forEach(d => {
            const price = basePrice * d.multiplier;
            const keyStr = d.dur + '|' + price;
            map.set(keyStr, {
                _id: keyStr,
                name: d.dur,
                price: price,
                originalPrice: 0,
                stock: 0
            });
        });

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

// Get all keys for a product
app.get('/api/products/:id/keys', async (req, res) => {
    try {
        const productId = req.params.id;
        const keys = await Key.find({ productId }).select('key -_id');
        res.status(200).json({ keys: keys.map(k => k.key) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products/:id/keys', async (req, res) => {
    try {
        const productId = req.params.id;
        const { keys, duration, price } = req.body;
        if (!Array.isArray(keys) || keys.length === 0) return res.status(400).json({ message: 'No keys provided' });
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        const keyDocs = keys.map(k => ({ productId: product._id, duration: duration || '1 Ngày', price: Number(price) || 0, key: k, status: 'unsold' }));
        await Key.insertMany(keyDocs);
        res.status(201).json({ message: 'Keys saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, category, price, description, isHot } = req.body;
        const newProduct = new Product({ name, category, price, description, isHot });
        await newProduct.save();
        res.status(201).json({ message: "Thêm sản phẩm vào Database thành công!", product: newProduct });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, { price: req.body.price });
        res.status(200).json({ message: "Cập nhật giá thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- API DOWNLOADS ---
app.get('/api/downloads', async (req, res) => {
    try {
        const downloads = await Download.find().sort({ order: 1 });
        res.status(200).json(downloads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.post('/api/downloads', async (req, res) => {
    try {
        const newDownload = new Download(req.body);
        await newDownload.save();
        res.status(201).json({ message: "Thêm link tải thành công!", download: newDownload });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.put('/api/downloads/:id', async (req, res) => {
    try {
        await Download.findByIdAndUpdate(req.params.id, req.body);
        res.status(200).json({ message: "Cập nhật link tải thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
app.delete('/api/downloads/:id', async (req, res) => {
    try {
        await Download.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Xóa link tải thành công!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Lấy danh sách lịch sử nạp tiền (cho Admin)
app.get('/api/admin/topups', async (req, res) => {
    try {
        const topups = await History.find({
            $or: [
                { type: "Nạp Tiền (SePay)" },
                { type: "Cộng tiền" }
            ]
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
app.post('/api/chat', async (req, res) => {
    const userMsg = req.body.message.toLowerCase();
    let reply = "Xin lỗi, mình chỉ là AI nên không hiểu rõ ý bạn. Bạn có thể liên hệ trực tiếp Admin TheGhost qua Zalo: 0123.456.789 để được hỗ trợ cụ thể nhé!";

    try {
        if (userMsg.includes('chào') || userMsg.includes('hi') || userMsg.includes('hello')) {
            reply = "Dạ chào bạn! Mình là Ghost AI. Mình có thể giúp gì cho bạn về báo giá Sản phẩm, Hướng dẫn nạp tiền hay Cập nhật thông tin hôm nay ạ?";
        }
        else if (userMsg.includes('giá') || userMsg.includes('mua') || userMsg.includes('sản phẩm') || userMsg.includes('aimbot') || userMsg.includes('tool')) {
            const products = await Product.find({ status: 'ON' }).sort({ dateAdded: -1 });
            if (products.length > 0) {
                let prodList = products.map(p => `- <b>${p.name}</b>: <span style="color:#fbbf24">${p.price.toLocaleString()}đ</span>`).join("<br>");
                reply = `Hiện tại kho TheGhost đang có sẵn các mã sau:<br>${prodList}<br><br>Bạn hãy nạp tiền và vào menu <b>Sản phẩm</b> để đặt mua tự động nhé!`;
            } else {
                reply = "Hiện tại kho sản phẩm đang được Admin bảo trì cập nhật, bạn quay lại sau ít phút nhé!";
            }
        }
        else if (userMsg.includes('thông tin') || userMsg.includes('hôm nay') || userMsg.includes('tin tức') || userMsg.includes('cập nhật')) {
            const now = new Date();
            const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            reply = `<b>CẬP NHẬT TRẠNG THÁI NGÀY ${dateStr}:</b><br>
            <span style="color:#10b981">✓</span> <b>Aimbot & Bypass:</b> Hoạt động mượt mà, An toàn 100% cho rank cao.<br>
            <span style="color:#10b981">✓</span> <b>Hệ thống Nạp:</b> SePay và Thẻ Cào trực tuyến 24/7.<br>
            🔥 <i>Khuyến mãi: Đang ưu đãi tặng ngày dùng khi mua gói tháng!</i>`;
        }
        else if (userMsg.includes('nạp tiền') || userMsg.includes('nạp thẻ') || userMsg.includes('bank') || userMsg.includes('ngân hàng')) {
            reply = "Hệ thống nạp tự động 24/7. Bạn hãy bấm vào nút <b>Nạp tiền</b>, chọn Quét mã QR MB Bank (chờ 10 giây tiền lên), hoặc chọn Nạp Thẻ Cào (Viettel, Vina, Mobi) nhé.";
        }
        else if (userMsg.includes('lỗi') || userMsg.includes('admin') || userMsg.includes('zalo') || userMsg.includes('hỗ trợ')) {
            reply = "Nếu gặp lỗi, hãy nhắn tin ngay cho Admin qua <b>Zalo: 0123.456.789</b> (Trực 24/24). Gửi kèm mã giao dịch (#TG-...) để được xử lý nhanh nhất ạ.";
        }

        setTimeout(() => { res.status(200).json({ reply }); }, 1000);
    } catch (err) {
        res.status(500).json({ reply: "Hệ thống AI đang tạm mất kết nối, bạn thử lại sau nhé!" });
    }
});

app.get('/api/user-data/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng!" });

        const orders = await Order.find({ username }).sort({ date: -1 });
        const history = await History.find({ username }).sort({ date: -1 });

        res.status(200).json({ balance: user.balance, orders: orders, history: history });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API MUA HÀNG & LƯU LỊCH SỬ THẬT
app.post('/api/buy', async (req, res) => {
    try {
        const { username, productName, packageId, quantity } = req.body;
        const buyQuantity = parseInt(quantity) || 1;
        if (buyQuantity <= 0) return res.status(400).json({ message: "Số lượng không hợp lệ!" });

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "Vui lòng đăng nhập lại!" });
        
        const product = await Product.findOne({ name: productName });
        if (!product) return res.status(404).json({ message: "Sản phẩm không tồn tại!" });

        let queryCondition = { productId: product._id, status: 'unsold' };
        let pkgName = "";

        if (packageId) {
            const parts = packageId.split('|');
            if (parts.length === 2) {
                const duration = parts[0];
                pkgName = " - " + duration;
                queryCondition.duration = duration;
            } else {
                const pkg = product.packages.find(p => p._id.toString() === packageId);
                if (pkg) {
                    pkgName = " - " + pkg.name;
                    queryCondition.packageId = packageId;
                }
            }
        }

        const keysAvailable = await Key.find(queryCondition).limit(buyQuantity);
        if (keysAvailable.length < buyQuantity) {
            return res.status(400).json({ message: `Sản phẩm hiện đang tạm hết key (Chỉ còn ${keysAvailable.length} key). Vui lòng liên hệ Admin!` });
        }

        let finalPrice = product.price;
        if (keysAvailable[0].price !== undefined && keysAvailable[0].price !== null && keysAvailable[0].price !== 0) {
            finalPrice = keysAvailable[0].price;
        }

        const totalCost = finalPrice * buyQuantity;
        if (user.balance < totalCost) return res.status(400).json({ message: "Số dư không đủ. Vui lòng nạp thêm!" });

        user.balance -= totalCost;
        await user.save();

        const orderId = "#TG-" + Math.floor(10000 + Math.random() * 90000);
        const boughtKeys = keysAvailable.map(k => k.key).join('\n');

        const newOrder = new Order({ username, orderId, productName: productName + pkgName, price: totalCost, key: boughtKeys });
        await newOrder.save();

        for (let k of keysAvailable) {
            k.status = 'sold';
            k.buyer = username;
            k.dateSold = new Date();
            k.orderId = orderId;
            await k.save();
        }

        const newHistory = new History({ username, type: "Mua Hàng", amount: -totalCost, desc: `Thanh toán: ${productName}${pkgName} x${buyQuantity}` });
        await newHistory.save();

        res.status(200).json({ message: "Mua hàng thành công! Key đã được lưu trong Đơn Hàng.", balance: user.balance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(400).json({ message: "Tài khoản hoặc Email đã tồn tại!" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, balance: 0 });
        await newUser.save();

        // Gửi email thông báo tự động
        const mailOptions = {
            from: '"TheGhost Coder" <YOUR_GMAIL@gmail.com>',
            to: email,
            subject: 'Chào mừng bạn đến với TheGhost Coder!',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121218; padding: 40px 30px; color: #ffffff; border-radius: 12px; border-top: 5px solid #8b5cf6; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #a855f7; text-align: center; font-size: 24px; margin-bottom: 20px;">🎉 ĐĂNG KÝ THÀNH CÔNG!</h2>
                    <p style="font-size: 16px; line-height: 1.6;">Xin chào <strong>${username}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">Cảm ơn bạn đã tin tưởng và đăng ký tài khoản tại hệ thống <strong>TheGhost Coder</strong>.</p>
                    <p style="font-size: 16px; line-height: 1.6;">Tài khoản của bạn đã được kích hoạt thành công. Ngay bây giờ, bạn có thể nạp tiền và trải nghiệm các dịch vụ (Tool, Bot, Acc Game) một cách hoàn toàn tự động.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="http://localhost:5000" style="background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; font-size: 16px;">Vào Web Ngay</a>
                    </div>
                    
                    <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
                    <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 0;">Nếu cần hỗ trợ, vui lòng liên hệ Admin qua nút hỗ trợ trên website.</p>
                </div>
            `
        };

        // Gửi mail mà không block luồng xử lý chính
        transporter.sendMail(mailOptions).catch(err => console.log("Lỗi gửi mail tự động:", err));

        res.status(201).json({ message: "Đăng ký thành công!", username, balance: 0 });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "Tài khoản không tồn tại!" });

        if (user.locked) {
            return res.status(403).json({ message: "Tài khoản của bạn đã bị khóa! Vui lòng liên hệ Admin." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu!" });

        res.status(200).json({ message: "Đăng nhập thành công!", username: user.username, balance: user.balance });
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

        if (tstData.status === 1 || tstData.status === 99) {
            const h = new History({ username: userId, type: "Nạp Thẻ", amount: parseInt(amount), desc: `${type} - ${serial}`, status: 'Chờ xử lý' });
            await h.save();
            return res.status(200).json({ message: "Thẻ đã đẩy lên Cổng thành công!" });
        } else {
            const h = new History({ username: userId, type: "Nạp Thẻ", amount: parseInt(amount), desc: `${type} - ${serial}`, status: 'Thất bại' });
            await h.save();
            return res.status(400).json({ message: tstData.message || "Thẻ cào không hợp lệ." });
        }
    } catch (error) {
        // Giả lập
        const h = new History({ username: userId, type: "Nạp Thẻ", amount: parseInt(amount), desc: `${type} - ${serial} (Giả lập)`, status: 'Thành công' });
        await h.save();
        return res.status(200).json({ message: "Cổng gạch (Giả lập): Ghi nhận thẻ cào thành công!" });
    }
});

app.post('/api/sepay-webhook', async (req, res) => {
    try {
        const { code, content, transferAmount } = req.body;
        if (!content) return res.status(400).send("Nội dung trống");

        const match = content.match(/TGCODER\s+([A-Za-z0-9_]+)/i);

        if (match && match[1]) {
            const username = match[1].trim();
            const amount = parseFloat(transferAmount);

            const user = await User.findOneAndUpdate(
                { username: { $regex: new RegExp(`^${username}$`, "i") } },
                { $inc: { balance: amount } },
                { new: true }
            );

            if (user) {
                const newHistory = new History({ username, type: "Nạp Tiền (SePay)", amount: amount, desc: `Nạp tự động MB Bank` });
                await newHistory.save();
                return res.status(200).json({ success: true, message: "Cộng tiền tự động thành công!" });
            }
        }
        res.status(400).send("Không tìm thấy user.");
    } catch (error) {
        res.status(500).send("Lỗi xử lý Webhook.");
    }
});


function md5(string) {
    return require('crypto').createHash('md5').update(string).digest('hex');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Hệ thống lõi Server chạy tại port ${PORT}`));