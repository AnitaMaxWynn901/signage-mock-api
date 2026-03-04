// scripts/area.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    await loadAreaData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadAreaData(e.target.value);
    });
}

async function loadAreaData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        // Load summary + crowd in parallel
        const [summaryRes, crowdRes] = await Promise.all([
            getSummary(date, currentShop),
            getCrowd(date, currentShop), // ✅ now comes from api.js
        ]);

        displayAreaData(summaryRes, crowdRes, date);
    } catch (error) {
        showError(error.message || String(error));
    }
}

function displayAreaData(summaryRes, crowdRes, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    // Header
    const shopIcons = { "nimman-connex": "N", "one-nimman": "O", "maya-mall": "M" };
    const shopIconEl = document.getElementById("shopIcon");
    if (shopIconEl) shopIconEl.textContent = shopIcons[currentShop] || "S";

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    // KPI from dashboard/summary
    const summaryData = summaryRes["dashboard/summary"]?.[currentShop];
    const kpis = summaryData?.kpis || {};

    document.getElementById("areaCount").textContent = formatNumber(kpis.area_count || 0);
    document.getElementById("districtCount").textContent = formatNumber(kpis.district_count || 0);

    // Proxy crowd sensors
    const shopCrowd = crowdRes["proxy/crowd"]?.[currentShop];

    // Cycle
    const cycleText = document.getElementById("cycleText");
    if (cycleText) cycleText.textContent = "Full day";

    // Last updated (unix seconds)
    const lastUpdatedEl = document.getElementById("lastUpdated");
    if (lastUpdatedEl) {
        const ts = shopCrowd?.lastUpdate;
        lastUpdatedEl.textContent = `Last updated: ${formatUnix(ts)}`;
    }

    // Latest sensor values (arrays like [{ts, value:"32.4"}])
    const temp = pickLatestNumber(shopCrowd?.temperature);
    const hum = pickLatestNumber(shopCrowd?.humidity);
    const pres = pickLatestNumber(shopCrowd?.pressure);

    const tEl = document.getElementById("tempVal");
    const hEl = document.getElementById("humidityVal");
    const pEl = document.getElementById("pressureVal");

    if (tEl) tEl.textContent = temp != null ? `${temp.toFixed(1)}°C` : "-";
    if (hEl) hEl.textContent = hum != null ? `${hum.toFixed(1)}%` : "-";
    if (pEl) pEl.textContent = pres != null ? `${Math.round(pres)} hPa` : "-";
}

function pickLatestNumber(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const latest = arr.reduce((a, b) => (Number(b.ts) > Number(a.ts) ? b : a), arr[0]);
    const n = Number(latest?.value);
    return Number.isFinite(n) ? n : null;
}

function formatUnix(ts) {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return "-";

    // proxy-crowd.json uses unix seconds
    const d = new Date(n * 1000);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();