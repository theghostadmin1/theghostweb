const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || 'theghostweb';

async function updateProducts() {
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
    const Product = mongoose.model('Product', new mongoose.Schema({
        name: String, category: String, price: Number, description: String,
        imageUrl: String, isHot: Boolean, status: String, dateAdded: Date
    }));
    await Product.updateMany({ name: /Aimbot/i }, { imageUrl: '/Img/aurora.png' });
    await Product.updateMany({ name: /Bypass/i }, { imageUrl: '/Img/Bypass.png' });
    console.log('✅ Đã cập nhật ảnh sản phẩm trong Kho hàng!');
    process.exit(0);
}
updateProducts();
