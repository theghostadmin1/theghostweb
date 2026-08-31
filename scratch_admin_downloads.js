document.addEventListener('DOMContentLoaded', () => {
    const sidebarUl = document.querySelectorAll('.sidebar-nav ul')[0];
    if (sidebarUl) {
        sidebarUl.insertAdjacentHTML('beforeend', `<li id="admin-menu-downloads"><a href="#" onclick="switchAdminPage('downloads')"><i class="fas fa-download"></i> Tải xuống</a></li>`);
    }
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        contentWrapper.insertAdjacentHTML('beforeend', `
            <div id="admin-downloads-page" class="page-section" style="display: none;">
                <div class="section-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 class="gradient-text"><i class="fas fa-download"></i> QUẢN LÝ TẢI XUỐNG</h2>
                        <p class="desc-text">Thêm, sửa, xóa các link tải Client/Tool ở trang chủ.</p>
                    </div>
                    <button class="btn-auth" style="width: auto; padding: 12px 25px;" onclick="openAddDownloadModal()"><i class="fas fa-plus"></i> Thêm Link Mới</button>
                </div>
                <div class="orders-container hover-glow">
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Tên ứng dụng</th>
                                    <th>Mô tả</th>
                                    <th>Version</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody id="admin-downloads-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `);
    }
    document.body.insertAdjacentHTML('beforeend', `
    <div id="admin-add-download-modal" class="modal-overlay" style="display: none;">
        <div class="modal-card glass-panel" style="width: 480px;">
            <button class="close-modal" onclick="closeAddDownloadModal()">×</button>
            <h2 class="gradient-text" style="text-align:center; margin-bottom: 25px;"><i class="fas fa-plus-circle"></i> THÊM TẢI XUỐNG</h2>
            <div class="input-group"><i class="fas fa-box"></i><input type="text" id="dl-name" placeholder="Tên (VD: TheGhost Client)"></div>
            <div class="input-group"><i class="fas fa-info"></i><input type="text" id="dl-desc" placeholder="Mô tả"></div>
            <div class="input-group"><i class="fas fa-code-branch"></i><input type="text" id="dl-version" placeholder="Version (VD: v1.0.0)"></div>
            <div class="input-group"><i class="fas fa-link"></i><input type="text" id="dl-url" placeholder="Link tải (Bắt buộc)"></div>
            <div class="input-group"><i class="fas fa-image"></i><input type="text" id="dl-img" placeholder="URL Ảnh bìa"></div>
            <div class="input-group"><i class="fas fa-palette"></i><input type="text" id="dl-color" placeholder="Màu nền (VD: #10b981)"></div>
            <div class="input-group"><i class="fas fa-icons"></i><input type="text" id="dl-icon" placeholder="Icon Class (VD: fas fa-desktop)"></div>
            <button class="btn-auth" onclick="executeAddDownload()">LƯU VÀO DATABASE</button>
        </div>
    </div>
    `);

    // Tải danh sách lúc khởi động trang
    fetchDownloadsAdmin();
});
async function fetchDownloadsAdmin() {
    try {
        const res = await fetch(API_URL + '/downloads', { cache: 'no-store' });
        const data = await res.json();
        const tbody = document.getElementById('admin-downloads-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #ffeb3b; padding: 20px;">Chưa có link tải nào.</td></tr>';
            return;
        }
        data.forEach(dl => {
            const row = `<tr>
                <td><strong><i class="${dl.iconClass}" style="color:${dl.iconColor}"></i> ${dl.name}</strong></td>
                <td>${dl.description}</td>
                <td>${dl.version}</td>
                <td style="display:flex; gap:8px; justify-content:center;">
                    <button class="btn-admin-action" onclick="executeDeleteDownload('${dl._id}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3);"><i class="fas fa-trash"></i> Xóa</button>
                </td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (e) { console.error(e); }
}
function openAddDownloadModal() {
    const modal = document.getElementById('admin-add-download-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}
function closeAddDownloadModal() {
    const modal = document.getElementById('admin-add-download-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}
async function executeAddDownload() {
    const name = document.getElementById('dl-name').value;
    const url = document.getElementById('dl-url').value;
    if (!name || !url) return showToast("Vui lòng nhập Tên và Link tải!");
    try {
        const payload = {
            name, url,
            description: document.getElementById('dl-desc').value,
            version: document.getElementById('dl-version').value,
            imageUrl: document.getElementById('dl-img').value,
            iconColor: document.getElementById('dl-color').value || '#3b82f6',
            iconClass: document.getElementById('dl-icon').value || 'fas fa-download'
        };
        const res = await fetch(API_URL + '/downloads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        showToast(data.message);
        closeAddDownloadModal();
        fetchDownloadsAdmin();
    } catch (e) { showToast("Lỗi server!"); }
}
async function executeDeleteDownload(id) {
    if (confirm("Chắc chắn xóa link này?")) {
        try {
            const res = await fetch(API_URL + '/downloads/' + id, { method: 'DELETE' });
            const data = await res.json();
            showToast(data.message);
            fetchDownloadsAdmin();
        } catch (e) { showToast("Lỗi khi xóa!"); }
    }
}
