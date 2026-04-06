// scripts/in-store.js
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
        const data = await getSummary(date, currentShop);
        render(data['dashboard/summary'][currentShop].kpis, date);
    } catch (e) { showError(e.message); }
    finally { showLoading(false); }
}

function render(kpis, date) {
    const instore = kpis.in_store || 0;
    const front = kpis.front_store || 0;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('inStoreCount').textContent = formatNumber(instore);
    document.getElementById('frontStoreCount').textContent = formatNumber(front);

    const conv = front > 0 ? ((instore / front) * 100).toFixed(1) : '0.0';
    document.getElementById('conversionRate').textContent = `${conv}%`;
    document.getElementById('conversionBig').textContent = `${conv}%`;

    const avgHr = Math.round(instore / 24);
    document.getElementById('avgPerHour').textContent = `~${formatNumber(avgHr)}`;

    const miniEl = document.getElementById('inStoreMini');
    if (miniEl) miniEl.textContent = formatNumber(instore);
    document.getElementById('statsContainer').style.display = 'block';
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