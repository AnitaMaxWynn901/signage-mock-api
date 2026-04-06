// scripts/flow.js
const currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;
    document.getElementById('shopIcon').textContent = shopIcon(currentShop);
    document.getElementById('shopSubtitle').textContent = CONFIG.SHOP_NAMES[currentShop];
    await load(today);
    document.getElementById('dateInput').addEventListener('change', e => load(e.target.value));
}

async function load(date) {
    showLoading(true);
    try {
        const data = await getMovement(date, currentShop);
        const movement = data['proxy/movement'][currentShop];
        render(movement, date);
    } catch (e) { showError(e.message); }
    finally { showLoading(false); }
}

function render(movement, date) {
    const { totals, byCategory } = movement;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;
    document.getElementById('inbound').textContent = formatNumber(totals.inbound);
    document.getElementById('internal').textContent = formatNumber(totals.internal);
    document.getElementById('outbound').textContent = formatNumber(totals.outbound);

    renderCategoryNodes(byCategory);
    renderBreakdown(byCategory);
    document.getElementById('statsContainer').style.display = 'block';
}

function renderCategoryNodes(byCategory) {
    const inEl = document.getElementById('inboundCategories');
    const outEl = document.getElementById('outboundCategories');
    if (!inEl || !outEl) return;

    inEl.innerHTML = '';
    outEl.innerHTML = '';

    (byCategory.inbound || []).slice(0, 4).forEach(item => inEl.appendChild(makeNode('Inbound', item.from_category, item.value)));
    (byCategory.outbound || []).slice(0, 4).forEach(item => outEl.appendChild(makeNode('Outbound', item.to_category, item.value)));
}

function makeNode(dir, category, value) {
    const el = document.createElement('div');
    el.className = 'flow-node retail';
    el.innerHTML = `
      <div class="node-label">${dir}</div>
      <div class="node-sub">${category}</div>
      <div class="node-value">${formatNumber(value)}</div>`;
    return el;
}

function renderBreakdown(byCategory) {
    const inEl = document.getElementById('inboundBreakdown');
    const outEl = document.getElementById('outboundBreakdown');
    if (!inEl || !outEl) return;

    inEl.innerHTML = makeBreakdownHtml(byCategory.inbound || [], 'from_category');
    outEl.innerHTML = makeBreakdownHtml(byCategory.outbound || [], 'to_category');
}

function makeBreakdownHtml(items, catKey) {
    if (!items.length) return `<div style="color:var(--muted);font-size:13px;">No data</div>`;
    const max = Math.max(...items.map(x => x.value), 1);
    return items.map(item => {
        const pct = Math.round((item.value / max) * 100);
        return `
        <div class="breakdown-item">
          <div class="color-dot" style="background:var(--primary)"></div>
          <div style="flex:1">
            <div class="item-name">${item[catKey]}</div>
            <div class="item-bar"><div class="item-bar-fill" style="width:${pct}%;background:var(--primary)"></div></div>
          </div>
          <div class="item-value">${formatNumber(item.value)}</div>
        </div>`;
    }).join('');
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