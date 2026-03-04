// scripts/flow.js

let currentShop = getCurrentShop();

// Add API function for movement data
async function getMovement(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.PROXY_MOVEMENT, 'POST', { date, shopname });
}

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;

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
        displayFlowData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayFlowData(data, date) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'block';

    const movementData = data['proxy/movement'][currentShop];
    const { totals, byCategory } = movementData;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = `Data for ${date}`;

    // Display totals
    document.getElementById('inbound').textContent = formatNumber(totals.inbound);
    document.getElementById('internal').textContent = formatNumber(totals.internal);
    document.getElementById('outbound').textContent = formatNumber(totals.outbound);
    document.getElementById('overall').textContent = formatNumber(totals.overall);

    // Display category breakdown if available
    if (byCategory) {
        displayCategoryFlow(byCategory);
    }
}

function displayCategoryFlow(byCategory) {
    const container = document.getElementById('categoryFlow');

    if (!byCategory.inbound) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center;">No category data available</p>';
        return;
    }

    let html = '<h4 class="mb-sm">Inbound Categories</h4><div class="mb-md">';
    byCategory.inbound.forEach(item => {
        html += `
            <div style="padding: var(--spacing-sm); border-left: 3px solid var(--info-color); margin-bottom: var(--spacing-sm); background: rgba(66, 153, 225, 0.05);">
                <strong>${item.from_category}</strong>: ${formatNumber(item.value)}
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

init();