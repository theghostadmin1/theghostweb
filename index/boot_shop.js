(function () {
    var originalFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
        if (typeof input === 'string') {
            input = input.replace('https://nroghost.com', '');
        }
        var url = typeof input === 'string' ? input : (input && input.url);
        var options = Object.assign({}, init || {});
        var path = String(url || '').split('?')[0];
        var token = '';
        try { token = sessionStorage.getItem('THEGHOST_SHOP_TOKEN') || ''; } catch (e) {}
        if (token && String(url || '').indexOf('/api') !== -1 && !/\/(login|register)$/.test(path)) {
            var headers = new Headers(options.headers || {});
            if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
            options.headers = headers;
        }
        var response = await originalFetch(input, options);
        if (typeof url === 'string' && options.method === 'POST' && /\/(login|register)$/.test(path)) {
            var clone = response.clone();
            clone.json().then(function (data) {
                if (response.ok && data) {
                    if (data.token) {
                        try { sessionStorage.setItem('THEGHOST_SHOP_TOKEN', data.token); } catch (e) {}
                    }
                    if (data.username) {
                        try { sessionStorage.setItem('THEGHOST_SAVED_USER', data.username); } catch (e) {}
                    }
                }
            }).catch(function () {});
        }
        return response;
    };

    var DISPLAY = '0347.784.189';
    var COMPACT = '0347784189';
    var BANK = '6004012002';
    function rewritePhones(html) {
        if (typeof html !== 'string') return html;
        return html
            .replace(/https?:\/\/zalo\.me\/\d+/gi, 'https://zalo.me/' + COMPACT)
            .replace(/0\d{3}[.\s-]\d{3}[.\s-]\d{3}/g, function (m) {
                return m.replace(/\D/g, '') === BANK ? m : DISPLAY;
            })
            .replace(/>0(?:1|3|5|7|8|9)\d{8}</g, '>' + DISPLAY + '<')
            .replace(/tel:\+?84?\d+/gi, 'tel:' + COMPACT)
            .replace(/index\/script\.js(\?v=\d+)?/g, 'index/script.obf.js?v=7')
            .replace(/index\/security\.js/g, 'index/security.obf.js?v=7')
            .replace(/index\/admin_script\.js(\?v=\d+)?/g, 'index/admin_script.obf.js?v=7');
    }
    var desc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (desc && desc.set) {
        Object.defineProperty(Element.prototype, 'innerHTML', {
            configurable: true,
            enumerable: desc.enumerable,
            get: desc.get,
            set: function (v) { desc.set.call(this, rewritePhones(v)); }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var token = '';
        try { token = sessionStorage.getItem('THEGHOST_SHOP_TOKEN') || ''; } catch (e) {}
        if (token && typeof applyLoginState === 'function') {
            fetch('/api/shop/me').then(function (r) {
                if (!r.ok) throw new Error('expired');
                return r.json();
            }).then(function (data) {
                applyLoginState(data.username, data);
            }).catch(function () {
                try {
                    sessionStorage.removeItem('THEGHOST_SHOP_TOKEN');
                    sessionStorage.removeItem('THEGHOST_SAVED_USER');
                } catch (e) {}
            });
        }
        var origLogout = window.logout;
        if (typeof origLogout === 'function') {
            window.logout = function () {
                try {
                    sessionStorage.removeItem('THEGHOST_SAVED_USER');
                    sessionStorage.removeItem('THEGHOST_SHOP_TOKEN');
                } catch (e) {}
                return origLogout.apply(this, arguments);
            };
        }
    });
    setInterval(function () {
        if (typeof CURRENT_USER_ID === 'undefined' || CURRENT_USER_ID === 'guest') return;
        if (typeof loadClientProducts === 'function') loadClientProducts();
    }, 15000);
})();
