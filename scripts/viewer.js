// scripts/viewer.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    await loadViewerData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadViewerData(e.target.value);
    });
}

async function loadViewerData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        const data = await getViewer(date, currentShop);
        displayViewerData(data, date);
    } catch (error) {
        showError(error.message || String(error));
    }
}

function displayViewerData(data, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    const viewerData = data["dashboard/viewer"]?.[currentShop];
    const { total, groups } = viewerData || { total: 0, groups: {} };

    // Header
    const shopIcons = { "nimman-connex": "N", "one-nimman": "O", "maya-mall": "M" };
    const shopIconEl = document.getElementById("shopIcon");
    if (shopIconEl) shopIconEl.textContent = shopIcons[currentShop] || "S";

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    // Total viewers
    document.getElementById("totalValue").textContent = formatNumber(total || 0);

    // Safe group fallbacks
    const male = groups?.male || { count: 0, percent: 0 };
    const female = groups?.female || { count: 0, percent: 0 };
    const adult = groups?.adult || { count: 0, percent: 0 };
    const elderly = groups?.elderly || { count: 0, percent: 0 };
    const child = groups?.child || { count: 0, percent: 0 };

    // Gender numbers
    document.getElementById("maleCount").textContent = formatNumber(male.count || 0);
    document.getElementById("malePercent").textContent = `${clampPercent(male.percent)}%`;

    document.getElementById("femaleCount").textContent = formatNumber(female.count || 0);
    document.getElementById("femalePercent").textContent = `${clampPercent(female.percent)}%`;

    // Gender bar widths
    const maleBar = document.getElementById("maleBar");
    const femaleBar = document.getElementById("femaleBar");

    if (maleBar) maleBar.style.width = `${clampPercent(male.percent)}%`;
    if (femaleBar) femaleBar.style.width = `${clampPercent(female.percent)}%`;

    // Age groups
    document.getElementById("adultCount").textContent = formatNumber(adult.count || 0);
    document.getElementById("adultPercent").textContent = `${clampPercent(adult.percent)}%`;

    document.getElementById("elderlyCount").textContent = formatNumber(elderly.count || 0);
    document.getElementById("elderlyPercent").textContent = `${clampPercent(elderly.percent)}%`;

    document.getElementById("childCount").textContent = formatNumber(child.count || 0);
    document.getElementById("childPercent").textContent = `${clampPercent(child.percent)}%`;
}

function clampPercent(p) {
    const n = Number(p);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();