// scripts/front-store.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;

    await loadFrontStoreData(today);

    document.getElementById('dateInput').addEventListener('change', async (e) => {
        await loadFrontStoreData(e.target.value);
    });
}

async function loadFrontStoreData(date) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('statsContainer').style.display = 'none';

        const data = await getSummary(date, currentShop);
        displayFrontStoreData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayFrontStoreData(data, date) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'block';

    const summaryData = data['dashboard/summary'][currentShop];
    const kpis = summaryData.kpis;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = `Data for ${date}`;

    document.getElementById('frontStoreCount').textContent = formatNumber(kpis.front_store);
    document.getElementById('districtCount').textContent = formatNumber(kpis.district_count);
    document.getElementById('inStoreCount').textContent = formatNumber(kpis.in_store);

    // Calculate conversion rate
    const conversionRate = ((kpis.in_store / kpis.front_store) * 100).toFixed(1);
    document.getElementById('conversionRate').textContent = `${conversionRate}%`;
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

init();