// scripts/flow.js - Enhanced with visual flow diagram

let currentShop = getCurrentShop();

async function getMovement(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.PROXY_MOVEMENT, 'POST', { date, shopname });
}

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;

    // Set shop icon
    const shopIcons = {
        'nimman-connex': 'N',
        'one-nimman': 'O',
        'maya-mall': 'M'
    };
    document.getElementById('shopIcon').textContent = shopIcons[currentShop] || 'S';
    document.getElementById('shopSubtitle').textContent = CONFIG.SHOP_NAMES[currentShop];

    await loadFlowData(today);

    document.getElementById('dateInput').addEventListener('change', async (e) => {
        await loadFlowData(e.target.value);
    });
}

async function loadFlowData(date) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('statsContainer').style.display = 'none';

        const data = await getMovement(date, currentShop);
        const summaryData = await getSummary(date, currentShop);

        displayFlowData(data, summaryData, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayFlowData(data, summaryData, date) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'block';

    const movementData = data['proxy/movement'][currentShop];
    const { totals, byCategory } = movementData;

    const summary = summaryData['dashboard/summary'][currentShop];
    const kpis = summary.kpis;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = date;

    // Display totals
    document.getElementById('inbound').textContent = formatNumber(totals.inbound);
    document.getElementById('internal').textContent = formatNumber(totals.internal);
    document.getElementById('outbound').textContent = formatNumber(totals.outbound);

    // Display front store and in-store
    document.getElementById('frontStoreValue').textContent = formatNumber(kpis.front_store);
    document.getElementById('inStoreValue').textContent = formatNumber(kpis.in_store);

    // Calculate conversion
    const conversion = ((kpis.in_store / kpis.front_store) * 100).toFixed(1);
    document.getElementById('conversionBadge').textContent = `${conversion}%`;

    // Display category flow if available
    if (byCategory && byCategory.inbound) {
        displayCategoryFlow(byCategory);
    }
}

function displayCategoryFlow(byCategory) {
    const inboundContainer = document.getElementById('inboundCategories');
    const outboundContainer = document.getElementById('outboundCategories');

    const categoryColors = {
        'Cafe & Restaurant': 'cafe',
        'Retail': 'retail',
        'Service': 'service',
        'Entertainment': 'entertainment',
        'Others': 'service'
    };

    // Clear containers
    inboundContainer.innerHTML = '';
    outboundContainer.innerHTML = '';

    // Display inbound categories (top 4)
    if (byCategory.inbound) {
        byCategory.inbound.slice(0, 4).forEach(item => {
            const colorClass = categoryColors[item.from_category] || 'retail';
            const node = document.createElement('div');
            node.className = `flow-node ${colorClass}`;
            node.innerHTML = `
                <div class="node-label">INBOUND</div>
                <div class="node-label" style="font-size: 0.65rem;">${item.from_category}</div>
                <div class="node-value">${formatNumber(item.value)}</div>
            `;
            inboundContainer.appendChild(node);
        });
    }

    // Display outbound categories (top 4)
    if (byCategory.outbound) {
        byCategory.outbound.slice(0, 4).forEach(item => {
            const colorClass = categoryColors[item.to_category] || 'retail';
            const node = document.createElement('div');
            node.className = `flow-node ${colorClass}`;
            node.innerHTML = `
                <div class="node-label">OUTBOUND</div>
                <div class="node-label" style="font-size: 0.65rem;">${item.to_category}</div>
                <div class="node-value">${formatNumber(item.value)}</div>
            `;
            outboundContainer.appendChild(node);
        });
    }
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

init();