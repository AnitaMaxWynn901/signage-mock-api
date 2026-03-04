// scripts/front-store.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    await loadFrontStoreData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadFrontStoreData(e.target.value);
    });
}

async function loadFrontStoreData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        const data = await getSummary(date, currentShop);
        displayFrontStoreData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayFrontStoreData(data, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    const summaryData = data["dashboard/summary"][currentShop];
    const kpis = summaryData.kpis;

    const shopIcons = { "nimman-connex": "N", "one-nimman": "O", "maya-mall": "M" };
    const shopIconEl = document.getElementById("shopIcon");
    if (shopIconEl) shopIconEl.textContent = shopIcons[currentShop] || "S";

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    const front = Number(kpis.front_store || 0);
    const district = Number(kpis.district_count || 0);
    const instore = Number(kpis.in_store || 0);

    document.getElementById("frontStoreCount").textContent = formatNumber(front);
    document.getElementById("frontStoreMini").textContent = formatNumber(front);

    document.getElementById("districtCount").textContent = formatNumber(district);

    document.getElementById("inStoreCount").textContent = formatNumber(instore);
    document.getElementById("inStoreMini").textContent = formatNumber(instore);

    const conversionRate = front > 0 ? ((instore / front) * 100).toFixed(1) : "0.0";
    document.getElementById("conversionRate").textContent = `${conversionRate}%`;
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();