// scripts/login.js

const API = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
    ? CONFIG.API_URL
    : 'https://signage-mock-api.onrender.com';

// ── If already logged in, skip login page
(function () {
    const raw = sessionStorage.getItem('liff_shop');
    if (raw) {
        try {
            const session = JSON.parse(raw);
            if (session && session.shopname_key) {
                window.location.href = 'summary.html';
            }
        } catch { }
    }
})();

// ── Login
async function doLogin() {
    const shopId = document.getElementById('shopId').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    if (!shopId || !phoneNumber) {
        showError('Please enter both Shop ID and phone number.');
        return;
    }

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    hideError();

    try {
        const res = await fetch(`${API}/api/v3/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shop_id: shopId, phone_number: phoneNumber }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            showError(data.message || 'Login failed. Please try again.');
            return;
        }

        // Save to localStorage — persists across tabs and links
        sessionStorage.setItem('liff_shop', JSON.stringify(data.shop));

        window.location.href = 'summary.html';

    } catch (err) {
        showError('Connection error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
});

function showError(msg) {
    const el = document.getElementById('errorMsg');
    document.getElementById('errorText').textContent = msg;
    el.classList.add('show');
}

function hideError() {
    document.getElementById('errorMsg').classList.remove('show');
}