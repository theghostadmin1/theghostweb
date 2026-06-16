const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/script.js';
let content = fs.readFileSync(path, 'utf8');

// We need to change how the client package select is populated because now it receives grouped keys instead of packages.
// Wait, /api/products/:id/packages now returns:
// [ { _id: "1 Ngày|10000", name: "1 Ngày", price: 10000, originalPrice: 0, stock: 10 }, ... ]
// This structure matches exactly the previous packages array structure! 
// So the client script.js `openBuyModal` function might not even need changes!
// Let's verify `openBuyModal` in script.js.
