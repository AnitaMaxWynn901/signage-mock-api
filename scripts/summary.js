// scripts/summary.js
const currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;
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
    const { district_count: district, area_count: area, front_store: front, in_store: instore } = kpis;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('districtCount').textContent = formatNumber(district);
    document.getElementById('areaCount').textContent = formatNumber(area);
    document.getElementById('frontStore').textContent = formatNumber(front);
    document.getElementById('inStore').textContent = formatNumber(instore);

    const conv = front > 0 ? ((instore / front) * 100).toFixed(1) : '0.0';
    document.getElementById('conversionRate').textContent = `${conv}%`;

    renderChart({ district, area, front, instore });
    document.getElementById('statsContainer').style.display = 'block';
}

function renderChart({ district, area, front, instore }) {
    const ids = ['District', 'Area', 'Front', 'InStore'];
    const vals = [district, area, front, instore];
    const max = Math.max(...vals, 1);
    const maxH = 220;
    const h = v => Math.max(14, Math.round((v / max) * maxH));

    document.getElementById('chartDistrictValue').textContent = formatNumber(district);
    document.getElementById('chartAreaValue').textContent = formatNumber(area);
    document.getElementById('chartFrontValue').textContent = formatNumber(front);
    document.getElementById('chartInStoreValue').textContent = formatNumber(instore);

    document.getElementById('barDistrict').style.height = `${h(district)}px`;
    document.getElementById('barArea').style.height = `${h(area)}px`;
    document.getElementById('barFront').style.height = `${h(front)}px`;
    document.getElementById('barInStore').style.height = `${h(instore)}px`;
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