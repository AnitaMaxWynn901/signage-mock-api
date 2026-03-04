// scripts/in-store.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    await loadInStoreData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadInStoreData(e.target.value);
    });
}

// Proxy daily summery endpoint (fallback if CONFIG is missing)
async function getDailySummery(date, shopname) {
    const endpoint =
        (CONFIG?.ENDPOINTS?.PROXY_DAILY_SUMMERY) ||
        (CONFIG?.ENDPOINTS?.PROXY_DAILY_SUMMARY) ||
        "/api/v3/proxy/daily-summery";

    // Uses the same fetchData pattern as other APIs
    return await fetchData(endpoint, "POST", { date, shopname });
}

async function loadInStoreData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        // Keep the same core logic: summary drives main KPIs.
        // Also load devices list from proxy daily summery.
        const [summaryRes, dailyRes] = await Promise.all([
            getSummary(date, currentShop),
            getDailySummery(date, currentShop),
        ]);

        displayInStoreData(summaryRes, dailyRes, date);
    } catch (error) {
        showError(error.message || String(error));
    }
}

function displayInStoreData(summaryRes, dailyRes, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    // Header icon
    const shopIcons = { "nimman-connex": "N", "one-nimman": "O", "maya-mall": "M" };
    const shopIconEl = document.getElementById("shopIcon");
    if (shopIconEl) shopIconEl.textContent = shopIcons[currentShop] || "S";

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    // Summary KPIs
    const summaryData = summaryRes["dashboard/summary"]?.[currentShop];
    const kpis = summaryData?.kpis || {};

    const inStore = Number(kpis.in_store || 0);
    const frontStore = Number(kpis.front_store || 0);

    document.getElementById("inStoreCount").textContent = formatNumber(inStore);
    document.getElementById("inStoreMini").textContent = formatNumber(inStore);
    document.getElementById("frontStoreCount").textContent = formatNumber(frontStore);

    // Conversion rate (safe)
    const conversionRate = frontStore > 0 ? ((inStore / frontStore) * 100).toFixed(1) : "0.0";
    document.getElementById("conversionRate").textContent = `${conversionRate}%`;
    document.getElementById("conversionBig").textContent = `${conversionRate}%`;

    // Avg/hour (simple, consistent; assumes full day ~ 24h)
    const avgHr = Math.round(inStore / 24);
    document.getElementById("avgPerHour").textContent = `~${formatNumber(avgHr)}`;

    // Device list from proxy daily summery
    // Structure: { "proxy/daily-summery": { [shop]: { data:[{name_name, location, total_devices}] } } }
    const shopDaily = dailyRes["proxy/daily-summery"]?.[currentShop];
    const rows = Array.isArray(shopDaily?.data) ? shopDaily.data : [];

    const totalDevices = rows.reduce((sum, r) => sum + Number(r.total_devices || 0), 0);
    document.getElementById("deviceTotal").textContent = formatNumber(totalDevices);

    renderDeviceList(rows, totalDevices);
}

function renderDeviceList(rows, totalDevices) {
    const listEl = document.getElementById("deviceList");
    if (!listEl) return;

    if (!rows.length) {
        listEl.innerHTML = `<div style="color:var(--muted);font-weight:700;padding:10px 0;">No device data</div>`;
        return;
    }

    listEl.innerHTML = rows
        .map((r) => {
            const name = escapeHtml(String(r.name_name ?? "Sensor"));
            const loc = escapeHtml(String(r.location ?? "-"));
            const v = Number(r.total_devices || 0);
            const pct = totalDevices > 0 ? Math.max(0, Math.min(100, (v / totalDevices) * 100)) : 0;

            return `
        <div class="device-row">
          <div class="device-left">
            <div class="device-badge">📟</div>
            <div class="device-meta">
              <div class="device-name">${name}</div>
              <div class="device-loc">${loc}</div>
            </div>
          </div>

          <div class="device-val">
            <div class="spark" title="${pct.toFixed(1)}%"></div>
            ${formatNumber(v)}
          </div>
        </div>
      `;
        })
        .join("");
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    }[m]));
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();