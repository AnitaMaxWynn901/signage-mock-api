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
        PROXY_DATAUNIQUE: '/api/v3/proxy/dataunique',
        PROXY_DAILY_SUMMERY: '/api/v3/proxy/daily-summery',
    }
};

function getApiUrl(endpoint) {
    return `${CONFIG.API_URL}${endpoint}`;
}

function getCurrentShop() {
    try {
        const raw = localStorage.getItem('liff_shop');
        if (!raw) {
            window.location.href = 'login.html';
            return null;
        }
        const session = JSON.parse(raw);
        if (!session || !session.shopname_key) {
            window.location.href = 'login.html';
            return null;
        }
        return session.shopname_key;
    } catch {
        window.location.href = 'login.html';
        return null;
    }
}

function getShopSession() {
    try {
        const raw = localStorage.getItem('liff_shop');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function logout() {
    localStorage.removeItem('liff_shop');
    window.location.href = 'login.html';
}