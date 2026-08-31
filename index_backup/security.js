// 1. Giấu tên trang, chỉ để lại tên miền (Tránh lộ URL admin hoặc index)
if (window.location.pathname !== '/') {
    window.history.replaceState(null, null, '/');
}

// 2. Chống chuột phải (Ngăn mở menu ngữ cảnh)
document.addEventListener('contextmenu', event => event.preventDefault());

// 3. Cho phép F12 nhưng chặn xem mã nguồn bằng Ctrl+U, Ctrl+S
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.keyCode === 85) || // Ctrl+U
        (e.ctrlKey && e.keyCode === 83)) { // Ctrl+S
        e.preventDefault();
        return false;
    }
});

// 4. Bẫy Debugger: Làm đóng băng DevTools và không cho nhìn thấy code khi F12 được mở
setInterval(function() {
    Function("debugger")();
}, 50);
