const fs = require('fs');
const path = 'e:/TheGhostWeb/index_backup/admin_script_v5.js';
let content = fs.readFileSync(path, 'utf8');

// Xóa hàm cũ nếu có
const oldStart = content.indexOf('window.verifyAdminPassword = async function() {');
if (oldStart !== -1) {
    const oldEnd = content.indexOf('};\n', oldStart) + 3;
    content = content.substring(0, oldStart) + content.substring(oldEnd);
}

const verifyLogic = `
window.verifyAdminPassword = async function() {
    const pwdInput = document.querySelector('input[type="password"]');
    if (!pwdInput) return;
    const password = pwdInput.value;
    if (!password) {
        if(typeof showToast === 'function') showToast('Vui lòng nhập mật khẩu!');
        else alert('Vui lòng nhập mật khẩu!');
        return;
    }
    try {
        const apiUrl = typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5000/api';
        const res = await fetch(apiUrl + '/admin/verify-hmac', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.success) {
            const btn = document.querySelector('button[onclick="verifyAdminPassword()"]');
            if (btn) {
                let p = btn;
                while (p && p !== document.body) {
                    p = p.parentElement;
                    const style = window.getComputedStyle(p);
                    if (style.position === 'fixed' || style.position === 'absolute' || p.id.includes('modal') || p.id.includes('overlay') || p.className.includes('overlay')) {
                        p.style.display = 'none';
                        p.style.visibility = 'hidden';
                        p.style.opacity = '0';
                        p.remove();
                        break;
                    }
                }
            }
            if(typeof fetchProducts === 'function') fetchProducts();
            if(typeof fetchInventory === 'function') fetchInventory();
            if(typeof fetchTopups === 'function') fetchTopups();
            if(typeof fetchUsers === 'function') fetchUsers();
        } else {
            if(typeof showToast === 'function') showToast('Mật mã không chính xác!');
            else alert('Mật mã không chính xác!');
        }
    } catch(e) {
        if(typeof showToast === 'function') showToast('Lỗi hệ thống!');
        else alert('Lỗi hệ thống!');
    }
};
`;

content = verifyLogic + content;
fs.writeFileSync(path, content, 'utf8');
console.log('Appended fixed verifyAdminPassword to admin_script_v5.js');
