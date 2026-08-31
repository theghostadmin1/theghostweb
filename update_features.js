const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || 'theghostweb';

async function updateFeatures() {
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
    const Product = mongoose.model('Product', new mongoose.Schema({
        name: String, category: String, price: Number, description: String,
        imageUrl: String, isHot: Boolean, status: String, dateAdded: Date
    }));
    
    const aimbotDesc = [
        '✓ Aimbot Safe/Head/Chest: Ghìm đầu nhẹ, Ghìm đầu chặt (RISK), Ghìm cổ',
        '✓ Định vị ESP Địch, Item vật phẩm trong sinh tồn',
        '✓ Aim Mouse: Bắn awm',
        '✓ Aim FOV: Lia tâm địch',
        '✓ Aim Silents: Đạn đuổi dí theo địch (RISK)',
        '✓ AimLock: Cứng tâm (RISK)',
        '✓ Pull Player: Kéo địch (RISK)',
        '✓ Norecoil: Đạn thẳng (RISK)',
        '✓ Ẩn màn khi livestream',
        '✓ Cực kỳ an toàn cho tài khoản 100%'
    ].join('\n');

    const bypassDesc = [
        '✓ Bypass Anti-Cheat: Chống quét bộ nhớ game',
        '✓ Fake HWID & Device Spoofer an toàn',
        '✓ Hỗ trợ chơi giả lập và PC mượt mà',
        '✓ Khởi chạy ẩn danh không để lại log file',
        '✓ Cập nhật tự động theo phiên bản game mới nhất'
    ].join('\n');

    await Product.updateMany({ name: /Aimbot/i }, { description: aimbotDesc, price: 16250, imageUrl: '/Img/aurora.png' });
    await Product.updateMany({ name: /Bypass/i }, { description: bypassDesc, price: 35000, imageUrl: '/Img/Bypass.png' });
    console.log('✅ Đã cập nhật mô tả chi tiết và giá chuẩn theo ảnh cho Sản phẩm!');
    process.exit(0);
}
updateFeatures();
