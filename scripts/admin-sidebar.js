// scripts/admin-sidebar.js

function initAdminSidebar(activePage) {
    const session = requireAdminSession();
    if (!session) return;

    const nav = [
        { id: 'home', icon: '🏠', label: 'Home', href: 'admin-home.html' },
        { id: 'shops', icon: '🏪', label: 'Shop Management', href: 'shops.html' },
        { id: 'devices', icon: '📡', label: 'Area Devices', href: 'area_devices.html' },
        { id: 'messages', icon: '✉️', label: 'Contact Messages', href: 'contact.html' },
        { id: 'users', icon: '👥', label: 'Users & Roles', href: 'users.html' },
    ];

    const isAdmin = isAdminRole();
    const roleLabel = isAdmin ? '🛡️ Admin' : '👤 User — View Only';
    const roleColor = isAdmin ? '#b45309' : '#6b7280';

    const sidebarEl = document.getElementById('adminSidebar');
    if (!sidebarEl) return;

    sidebarEl.innerHTML = `
        <div class="sb-brand">
            <div class="sb-logo">📊</div>
            <div>
                <div class="sb-title">Smart Signage</div>
                <div class="sb-sub">Admin Panel</div>
            </div>
        </div>

        <nav class="sb-nav">
            ${nav.map(item => `
                <a href="${item.href}" class="sb-item ${activePage === item.id ? 'active' : ''}">
                    <span class="sb-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>
            `).join('')}
        </nav>

        <div class="sb-footer">
            <div class="sb-user">
                <div class="sb-avatar">${session.email.charAt(0).toUpperCase()}</div>
                <div class="sb-user-info">
                    <div class="sb-email">${session.email}</div>
                    <div class="sb-role" style="color:${roleColor}">${roleLabel}</div>
                </div>
            </div>
            <button class="sb-logout" onclick="adminLogout()">Sign Out</button>
        </div>
    `;

    // Show read-only banner if user role
    // Show read-only banner if user role
    if (!isAdmin) {
        // 1. Add a global class to the body for CSS-based hiding
        document.body.classList.add('user-is-readonly');

        // 2. Create the banner
        const banner = document.createElement('div');
        banner.className = 'readonly-banner';
        banner.innerHTML = '👁️ View Only — Contact an admin to make changes';
        document.body.insertBefore(banner, document.body.firstChild);

        // 3. Optional: Extra JS safety to remove any leftover elements 
        // that might have loaded before this script
        const hideActionElements = () => {
            document.querySelectorAll('.act-btn, .tbtn, .sb-logout + button, [onclick*="open"], [onclick*="delete"], [onclick*="edit"], [onclick*="import"]').forEach(el => {
                el.style.display = 'none';
            });
        };

        hideActionElements();
        // Run again after a short delay to catch late-loading items
        setTimeout(hideActionElements, 1000);
    }
}
