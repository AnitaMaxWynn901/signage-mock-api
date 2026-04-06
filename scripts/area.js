// scripts/area.js
const currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;
    const shopIconEl = document.getElementById('shopIcon');
    if (shopIconEl) shopIconEl.textContent = shopIcon(currentShop);
    await load(today);
    document.getElementById('dateInput').addEventListener('change', e => load(e.target.value));
}

async function load(date) {
    showLoading(true);
    try {
        const data = await getCrowd(date, currentShop);
        const crowd = data['proxy/crowd'][currentShop];
        render(crowd, date);
    } catch (e) { showError(e.message); }
    finally { showLoading(false); }
}

function render(crowd, date) {
    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('areaCount').textContent = formatNumber(crowd.total);

    const listEl = document.getElementById('deviceList');
    if (!listEl) return;

    if (!crowd.devices.length) {
        listEl.innerHTML = `<div style="color:var(--muted);font-size:13px;padding:12px 0;">No devices linked to this shop yet.</div>`;
        return;
    }

    const max = Math.max(...crowd.devices.map(d => d.value), 1);
    listEl.innerHTML = crowd.devices.map(d => {
        const pct = Math.round((d.value / max) * 100);
        return `
        <div class="device-row">
          <div class="device-left">
            <div class="device-badge">📡</div>
            <div class="device-meta">
              <div class="device-name">${esc(d.name)}</div>
              <div class="device-loc">${esc(d.deviceId)}</div>
            </div>
          </div>
          <div class="device-val">
            <div class="item-bar" style="width:100px;">
              <div class="item-bar-fill" style="width:${pct}%;background:var(--primary)"></div>
            </div>
            ${formatNumber(d.value)}
          </div>
        </div>`;
    }).join('');
    document.getElementById('statsContainer').style.display = 'block';
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function showLoading(on) {
    document.getElementById('loading').style.display = on ? 'block' : 'none';
    document.getElementById('statsContainer').style.display = on ? 'none' : 'block';
    document.getElementById('error').style.display = 'none';
}

function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = msg;
}

init();