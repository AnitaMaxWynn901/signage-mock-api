// scripts/ads.js
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
        const data = await getAds(date, currentShop);
        const adsData = data['dashboard/ads'][currentShop];
        render(adsData, date);
    } catch (e) { showError(e.message); }
    finally { showLoading(false); }
}

function render(adsData, date) {
    const { total, groups } = adsData;
    const g = groups;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('totalValue').textContent = formatNumber(total);

    setGroup('male', g.male);
    setGroup('female', g.female);
    setGroup('adult', g.adult);
    setGroup('elderly', g.elderly);
    setGroup('child', g.child);

    renderAgePie(total, g);
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

function renderAgePie(total, groups) {
    const pie = document.getElementById('agePie');
    const legend = document.getElementById('ageLegend');
    const centerEl = document.getElementById('ageTotal');
    if (!pie || !legend || !centerEl) return;

    centerEl.textContent = formatNumber(total);

    const slices = [
        { label: 'Adults', count: groups.adult?.count || 0, percent: groups.adult?.percent || 0, color: '#16a34a' },
        { label: 'Seniors', count: groups.elderly?.count || 0, percent: groups.elderly?.percent || 0, color: '#8b5cf6' },
        { label: 'Children', count: groups.child?.count || 0, percent: groups.child?.percent || 0, color: '#f59e0b' },
    ].filter(s => s.percent > 0);

    let acc = 0;
    const stops = slices.map(s => { acc += (s.percent / 100) * 360; return acc; });
    pie.style.setProperty('--p1', `${stops[0] || 0}deg`);
    pie.style.setProperty('--p2', `${stops[1] || stops[0] || 0}deg`);
    pie.style.setProperty('--p3', `${stops[2] || stops[1] || 0}deg`);

    legend.innerHTML = slices.map(s => `
    <div class="legend-item">
      <div class="swatch" style="background:${s.color}"></div>
      <div class="name">${s.label}</div>
      <div class="meta">${formatNumber(s.count)} · ${s.percent}%</div>
    </div>`).join('');
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