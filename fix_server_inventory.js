const fs = require('fs');
const path = 'e:/TheGhostWeb/server.js';
let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf("app.get('/api/admin/inventory'");
const nextBlockIndex = content.indexOf("app.post('/api/admin/keys/import'") !== -1 ? content.indexOf("app.post('/api/admin/keys/import'") : content.indexOf("app.post('/api/admin/inventory/import'");

if (startIndex !== -1) {
    const newBlock = `app.get('/api/admin/inventory', async (req, res) => {
    try {
        const allKeys = await Key.find().populate('productId').sort({ _id: -1 });

        let inventory = [];

        allKeys.forEach(k => {
            let durationName = k.duration ? \` - \${k.duration}\` : "";
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
`;

    if (nextBlockIndex !== -1) {
        content = content.substring(0, startIndex) + newBlock + content.substring(nextBlockIndex);
    } else {
        // Just in case it's at the end of the file or corrupted
        const adminUsersIndex = content.indexOf("app.get('/api/admin/users'");
        if (adminUsersIndex > startIndex) {
            content = content.substring(0, startIndex) + newBlock + content.substring(adminUsersIndex);
        } else {
            console.log("Cannot find the end of the corrupted block");
            process.exit(1);
        }
    }
    fs.writeFileSync(path, content, 'utf8');
    console.log("Fixed server.js inventory block");
} else {
    console.log("Could not find inventory index!");
}
