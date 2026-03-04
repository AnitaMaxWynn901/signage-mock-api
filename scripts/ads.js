// scripts/ads.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById('dateInput').value = today;

    await loadAdsData(today);

    document.getElementById('dateInput').addEventListener('change', async (e) => {
        await loadAdsData(e.target.value);
    });
}

async function loadAdsData(date) {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('statsContainer').style.display = 'none';

        const data = await getAds(date, currentShop);
        displayAdsData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayAdsData(data, date) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('statsContainer').style.display = 'block';

    const adsData = data['dashboard/ads'][currentShop];
    const { total, groups } = adsData;

    document.getElementById('shopName').textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById('date').textContent = `Data for ${date}`;

    document.getElementById('totalValue').textContent = formatNumber(total);

    document.getElementById('maleCount').textContent = formatNumber(groups.male.count);
    document.getElementById('malePercent').textContent = `${groups.male.percent}%`;

    document.getElementById('femaleCount').textContent = formatNumber(groups.female.count);
    document.getElementById('femalePercent').textContent = `${groups.female.percent}%`;

    document.getElementById('adultCount').textContent = formatNumber(groups.adult.count);
    document.getElementById('adultPercent').textContent = `${groups.adult.percent}%`;

    document.getElementById('elderlyCount').textContent = formatNumber(groups.elderly.count);
    document.getElementById('elderlyPercent').textContent = `${groups.elderly.percent}%`;

    document.getElementById('childCount').textContent = formatNumber(groups.child.count);
    document.getElementById('childPercent').textContent = `${groups.child.percent}%`;
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

init();