// scripts/login.js

const API = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
    ? CONFIG.API_URL
    : 'https://signage-mock-api.onrender.com';

// ── If already logged in, skip login page ─────────────────────────────────────
(function () {
    const session = getSession();
    if (session) {
        window.location.href = 'summary.html';
    }
})();

// ── Login ─────────────────────────────────────────────────────────────────────
async function doLogin() {
    const shopId = document.getElementById('shopId').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();

    // Basic validation
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

        // Save session
        saveSession(data.shop);

        // Redirect to dashboard
        window.location.href = 'summary.html';

    } catch (err) {
        showError('Connection error. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

// ── Allow Enter key to submit ──────────────────────────────────────────────────
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doLogin();
});

// ── Session helpers ───────────────────────────────────────────────────────────

function saveSession(shop) {
    sessionStorage.setItem('liff_shop', JSON.stringify(shop));
}

function getSession() {
    try {
        const raw = sessionStorage.getItem('liff_shop');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showError(msg) {
    const el = document.getElementById('errorMsg');
    document.getElementById('errorText').textContent = msg;
    el.classList.add('show');
}

function hideError() {
    document.getElementById('errorMsg').classList.remove('show');
}