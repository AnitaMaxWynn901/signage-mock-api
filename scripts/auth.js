// scripts/auth.js
// Include this in every LIFF page BEFORE the page's own script
// <script src="../scripts/auth.js"></script>

// ── Get session ───────────────────────────────────────────────────────────────

function getSession() {
    try {
        const raw = sessionStorage.getItem('liff_shop');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ── Require login — redirects to login.html if not logged in ──────────────────

function requireLogin() {
    const session = getSession();
    if (!session || !session.shopname_key) {
        window.location.href = 'login.html';
        return null;
    }
    return session;
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout() {
    sessionStorage.removeItem('liff_shop');
    window.location.href = 'login.html';
}

// ── Apply shop info to header elements ───────────────────────────────────────
// Call this after requireLogin() to fill in the header

function applyShopToHeader(session) {
    const nameEl = document.getElementById('shopName');
    const iconEl = document.getElementById('shopIcon');

    if (nameEl) nameEl.textContent = session.shop_name;
    if (iconEl) iconEl.textContent = session.shop_name.charAt(0).toUpperCase();
}