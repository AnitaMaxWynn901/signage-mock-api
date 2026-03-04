// scripts/summary.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    await loadSummaryData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadSummaryData(e.target.value);
    });
}

async function loadSummaryData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        const data = await getSummary(date, currentShop);
        displaySummaryData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displaySummaryData(data, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    const summaryData = data["dashboard/summary"][currentShop];
    const kpis = summaryData.kpis;

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    const district = Number(kpis.district_count || 0);
    const area = Number(kpis.area_count || 0);
    const front = Number(kpis.front_store || 0);
    const instore = Number(kpis.in_store || 0);

    document.getElementById("districtCount").textContent = formatNumber(district);
    document.getElementById("areaCount").textContent = formatNumber(area);
    document.getElementById("frontStore").textContent = formatNumber(front);
    document.getElementById("inStore").textContent = formatNumber(instore);

    // Conversion (avoid divide-by-zero)
    const conversion = front > 0 ? ((instore / front) * 100).toFixed(1) : "0.0";
    document.getElementById("conversionRate").textContent = `${conversion}%`;

    renderChart({ district, area, front, instore });
}

function renderChart({ district, area, front, instore }) {
    // numbers shown above bars
    document.getElementById("chartDistrictValue").textContent = formatNumber(district);
    document.getElementById("chartAreaValue").textContent = formatNumber(area);
    document.getElementById("chartFrontValue").textContent = formatNumber(front);
    document.getElementById("chartInStoreValue").textContent = formatNumber(instore);

    // bar heights
    const values = [district, area, front, instore];
    const max = Math.max(...values, 1);

    const maxHeight = 220; // px inside chart
    const h = (v) => Math.max(14, Math.round((v / max) * maxHeight)); // min height looks nicer

    document.getElementById("barDistrict").style.height = `${h(district)}px`;
    document.getElementById("barArea").style.height = `${h(area)}px`;
    document.getElementById("barFront").style.height = `${h(front)}px`;
    document.getElementById("barInStore").style.height = `${h(instore)}px`;
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();