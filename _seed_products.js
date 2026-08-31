require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || 'theghostweb';

const Product = mongoose.model('Product', new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    description: String,
    isHot: Boolean,
    status: { type: String, default: 'ON' },
    dateAdded: { type: Date, default: Date.now }
}));

const products = [
    { name: 'Aimbot PC Aurora VN', category: 'cheat', price: 25000, isHot: true, description: 'Aimbot Aurora bản PC, cập nhật liên tục. Key kích hoạt tự động sau khi mua.' },
    { name: 'Bypass Anti-Cheat XG', category: 'cheat', price: 35000, isHot: true, description: 'Gói bypass đi kèm Aimbot. Dùng cho rank, ưu tiên ổn định.' },
    { name: 'ESP Wall Vision PC', category: 'cheat', price: 20000, isHot: false, description: 'Hỗ trợ tầm nhìn, tùy chỉnh màu và khoảng cách. Key gửi trong đơn hàng.' },
    { name: 'Auto Farm Bot 24/7', category: 'cheat', price: 15000, isHot: false, description: 'Bot farm tự động, cài đặt lịch chạy. Phù hợp acc phụ.' },
    { name: 'Recoil Macro Pro', category: 'cheat', price: 12000, isHot: false, description: 'Macro kiểm soát giật súng theo từng loại súng. Dễ tùy chỉnh.' },
    { name: 'Radar Assist Mini-map', category: 'cheat', price: 18000, isHot: false, description: 'Radar hỗ trợ vị trí trên bản đồ. Nhẹ, ít chiếm tài nguyên.' },
    { name: 'Aurora Injector Mobile', category: 'cheat', price: 22000, isHot: true, description: 'Bản mobile injector Aurora. Hướng dẫn đi kèm khi nhận key.' },
    { name: 'Stream Proof Overlay', category: 'cheat', price: 16000, isHot: false, description: 'Lớp overlay ẩn khi live stream. Dùng kèm các gói PC.' },
    { name: 'Trigger Bot Lite', category: 'cheat', price: 10000, isHot: false, description: 'Trigger bot gọn, độ trễ thấp. Phù hợp máy cấu hình vừa.' },
    { name: 'Silent Aim Combo', category: 'cheat', price: 28000, isHot: true, description: 'Gói silent aim combo. Cập nhật theo season hiện tại.' },

    { name: 'Acc Liên Quân Rank Cao', category: 'acc', price: 50000, isHot: true, description: 'Tài khoản Liên Quân rank cao, nhiều skin. Giao acc + mật khẩu trong đơn.' },
    { name: 'Acc Valorant Premium', category: 'acc', price: 80000, isHot: true, description: 'Acc Valorant nhiều skin súng, rank ổn. Đổi mail được hướng dẫn kèm.' },
    { name: 'Acc Free Fire VIP', category: 'acc', price: 30000, isHot: false, description: 'Acc Free Fire có pet/skin hiếm. Check trước khi giao.' },
    { name: 'Acc Roblox Limited', category: 'acc', price: 25000, isHot: false, description: 'Acc Roblox có item limited. Giao thông tin đăng nhập ngay.' },
    { name: 'Acc Genshin AR55+', category: 'acc', price: 120000, isHot: true, description: 'Acc Genshin AR cao, nhiều nhân vật 5 sao. Bảo hành đổi mail.' },
    { name: 'Acc LMHT Rank Cao Thủ', category: 'acc', price: 70000, isHot: false, description: 'Acc Liên Minh rank Cao Thủ, trang phục xịn. Random server.' },
    { name: 'Acc PUBG Mobile UC', category: 'acc', price: 40000, isHot: false, description: 'Acc PUBG Mobile có UC/skin. Phù hợp chơi rank.' },
    { name: 'Acc Delta Force Starter', category: 'acc', price: 35000, isHot: false, description: 'Acc Delta Force đã mở khóa cơ bản, sẵn sàng chơi.' },

    { name: 'Tool Check Acc Live/Die', category: 'tool', price: 10000, isHot: false, description: 'Check acc sống/chết hàng loạt. Kết quả xuất file nhanh.' },
    { name: 'Tool Check Proxy / Key', category: 'tool', price: 8000, isHot: false, description: 'Kiểm tra proxy và key hàng loạt, lọc chết tự động.' },
    { name: 'Tool Check Mail Inbox', category: 'tool', price: 10000, isHot: false, description: 'Check mail nhận mã xác minh. Dùng khi đổi thông tin acc.' },
    { name: 'UID Info Lookup', category: 'tool', price: 5000, isHot: false, description: 'Tra cứu thông tin UID cơ bản. Kết quả trả trong đơn hàng.' },
    { name: 'Bulk Key Checker', category: 'tool', price: 15000, isHot: true, description: 'Check key số lượng lớn, thống kê còn hạn / hết hạn.' },
    { name: 'Captcha Helper Tool', category: 'tool', price: 12000, isHot: false, description: 'Công cụ hỗ trợ giải captcha khi check acc số lượng lớn.' }
];

(async () => {
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
    let added = 0;
    for (const p of products) {
        const exists = await Product.findOne({ name: p.name });
        if (exists) continue;
        await Product.create(p);
        added++;
        console.log('+', p.name);
    }
    const total = await Product.countDocuments();
    console.log(`DONE added=${added} total=${total}`);
    await mongoose.disconnect();
})().catch(err => {
    console.error(err);
    process.exit(1);
});
