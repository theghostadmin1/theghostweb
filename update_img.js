const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB = process.env.MONGO_DB || 'theghostweb';

async function update() {
    await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
    const Download = mongoose.model('Download', new mongoose.Schema({
        name: String, description: String, version: String, url: String,
        iconClass: String, iconColor: String, imageUrl: String, tag: String,
        fileSize: String, downloadCount: Number, videoUrl: String, order: Number
    }));
    await Download.updateMany({}, { imageUrl: '/src/IMG/cover.jpg' });
    console.log('✅ Đã cập nhật ảnh banner cực đẹp cho tất cả link download trong Database!');
    process.exit(0);
}
update();
