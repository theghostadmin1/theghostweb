(function () {
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });
    document.addEventListener('selectstart', function (e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
    });
    document.addEventListener('dragstart', function (e) {
        e.preventDefault();
    });
    document.addEventListener('keydown', function (e) {
        var key = (e.key || '').toLowerCase();
        if (e.ctrlKey && (key === 'u' || key === 's' || key === 'p')) {
            e.preventDefault();
        }
        if (key === 'f12') {
            e.preventDefault();
        }
        if (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
            e.preventDefault();
        }
    });

    var overlayId = 'tg-anti-peek';
    function showPeekGuard() {
        if (document.getElementById(overlayId)) return;
        var el = document.createElement('div');
        el.id = overlayId;
        el.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;background:#05050a;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Outfit,sans-serif;font-weight:800;font-size:1.2rem;letter-spacing:.04em;');
        el.textContent = 'TheGhost Coder — không được xem mã nguồn';
        document.documentElement.appendChild(el);
        document.documentElement.style.filter = 'blur(8px)';
    }
    function hidePeekGuard() {
        var el = document.getElementById(overlayId);
        if (el) el.remove();
        document.documentElement.style.filter = '';
    }
    function inspectOpen() {
        var gap = (window.outerWidth - window.innerWidth) > 220 || (window.outerHeight - window.innerHeight) > 220;
        return gap;
    }
    setInterval(function () {
        if (inspectOpen()) showPeekGuard();
        else hidePeekGuard();
    }, 800);
})();
