// scripts/viewer.js
// Note: Real endpoint not yet available (P'Oat's scope). Returns zeros for now.
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
        const data = await getViewer(date, currentShop);
        const viewerData = data['dashboard/viewer'][currentShop];
        render(viewerData, date);
    } catch (e) { showError(e.message); }
    finally { showLoading(false); }
}

function render(viewerData, date) {
    const { total, groups } = viewerData;
    const g = groups;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('totalValue').textContent = formatNumber(total);

    setGroup('male', g.male);
    setGroup('female', g.female);
    setGroup('adult', g.adult);
    setGroup('elderly', g.elderly);
    setGroup('child', g.child);

    document.getElementById('statsContainer').style.display = 'block';
}

function setGroup(key, group) {
    const countEl = document.getElementById(`${key}Count`);
    const percentEl = document.getElementById(`${key}Percent`);
    const barEl = document.getElementById(`${key}Bar`);
    if (countEl) countEl.textContent = formatNumber(group?.count || 0);
    if (percentEl) percentEl.textContent = `${group?.percent || 0}%`;
    if (barEl) barEl.style.width = `${Math.min(100, group?.percent || 0)}%`;
}

function clampPercent(p) { return Math.max(0, Math.min(100, Number(p) || 0)); }

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