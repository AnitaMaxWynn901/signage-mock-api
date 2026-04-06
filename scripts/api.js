// scripts/api.js

async function apiFetch(endpoint, body = null) {
    const method = body ? 'POST' : 'GET';
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(getApiUrl(endpoint), options);
    const data = await res.json();
    if (data.success === false) throw new Error(data.message || 'Request failed');
    return data;
}

// Convenience wrappers
const getSummary = (date, shopname) => apiFetch(CONFIG.ENDPOINTS.SUMMARY, { date, shopname });
const getCrowd = (date, shopname) => apiFetch(CONFIG.ENDPOINTS.CROWD, { date, shopname });
const getMovement = (date, shopname) => apiFetch(CONFIG.ENDPOINTS.MOVEMENT, { date, shopname });
const getAds = (date, shopname) => apiFetch(CONFIG.ENDPOINTS.ADS, { date, shopname });
const getViewer = (date, shopname) => apiFetch(CONFIG.ENDPOINTS.VIEWER, { date, shopname });

// Utilities
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function formatNumber(n) {
    return Number(n || 0).toLocaleString();
}

function shopIcon(shopname) {
    return { 'nimman-connex': 'N', 'one-nimman': 'O', 'maya-mall': 'M' }[shopname] || 'S';
}