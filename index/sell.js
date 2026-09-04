const API = '/api/sell';
const TOKEN_KEY = 'THEGHOST_SELL_TOKEN';

function token() { return sessionStorage.getItem(TOKEN_KEY) || ''; }
function headers() {
    return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() };
}
function msg(el, text, ok) {
    const node = document.getElementById(el);
    if (!node) return;
    node.textContent = text || '';
    node.className = 'sell-msg' + (ok ? ' ok' : '');
}
async function api(path, opt) {
    const res = await fetch(API + path, opt);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Lỗi máy chủ');
    return data;
}

function showApp(on) {
    document.getElementById('sell-login').hidden = !!on;
    document.getElementById('sell-app').hidden = !on;
}

function lines(arr) { return (arr || []).join('\n'); }

function resetForm() {
    document.getElementById('post-id').value = '';
    document.getElementById('post-title').value = '';
    document.getElementById('post-slug').value = '';
    document.getElementById('post-desc').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('post-links').value = '';
    document.getElementById('post-keys').value = '';
    document.getElementById('post-pub').checked = true;
    document.getElementById('post-save').innerHTML = '<i class="fas fa-paper-plane"></i> Đăng bài';
}

async function loadMe() {
    const me = await api('/me', { headers: headers() });
    document.getElementById('sell-user-label').textContent = me.username + (me.isVip ? ' · VIP' : '');
    document.getElementById('st-balance').textContent = (me.balance || 0).toLocaleString() + 'đ';
    const catNames = { cheat: 'Bot & Cheat', acc: 'Tài khoản Game', tool: 'Công cụ' };
    const products = Array.isArray(me.sellProducts) ? me.sellProducts : [];
    let catText = 'Chưa chọn sản phẩm';
    if (products.length) catText = products.length + ' sản phẩm được giảm';
    else if (Array.isArray(me.sellCategories) && me.sellCategories.length) {
        catText = me.sellCategories.map(c => catNames[c] || c).join(', ');
    }
    document.getElementById('st-discount').textContent = (me.discountPercent || 0) + '%';
    const catEl = document.getElementById('st-sell-cats');
    if (catEl) catEl.textContent = catText;
    const listEl = document.getElementById('sell-allowed-list');
    if (listEl) {
        listEl.innerHTML = products.length
            ? products.map(p => `<div class="sell-item"><strong>${escapeHtml(p.name)}</strong><div class="meta">${escapeHtml(catNames[p.category] || p.category || '')}</div></div>`).join('')
            : '<p class="hint">Admin chưa chọn sản phẩm chiết khấu cho tài khoản này.</p>';
    }
    document.getElementById('st-orders').textContent = me.orderCount || 0;
    document.getElementById('st-refs').textContent = me.referralCount || 0;
    document.getElementById('st-posts').textContent = me.postCount || 0;
    const origin = location.origin;
    document.getElementById('sell-ref').value = origin + '/?ref=' + encodeURIComponent(me.username);
    return me;
}

async function loadPosts() {
    const posts = await api('/posts', { headers: headers() });
    const box = document.getElementById('sell-post-list');
    if (!posts.length) {
        box.innerHTML = '<p class="hint">Chưa có bài. Đăng bài bên trên.</p>';
        return;
    }
    box.innerHTML = posts.map(p => {
        const url = location.origin + '/p/' + p.slug;
        return `<div class="sell-item">
            <strong>${escapeHtml(p.title)}</strong>
            <div class="meta">${p.published ? 'Công khai' : 'Ẩn'} · <a href="${url}" target="_blank">${url}</a></div>
            <div class="acts">
                <button type="button" class="sell-btn ghost" data-edit="${p._id}">Sửa</button>
                <button type="button" class="sell-btn ghost" data-copy="${url}">Copy link</button>
                <button type="button" class="sell-btn ghost" data-del="${p._id}">Xóa</button>
            </div>
        </div>`;
    }).join('');
    box.querySelectorAll('[data-edit]').forEach(btn => btn.onclick = () => fillPost(posts.find(x => x._id === btn.dataset.edit)));
    box.querySelectorAll('[data-copy]').forEach(btn => btn.onclick = () => copyText(btn.dataset.copy));
    box.querySelectorAll('[data-del]').forEach(btn => btn.onclick = () => delPost(btn.dataset.del));
}

