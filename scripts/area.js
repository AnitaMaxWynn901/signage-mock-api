// scripts/area.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;

    await loadAreaData(today);

    document.getElementById('dateInput').addEventListener('change', async (e) => {
        await loadAreaData(e.target.value);
    });
}

async function loadAreaData(date) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('statsContainer').style.display = 'none';

        const data = await getSummary(date, currentShop);
        displayAreaData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayAreaData(data, date) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'block';

    const summaryData = data['dashboard/summary'][currentShop];
    const kpis = summaryData.kpis;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = `Data for ${date}`;

    document.getElementById('areaCount').textContent = formatNumber(kpis.area_count);
    document.getElementById('districtCount').textContent = formatNumber(kpis.district_count);
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

init();