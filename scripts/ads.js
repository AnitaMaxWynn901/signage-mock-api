// scripts/ads.js

let currentShop = getCurrentShop();

async function init() {
    const today = getTodayDate();
    document.getElementById("dateInput").value = today;

    await loadAdsData(today);

    document.getElementById("dateInput").addEventListener("change", async (e) => {
        await loadAdsData(e.target.value);
    });
}

async function loadAdsData(date) {
    try {
        document.getElementById("loading").style.display = "block";
        document.getElementById("error").style.display = "none";
        document.getElementById("statsContainer").style.display = "none";

        const data = await getAds(date, currentShop);
        displayAdsData(data, date);
    } catch (error) {
        showError(error.message);
    }
}

function displayAdsData(data, date) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("statsContainer").style.display = "block";

    const adsData = data["dashboard/ads"][currentShop];
    const { total, groups } = adsData;

    const shopIcons = { "nimman-connex": "N", "one-nimman": "O", "maya-mall": "M" };
    const shopIconEl = document.getElementById("shopIcon");
    if (shopIconEl) shopIconEl.textContent = shopIcons[currentShop] || "S";

    document.getElementById("shopName").textContent = CONFIG.SHOP_NAMES[currentShop];
    document.getElementById("date").textContent = date;

    document.getElementById("totalValue").textContent = formatNumber(total);

    // Gender
    document.getElementById("maleCount").textContent = formatNumber(groups.male.count);
    document.getElementById("malePercent").textContent = `${groups.male.percent}%`;
    document.getElementById("femaleCount").textContent = formatNumber(groups.female.count);
    document.getElementById("femalePercent").textContent = `${groups.female.percent}%`;

    // progress bars
    const maleBar = document.getElementById("maleBar");
    const femaleBar = document.getElementById("femaleBar");
    if (maleBar) maleBar.style.width = `${clampPercent(groups.male.percent)}%`;
    if (femaleBar) femaleBar.style.width = `${clampPercent(groups.female.percent)}%`;

    // Age totals
    document.getElementById("adultCount").textContent = formatNumber(groups.adult.count);
    document.getElementById("adultPercent").textContent = `${groups.adult.percent}%`;
    document.getElementById("elderlyCount").textContent = formatNumber(groups.elderly.count);
    document.getElementById("elderlyPercent").textContent = `${groups.elderly.percent}%`;
    document.getElementById("childCount").textContent = formatNumber(groups.child.count);
    document.getElementById("childPercent").textContent = `${groups.child.percent}%`;

    // Full pie chart (age)
    renderAgePie(total, [
        { key: "adult", label: "Adults", count: groups.adult.count, percent: groups.adult.percent, colorVar: "--pie-b" },     // green
        { key: "elderly", label: "Seniors", count: groups.elderly.count, percent: groups.elderly.percent, colorVar: "--pie-d" }, // purple
        { key: "child", label: "Children", count: groups.child.count, percent: groups.child.percent, colorVar: "--pie-c" },   // amber
        // We also show gender-based audience in separate section, so keep pie focused on age.
        // If you later add "teen" or "other", we can expand to 4 slices easily.
    ]);
}

function clampPercent(p) {
    const n = Number(p);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
}

function renderAgePie(total, slices) {
    const pie = document.getElementById("agePie");
    const legend = document.getElementById("ageLegend");
    const centerTotal = document.getElementById("ageTotal");
    if (!pie || !legend || !centerTotal) return;

    centerTotal.textContent = formatNumber(total);

    // Normalize percents in case they don't sum to 100 (rounding)
    const percents = slices.map(s => clampPercent(s.percent));
    const sum = percents.reduce((a, b) => a + b, 0) || 1;

    // We render as 4 segments for nicer balance:
    // Adults (green), Seniors (purple), Children (amber), Remaining (blue-ish) if any.
    const remaining = Math.max(0, 100 - sum);

    const full = [
        { label: slices[0].label, count: slices[0].count, percent: percents[0], color: "var(--pie-b)" }, // green
        { label: slices[1].label, count: slices[1].count, percent: percents[1], color: "var(--pie-d)" }, // purple
        { label: slices[2].label, count: slices[2].count, percent: percents[2], color: "var(--pie-c)" }, // amber
        { label: "Other", count: Math.max(0, total - (slices[0].count + slices[1].count + slices[2].count)), percent: remaining, color: "var(--pie-a)" }, // blue
    ].filter(x => x.percent > 0.1); // hide tiny slices

    // Compute angle stops (degrees)
    let acc = 0;
    const stops = [];
    for (const seg of full) {
        acc += (seg.percent / 100) * 360;
        stops.push(acc);
    }

    // Set CSS vars for conic-gradient stops
    pie.style.setProperty("--p1", `${stops[0] ?? 0}deg`);
    pie.style.setProperty("--p2", `${stops[1] ?? (stops[0] ?? 0)}deg`);
    pie.style.setProperty("--p3", `${stops[2] ?? (stops[1] ?? stops[0] ?? 0)}deg`);

    // Rebuild legend
    legend.innerHTML = full.map(seg => `
    <div class="legend-item">
      <div class="swatch" style="background:${seg.color}"></div>
      <div class="name">${seg.label}</div>
      <div class="meta">${formatNumber(seg.count)} • ${seg.percent.toFixed(1)}%</div>
    </div>
  `).join("");

    // Update the pie's gradient colors order to match 4 segments:
    // pie css uses --pie-a..d in order. We'll map:
    // segment1=--pie-a, seg2=--pie-b, seg3=--pie-c, seg4=--pie-d
    // But we already used fixed vars in css. For simplicity, keep css vars:
    // --pie-a blue, --pie-b green, --pie-c amber, --pie-d purple.
    // The segment order in CSS is: a->b->c->d.
    // So we want the first segment to be blue if "Other" exists.
    // If "Other" is hidden, the first segment should become Adults (green).
    //
    // Easiest: if "Other" is not present, rotate order by swapping colors:
    const hasOther = full.some(s => s.label === "Other");
    if (!hasOther) {
        // Put adults first: make blue look like adults by temporarily swapping variables
        pie.style.setProperty("--pie-a", "var(--pie-b)");
        pie.style.setProperty("--pie-b", "var(--pie-d)");
        pie.style.setProperty("--pie-c", "var(--pie-c)");
        pie.style.setProperty("--pie-d", "var(--pie-a)");
    } else {
        // reset to defaults
        pie.style.setProperty("--pie-a", "#2563eb");
        pie.style.setProperty("--pie-b", "#16a34a");
        pie.style.setProperty("--pie-c", "#f59e0b");
        pie.style.setProperty("--pie-d", "#8b5cf6");
    }
}

function showError(message) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("errorMessage").textContent = message;
}

init();