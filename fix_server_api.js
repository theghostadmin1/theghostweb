const fs = require('fs');
const path = 'e:/TheGhostWeb/server.js';
let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf("app.get('/api/products/:id/packages'");
const endIndex = content.indexOf("app.delete('/api/products/:id'");

if (startIndex !== -1 && endIndex !== -1) {
    const newBlock = `app.get('/api/products/:id/packages', async (req, res) => {
    try {
        const unsoldKeys = await Key.find({ productId: req.params.id, status: 'unsold' });
        // Group keys by duration and price
        const map = new Map();
        unsoldKeys.forEach(k => {
            const duration = k.duration || '1 Ngày';
            const price = k.price || 0;
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
            map.get(keyStr).stock++;
        });
        res.json(Array.from(map.values()));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
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

`;

    content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed server.js");
} else {
    console.log("Could not find indices!");
}
