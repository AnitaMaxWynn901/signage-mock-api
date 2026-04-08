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
        const [crowdData, summaryData] = await Promise.all([
            getCrowd(date, currentShop),
            getSummary(date, currentShop),
            loadWeather(date),
        ]);
        const crowd = crowdData['proxy/crowd'][currentShop];
        const district = summaryData['dashboard/summary'][currentShop].kpis.district_count;
        render(crowd, date, district);
    } catch (e) { showError(e.message); }
    finally { showLoading(false); }
}

async function loadWeather(date) {
    try {
        // Chiang Mai coordinates
        const lat = 18.7883;
        const lng = 98.9853;
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&hourly=temperature_2m,relative_humidity_2m,surface_pressure&timezone=Asia/Bangkok&start_date=${date}&end_date=${date}`
        );
        const data = await res.json();

        if (data.hourly) {
            const temps = data.hourly.temperature_2m || [];
            const humids = data.hourly.relative_humidity_2m || [];
            const pressures = data.hourly.surface_pressure || [];

            const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

            const avgTemp = avg(temps);
            const avgHumidity = avg(humids);
            const avgPressure = avg(pressures);

            const tempEl = document.getElementById('tempVal');
            const humidEl = document.getElementById('humidityVal');
            const pressureEl = document.getElementById('pressureVal');

            if (tempEl && avgTemp !== null) tempEl.textContent = `${avgTemp.toFixed(1)} °C`;
            if (humidEl && avgHumidity !== null) humidEl.textContent = `${avgHumidity.toFixed(0)}%`;
            if (pressureEl && avgPressure !== null) pressureEl.textContent = `${avgPressure.toFixed(0)} hPa`;
        }
    } catch (err) {
        console.warn('Weather fetch failed:', err.message);
    }
}

function render(crowd, date, district) {
    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('areaCount').textContent = formatNumber(crowd.total);
    document.getElementById('districtCount').textContent = formatNumber(district || 0);

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