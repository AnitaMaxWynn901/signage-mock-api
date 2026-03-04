// scripts/config.js

const CONFIG = {
    API_URL: 'https://signage-mock-api.onrender.com',

    SHOP_NAMES: {
        'nimman-connex': 'Nimman Connex',
        'one-nimman': 'One Nimman',
        'maya-mall': 'MAYA Lifestyle Shopping Center'
    },

    ENDPOINTS: {
        DASHBOARD_SUMMARY: '/api/v3/dashboard/summary',
        DASHBOARD_ADS: '/api/v3/dashboard/ads',
        DASHBOARD_VIEWER: '/api/v3/dashboard/viewer',
        PROXY_CROWD: '/api/v3/proxy/crowd',
        PROXY_MOVEMENT: '/api/v3/proxy/movement',
        PROXY_DATAUNIQUE: '/api/v3/proxy/dataunique'
    }
};

function getApiUrl(endpoint) {
    return `${CONFIG.API_URL}${endpoint}`;
}

function getCurrentShop() {
    return localStorage.getItem('selectedShop') || 'nimman-connex';
}

function setCurrentShop(shop) {
    localStorage.setItem('selectedShop', shop);
}