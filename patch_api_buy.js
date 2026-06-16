const fs = require('fs');
const path = 'e:/TheGhostWeb/server.js';
let content = fs.readFileSync(path, 'utf8');

const oldBuyLogic = `        let finalPrice = product.price;
        let pkgName = "";
        let filterPkgId = packageId || null;

        if (packageId) {
            const pkg = product.packages.find(p => p._id.toString() === packageId);
            if (!pkg) return res.status(404).json({ message: "Gói không tồn tại!" });
            finalPrice = pkg.price;
            pkgName = " - " + pkg.name;
        }

        const totalCost = finalPrice * buyQuantity;
        if (user.balance < totalCost) return res.status(400).json({ message: "Số dư không đủ. Vui lòng nạp thêm!" });

        const keysAvailable = await Key.find({ productId: product._id, packageId: filterPkgId, status: 'unsold' }).limit(buyQuantity);`;

const newBuyLogic = `        let finalPrice = product.price;
        let pkgName = "";
        let filterDuration = null;
        let filterPrice = null;

        if (packageId && packageId.includes('|')) {
            const parts = packageId.split('|');
            filterDuration = parts[0];
            filterPrice = parseInt(parts[1]) || 0;
            finalPrice = filterPrice;
            pkgName = " - " + filterDuration;
        }

        const totalCost = finalPrice * buyQuantity;
        if (user.balance < totalCost) return res.status(400).json({ message: "Số dư không đủ. Vui lòng nạp thêm!" });

        const filterQuery = { productId: product._id, status: 'unsold' };
        if (filterDuration) {
            filterQuery.duration = filterDuration;
            filterQuery.price = filterPrice;
        }

        const keysAvailable = await Key.find(filterQuery).limit(buyQuantity);`;

content = content.replace(oldBuyLogic, newBuyLogic);

fs.writeFileSync(path, content, 'utf8');
console.log('API Buy patched');