function fillPost(p) {
    if (!p) return;
    document.getElementById('post-id').value = p._id;
    document.getElementById('post-title').value = p.title || '';
    document.getElementById('post-slug').value = p.slug || '';
    document.getElementById('post-desc').value = p.description || '';
    document.getElementById('post-content').value = p.content || '';
    document.getElementById('post-links').value = lines(p.links);
    document.getElementById('post-keys').value = lines(p.keys);
    document.getElementById('post-pub').checked = p.published !== false;
    document.getElementById('post-save').innerHTML = '<i class="fas fa-save"></i> Lưu sửa';
    const form = document.getElementById('sell-post-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadOrders() {
    const orders = await api('/orders', { headers: headers() });
    const box = document.getElementById('sell-order-list');
    if (!box) return;
    if (!orders.length) {
        box.innerHTML = '<p class="hint">Chưa có đơn hàng.</p>';
        return;
    }
    box.innerHTML = orders.map(o => `<div class="sell-item">
        <strong>${escapeHtml(o.productName)}</strong>
        <div class="meta">${escapeHtml(o.orderId || '')} · ${(o.price || 0).toLocaleString()}đ · ${escapeHtml(o.status || '')} · ${o.date ? new Date(o.date).toLocaleString('vi-VN') : ''}</div>
    </div>`).join('');
}

async function loadRefs() {
    const users = await api('/referrals', { headers: headers() });
    const box = document.getElementById('sell-ref-list');
    if (!box) return;
    if (!users.length) {
        box.innerHTML = '<p class="hint">Chưa có khách đăng ký qua link của bạn. Copy link giới thiệu ở trên.</p>';
        return;
    }
    box.innerHTML = users.map(u => `<div class="sell-item">
        <strong>${escapeHtml(u.username)}</strong>
        <div class="meta">Số dư ${(u.balance || 0).toLocaleString()}đ${u.isVip ? ' · VIP' : ''}</div>
    </div>`).join('');
}

function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        alert('Đã copy: ' + text);
    } catch (e) {
        prompt('Copy:', text);
    }
}

async function delPost(id) {
    if (!confirm('Xóa bài này?')) return;
    try {
        const data = await api('/posts/' + id, { method: 'DELETE', headers: headers() });
        msg('sell-post-msg', data.message, true);
        await loadMe();
        await loadPosts();
    } catch (e) {
        msg('sell-post-msg', e.message);
    }
}

async function boot() {
    if (!token()) return showApp(false);
    try {
        await loadMe();
        await Promise.all([loadPosts(), loadOrders(), loadRefs()]);
        showApp(true);
    } catch (e) {
        sessionStorage.removeItem(TOKEN_KEY);
        showApp(false);
    }
}

document.getElementById('sell-login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg('sell-login-msg', 'Đang đăng nhập...');
    try {
        const data = await api('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('sell-email').value,
                password: document.getElementById('sell-password').value
            })
        });
        sessionStorage.setItem(TOKEN_KEY, data.token);
        await boot();
        msg('sell-login-msg', '', true);
    } catch (e) {
        msg('sell-login-msg', e.message);
    }
});

document.getElementById('sell-logout').addEventListener('click', () => {
    sessionStorage.removeItem(TOKEN_KEY);
    showApp(false);
});

document.getElementById('copy-ref').addEventListener('click', () => {
    copyText(document.getElementById('sell-ref').value);
});

document.getElementById('post-reset').addEventListener('click', resetForm);

document.getElementById('sell-post-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const id = document.getElementById('post-id').value;
    const payload = {
        title: document.getElementById('post-title').value,
        slug: document.getElementById('post-slug').value,
        description: document.getElementById('post-desc').value,
        content: document.getElementById('post-content').value,
        links: document.getElementById('post-links').value,
        keys: document.getElementById('post-keys').value,
        published: document.getElementById('post-pub').checked
    };
    try {
        const data = id
            ? await api('/posts/' + id, { method: 'PUT', headers: headers(), body: JSON.stringify(payload) })
            : await api('/posts', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
        msg('sell-post-msg', data.message, true);
        resetForm();
        await loadMe();
        await loadPosts();
    } catch (e) {
        msg('sell-post-msg', e.message);
    }
});

boot();
