// scripts/api.js

async function fetchData(endpoint, method = 'POST', body = {}) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (method === 'POST') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(getApiUrl(endpoint), options);
        const data = await response.json();

        if (!data.success && data.success !== undefined) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function getSummary(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.DASHBOARD_SUMMARY, 'POST', { date, shopname });
}

async function getAds(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.DASHBOARD_ADS, 'POST', { date, shopname });
}

async function getViewer(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.DASHBOARD_VIEWER, 'POST', { date, shopname });
}

async function getCrowd(date, shopname) {
    return await fetchData(CONFIG.ENDPOINTS.PROXY_CROWD, 'POST', { date, shopname });
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function formatNumber(num) {
    return num.toLocaleString();
}