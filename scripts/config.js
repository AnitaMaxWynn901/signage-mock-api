// scripts/config.js

const CONFIG = {
    API_URL: 'https://signage-mock-api.onrender.com',

    SHOP_NAMES: {
        'nimman-connex': 'Nimman Connex',
        'one-nimman': 'One Nimman',
        'maya-mall': 'MAYA Lifestyle Shopping Center',
    },

    ENDPOINTS: {
        SUMMARY: '/api/v3/dashboard/summary',
        ADS: '/api/v3/dashboard/ads',
        VIEWER: '/api/v3/dashboard/viewer',
        CROWD: '/api/v3/proxy/crowd',
        MOVEMENT: '/api/v3/proxy/movement',
    },
};

function getApiUrl(endpoint) {
    return `${CONFIG.API_URL}${endpoint}`;
}

function getCurrentShop() {
    try {
        const raw = localStorage.getItem('liff_shop');
        if (!raw) { redirectToLogin(); return null; }
        const session = JSON.parse(raw);
        if (!session?.shopname_key) { redirectToLogin(); return null; }
        return session.shopname_key;
    } catch {
        redirectToLogin();
        return null;
    }
}

function getShopSession() {
    try {
        const raw = localStorage.getItem('liff_shop');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function redirectToLogin() {
    const page = window.location.pathname.split('/').pop();
    window.location.href = `login.html?redirect=${page}`;
}

function logout() {
    localStorage.removeItem('liff_shop');
    window.location.href = 'login.html';
}