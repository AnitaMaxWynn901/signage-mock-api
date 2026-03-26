// scripts/admin-auth.js

function getAdminSession() {
    try {
        const raw = sessionStorage.getItem('admin_session');
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function requireAdminSession() {
    const session = getAdminSession();
    if (!session || !session.email) {
        window.location.href = 'admin-login.html';
        return null;
    }
    return session;
}

function isAdminRole() {
    const session = getAdminSession();
    return session && session.role === 'admin';
}

function adminLogout() {
    sessionStorage.removeItem('admin_session');
    window.location.href = 'admin-login.html';
}
