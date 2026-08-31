(function () {
    var originalFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
        if (typeof input === 'string') {
            input = input.replace('https://nroghost.com', '');
        }
        var url = typeof input === 'string' ? input : (input && input.url);
        var options = init || {};
        var response = await originalFetch(input, init);
        if (typeof url === 'string' && options.method === 'POST' && /\/(login|register)$/.test(url.split('?')[0])) {
            var clone = response.clone();
            clone.json().then(function (data) {
                if (response.ok && (data.username || (data.message && data.message.indexOf('thành công') !== -1))) {
                    var userToSave = data.username;
                    if (!userToSave && options.body) {
                        try {
                            var bodyObj = JSON.parse(options.body);
                            userToSave = bodyObj.username || bodyObj.email;
                        } catch (e) {}
                    }
                    if (userToSave) sessionStorage.setItem('THEGHOST_SAVED_USER', userToSave);
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
        var savedUser = sessionStorage.getItem('THEGHOST_SAVED_USER');
        if (savedUser && typeof applyLoginState === 'function') {
            applyLoginState(savedUser);
        }
        var origLogout = window.logout;
        if (typeof origLogout === 'function') {
            window.logout = function () {
                sessionStorage.removeItem('THEGHOST_SAVED_USER');
                return origLogout.apply(this, arguments);
            };
        }
    });
    setInterval(function () {
        if (typeof CURRENT_USER_ID === 'undefined' || CURRENT_USER_ID === 'guest') return;
        if (typeof loadClientProducts === 'function') loadClientProducts();
    }, 15000);
})();
