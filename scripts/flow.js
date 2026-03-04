// scripts/flow.js - Clean UI rendering

let currentShop = getCurrentShop();

async function getMovement(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.PROXY_MOVEMENT, "POST", { date, shopname });
}

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    const shopIcons = { "nimman-connex": "N", "one-nimman": "O", "maya-mall": "M" };
    document.getElementById("shopIcon").textContent = shopIcons[currentShop] || "S";
    document.getElementById("shopSubtitle").textContent = CONFIG.SHOP_NAMES[currentShop];

    await loadFlowData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadFlowData(e.target.value);
    });
}

async function loadFlowData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        const [movementRes, summaryRes] = await Promise.all([
            getMovement(date, currentShop),
            getSummary(date, currentShop),
        ]);

        displayFlowData(movementRes, summaryRes, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayFlowData(movementRes, summaryRes, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    const movementData = movementRes["proxy/movement"][currentShop];
    const { totals, byCategory } = movementData;

    const summary = summaryRes["dashboard/summary"][currentShop];
    const kpis = summary.kpis;

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    document.getElementById("inbound").textContent = formatNumber(totals.inbound);
    document.getElementById("internal").textContent = formatNumber(totals.internal);
    document.getElementById("outbound").textContent = formatNumber(totals.outbound);

    document.getElementById("frontStoreValue").textContent = formatNumber(kpis.front_store);
    document.getElementById("inStoreValue").textContent = formatNumber(kpis.in_store);

    const conversion = kpis.front_store > 0 ? ((kpis.in_store / kpis.front_store) * 100).toFixed(1) : "0.0";
    document.getElementById("conversionBadge").textContent = `${conversion}% conversion`;

    if (byCategory && (byCategory.inbound || byCategory.outbound)) {
        displayCategoryFlow(byCategory);
        displayCategoryBreakdown(byCategory);
    }
}

function displayCategoryFlow(byCategory) {
    const inboundContainer = document.getElementById("inboundCategories");
    const outboundContainer = document.getElementById("outboundCategories");

    const categoryClass = {
        "Cafe & Restaurant": "cafe",
        "Retail": "retail",
        "Service": "service",
        "Entertainment": "entertainment",
        "Others": "service",
    };

    inboundContainer.innerHTML = "";
    outboundContainer.innerHTML = "";

    (byCategory.inbound || []).slice(0, 4).forEach((item) => {
        const cls = categoryClass[item.from_category] || "retail";
        inboundContainer.appendChild(makeNode("Inbound", item.from_category, item.value, cls));
    });

    (byCategory.outbound || []).slice(0, 4).forEach((item) => {
        const cls = categoryClass[item.to_category] || "retail";
        outboundContainer.appendChild(makeNode("Outbound", item.to_category, item.value, cls));
    });
}

function makeNode(direction, category, value, cls) {
    const node = document.createElement("div");
    node.className = `flow-node ${cls}`;
    node.innerHTML = `
    <div class="node-label">${direction}</div>
    <div class="node-sub">${category}</div>
    <div class="node-value">${formatNumber(value)}</div>
  `;
    return node;
}

function displayCategoryBreakdown(byCategory) {
    const inboundBreakdown = document.getElementById("inboundBreakdown");
    const outboundBreakdown = document.getElementById("outboundBreakdown");

    const colors = {
        "Cafe & Restaurant": "#fb923c",
        "Retail": "#3b82f6",
        "Service": "#8b5cf6",
        "Entertainment": "#06b6d4",
        "Others": "#64748b",
    };

    // inbound
    const inbound = byCategory.inbound || [];
    if (inbound.length) {
        const max = Math.max(...inbound.map((x) => x.value), 1);
        inboundBreakdown.innerHTML = inbound.map((item) => {
            const pct = Math.round((item.value / max) * 100);
            const color = colors[item.from_category] || colors.Others;
            return `
        <div class="breakdown-item">
          <div class="color-dot" style="background:${color}"></div>
          <div>
            <div class="item-name">${item.from_category}</div>
            <div class="item-bar"><div class="item-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>
          <div class="item-value">${formatNumber(item.value)}</div>
        </div>
      `;
        }).join("");
    } else {
        inboundBreakdown.innerHTML = `<div style="color:var(--muted);font-size:13px;">No inbound data</div>`;
    }

    // outbound
    const outbound = byCategory.outbound || [];
    if (outbound.length) {
        const max = Math.max(...outbound.map((x) => x.value), 1);
        outboundBreakdown.innerHTML = outbound.map((item) => {
            const pct = Math.round((item.value / max) * 100);
            const color = colors[item.to_category] || colors.Others;
            return `
        <div class="breakdown-item">
          <div class="color-dot" style="background:${color}"></div>
          <div>
            <div class="item-name">${item.to_category}</div>
            <div class="item-bar"><div class="item-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>
          <div class="item-value">${formatNumber(item.value)}</div>
        </div>
      `;
        }).join("");
    } else {
        outboundBreakdown.innerHTML = `<div style="color:var(--muted);font-size:13px;">No outbound data</div>`;
    }
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();