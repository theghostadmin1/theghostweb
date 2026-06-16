
// --- QUẢN LÝ TẢI XUỐNG DYNAMIC ---
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(fetchClientDownloads, 500);
});

async function fetchClientDownloads() {
    try {
        const res = await fetch(API_URL + '/downloads');
        const data = await res.json();
        
        const downloadContainer = document.querySelector('#download-page .stagger-2');
        if (!downloadContainer) return;
        
        downloadContainer.innerHTML = '';
        
        if (data.length === 0) {
            downloadContainer.innerHTML = '<p style="color: #fff;">Đang cập nhật link tải...</p>';
            return;
        }
        
        data.forEach(dl => {
            const card = `
                <div class="info-card hover-glow" style="border-top: 4px solid ${dl.iconColor}; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    <img src="${dl.imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'}" alt="App" style="width: 100%; height: 160px; object-fit: cover;">
                    <div style="padding: 20px; flex: 1; display: flex; flex-direction: column;">
                        <div class="card-title">
                            <h4><i class="${dl.iconClass}" style="color: ${dl.iconColor};"></i> ${dl.name}</h4>
                        </div>
                        <p class="desc-text" style="margin-top: 10px; flex: 1;">${dl.description}</p>
                        <button class="btn-auth" style="margin-top: 15px; background: ${hexToRgba(dl.iconColor, 0.1)}; border-color: ${hexToRgba(dl.iconColor, 0.3)}; color: ${dl.iconColor};" onclick="window.open('${dl.url}', '_blank')"><i class="fas fa-download"></i> Tải Ngay (${dl.version})</button>
                    </div>
                </div>
            `;
            downloadContainer.insertAdjacentHTML('beforeend', card);
        });
    } catch (e) { console.error("Lỗi khi tải downloads:", e); }
}

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return 'rgba(59, 130, 246, ' + alpha + ')';
}
