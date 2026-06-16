const fs = require('fs');
const path = 'e:/TheGhostWeb/server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove PackageSchema and references in ProductSchema
content = content.replace(/const PackageSchema = new mongoose\.Schema\(\{[\s\S]*?\}\);\s*/, '');
content = content.replace(/packages: \[\{ type: mongoose\.Schema\.Types\.ObjectId, ref: 'Package' \}\],\s*/, '');

// 2. Update KeySchema
content = content.replace(/packageId: \{ type: mongoose\.Schema\.Types\.ObjectId \},\s*/, 'duration: { type: String },\n    price: { type: Number },\n    ');

// 3. Remove Package API endpoints
content = content.replace(/app\.get\('\/api\/admin\/products\/:id\/packages'[\s\S]*?\}\);\s*/g, '');
content = content.replace(/app\.post\('\/api\/admin\/products\/:id\/packages'[\s\S]*?\}\);\s*/g, '');
content = content.replace(/app\.delete\('\/api\/admin\/products\/:id\/packages\/:pkgId'[\s\S]*?\}\);\s*/g, '');

// 4. Update /api/admin/keys/import to handle duration and price
// Look for the line where new Key is created
content = content.replace(/const keysToInsert = keysArray\.map\(k => \(\{\s*productId,\s*packageId:\s*packageId[\s\S]*?\}\)\);/, `const keysToInsert = keysArray.map(k => ({\n            productId,\n            key: k,\n            duration: req.body.duration || '1 Ngày',\n            price: req.body.price || 0,\n            status: 'unsold'\n        }));`);

// 5. Update /api/products/:id/packages to return grouped keys instead of packages
const newPackagesApi = `
// Lấy danh sách các loại Key (theo thời hạn và giá) của một sản phẩm
app.get('/api/products/:id/packages', async (req, res) => {
    try {
        const unsoldKeys = await Key.find({ productId: req.params.id, status: 'unsold' });
        // Group keys by duration and price
        const map = new Map();
        unsoldKeys.forEach(k => {
            const keyStr = k.duration + '|' + k.price;
            if (!map.has(keyStr)) {
                map.set(keyStr, {
                    _id: keyStr, // Using string as ID for client select
                    name: k.duration,
                    price: k.price,
                    originalPrice: 0,
                    stock: 0
                });
            }
            map.get(keyStr).stock++;
        });
        res.json(Array.from(map.values()));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
`;
content = content.replace(/app\.get\('\/api\/products\/:id\/packages'[\s\S]*?\}\);\s*/, newPackagesApi);

// 6. Update /api/buy
// In /api/buy, it used to look up package details.
// Now we don't need packageId. The client will pass `packageId` as `duration|price` (e.g. "1 Ngày|10000").
// Let's change the logic in /api/buy to handle this.
// The client sends `packageId` string "1 Ngày|50000".
const buyLogicOld = /if \(packageId\) \{[\s\S]*?\}([\s\S]*?)const quantity = req\.body\.quantity \|\| 1;/;
// Wait, let's just find the whole block inside `/api/buy` and replace it.
// To be safe, I'll read the file and replace it programmatically if regex is hard.

fs.writeFileSync(path, content, 'utf8');
console.log('Phase 1 patched partially');
