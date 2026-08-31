const fs = require('fs');
const path = 'e:/TheGhostWeb/server.js';
let content = fs.readFileSync(path, 'utf8');

// We need to inject ProductSchema and DownloadSchema after UserSchema
const userSchemaEnd = /const User = mongoose\.model\('User', UserSchema\);/;
const newSchemas = `\nconst ProductSchema = new mongoose.Schema({
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
    name: { type: String, required: true },`;

content = content.replace(userSchemaEnd, `const User = mongoose.model('User', UserSchema);${newSchemas}`);
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed server.js schemas");
