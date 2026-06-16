const fs = require('fs');
const path = 'e:/TheGhostWeb/server.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix GET /api/products/:id/packages
const oldGetPackages = `app.get('/api/products/:id/packages', async (req, res) => {\n    try {\n        const unsoldKeys = await Key.find({ productId: req.params.id, status: 'unsold' });\n        // Group keys by duration and price\n        const map = new Map();\n        unsoldKeys.forEach(k => {\n            const duration = k.duration || '1 NgAy';\n            const price = k.price || 0;\n            const keyStr = duration + '|' + price;\n            if (!map.has(keyStr)) {\n                map.set(keyStr, {\n                    _id: keyStr,\n                    name: duration,\n                    price: price,\n                    originalPrice: 0,\n                    stock: 0\n                });\n            }\n            map.get(keyStr).stock++;\n        });\n        res.json(Array.from(map.values()));\n    } catch (error) {\n        console.error(error);\n        res.status(500).json({ message: error.message });\n    }\n});`;

const newGetPackages = `app.get('/api/products/:id/packages', async (req, res) => {
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
        
        res.json(Array.from(map.values()));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});`;

// Mismatch fallback logic for get packages
const startGet = content.indexOf(`app.get('/api/products/:id/packages', async (req, res) => {`);
if (startGet !== -1) {
    const endGet = content.indexOf(`});`, startGet + 60) + 3;
    content = content.substring(0, startGet) + newGetPackages + content.substring(endGet);
}

// 2. Fix POST /api/buy
const buyPattern = `        let finalPrice = product.price;\n        let pkgName = "";\n        let filterPkgId = packageId || null;\n\n        if (packageId) {\n            const pkg = product.packages.find(p => p._id.toString() === packageId);\n            if (!pkg) return res.status(404).json({ message: "GA3i khA'ng tA"n tAi!" });\n            finalPrice = pkg.price;\n            pkgName = " - " + pkg.name;\n        }\n\n        const totalCost = finalPrice * buyQuantity;\n        if (user.balance < totalCost) return res.status(400).json({ message: "SA\` dA khA'ng A\`A . Vui lAng nAp thAm!" });\n\n        const keysAvailable = await Key.find({ productId: product._id, packageId: filterPkgId, status: 'unsold' }).limit(buyQuantity);`;

const newBuyPattern = `        let finalPrice = product.price;
        let pkgName = "";
        let queryCondition = { productId: product._id, status: 'unsold' };

        if (packageId) {
            const parts = packageId.split('|');
            if (parts.length === 2) {
                const duration = parts[0];
                finalPrice = parseInt(parts[1]) || product.price;
                pkgName = " - " + duration;
                queryCondition.duration = duration;
                queryCondition.price = finalPrice;
            } else {
                const pkg = product.packages.find(p => p._id.toString() === packageId);
                if (pkg) {
                    finalPrice = pkg.price;
                    pkgName = " - " + pkg.name;
                    queryCondition.packageId = packageId;
                }
            }
        }

        const totalCost = finalPrice * buyQuantity;
        if (user.balance < totalCost) return res.status(400).json({ message: "Số dư không đủ. Vui lòng nạp thêm!" });

        const keysAvailable = await Key.find(queryCondition).limit(buyQuantity);`;

// Manual replace for POST buy using index
const buyStart = content.indexOf(`        let finalPrice = product.price;`);
if (buyStart !== -1) {
    const buyEnd = content.indexOf(`if (keysAvailable.length < buyQuantity) {`, buyStart);
    content = content.substring(0, buyStart) + newBuyPattern + '\n        ' + content.substring(buyEnd);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Server patched!');
