// scripts/users.js

const API = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'https://signage-mock-api.onrender.com';

let allUsers = [];
let filtered = [];

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
    try {
        show('loading'); hide('error'); hide('mainContent');

        const res = await fetch(`${API}/api/v3/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        allUsers = await res.json();

        filtered = [...allUsers];
        renderStats();
        renderTable();
        show('mainContent');

    } catch (err) {
        document.getElementById('errorMessage').textContent = err.message;
        show('error');
    } finally {
        hide('loading');
    }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function renderStats() {
    document.getElementById('statTotal').textContent = allUsers.length;
    document.getElementById('statAdmins').textContent = allUsers.filter(u => u.role === 'admin').length;
    document.getElementById('statActive').textContent = allUsers.filter(u => u.active).length;
}

// ─── Table ────────────────────────────────────────────────────────────────────

function renderTable() {
    const q = (document.getElementById('searchInput').value || '').toLowerCase();
    const role = document.getElementById('roleFilter').value;

    filtered = allUsers.filter(u => {
        if (role && u.role !== role) return false;
        if (q && !u.email.toLowerCase().includes(q)) return false;
        return true;
    });

    const tbody = document.getElementById('usersTableBody');

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--muted);font-weight:600;">No users found</td></tr>`;
        document.getElementById('footerLabel').textContent = 'Showing 0 of 0 users';
        return;
    }

    tbody.innerHTML = filtered.map(u => {
        const isActive = Boolean(u.active);
        const checked = isActive ? 'checked' : '';
        const disabledAttr = u.is_self ? 'disabled' : '';
        const toggleDisabledClass = u.is_self ? 'disabled' : '';

        return `
      <tr>
        <td>
          <div class="user-avatar ${u.role}">
            ${u.email.charAt(0).toUpperCase()}
          </div>
        </td>
        <td>
          <span class="email-cell">${escHtml(u.email)}</span>
          ${u.is_self ? '<span class="self-tag">you</span>' : ''}
        </td>
        <td>
          <span class="role-badge ${u.role}">
            ${u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
          </span>
        </td>
        <td>
          <div class="toggle-wrap">
            <label class="toggle ${toggleDisabledClass}">
              <input type="checkbox" ${checked} ${disabledAttr}
                onchange="toggleActive(${u.id}, this.checked)">
              <div class="toggle-track"></div>
              <div class="toggle-thumb"></div>
            </label>
            <span class="status-label ${isActive ? 'active' : 'inactive'}">
              ${isActive ? 'Active' : 'Suspended'}
            </span>
            ${u.is_self ? '<span style="font-size:11px;color:var(--muted);font-style:italic;">cannot suspend yourself</span>' : ''}
          </div>
        </td>
        <td class="date-cell">${formatDate(u.created_at)}</td>
        <td>
          ${!u.is_self ? `
            <button class="act-btn remove" onclick="removeUser(${u.id}, '${escHtml(u.email)}')">
              🗑️ Remove
            </button>
          ` : ''}
        </td>
      </tr>
    `;
    }).join('');

    document.getElementById('footerLabel').textContent =
        `Showing ${filtered.length} of ${allUsers.length} users`;
}

// ─── Toggle active ────────────────────────────────────────────────────────────

async function toggleActive(id, isActive) {
    try {
        const res = await fetch(`${API}/api/v3/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: isActive }),
        });
        if (!res.ok) throw new Error('Failed to update');

        const updated = await res.json();
        const u = allUsers.find(x => x.id === id);
        if (u) u.active = updated.active;

        renderStats();
        renderTable();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ─── Remove user ──────────────────────────────────────────────────────────────

async function removeUser(id, email) {
    if (!confirm(`Remove ${email} from the admin panel?\nThis cannot be undone.`)) return;

    try {
        const res = await fetch(`${API}/api/v3/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');

        allUsers = allUsers.filter(u => u.id !== id);
        renderStats();
        renderTable();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function openModal() {
    document.getElementById('fEmail').value = '';
    document.getElementById('fRole').value = 'user';
    document.getElementById('modalOverlay').classList.add('open');
    setTimeout(() => document.getElementById('fEmail').focus(), 50);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
}

// Close on overlay click
document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

async function saveUser() {
    const email = document.getElementById('fEmail').value.trim();
    const role = document.getElementById('fRole').value;

    if (!email) { alert('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Please enter a valid email.'); return; }

    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Adding...';

    try {
        const res = await fetch(`${API}/api/v3/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to add user');
        }

        const newUser = await res.json();
        allUsers.push(newUser);

        renderStats();
        renderTable();
        closeModal();

    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add User';
    }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCSV() {
    const headers = ['id', 'email', 'role', 'active', 'created_at'];
    const rows = allUsers.map(u =>
        headers.map(h => `"${(u[h] ?? '').toString().replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'users-export.csv'; a.click();
    URL.revokeObjectURL(url);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function show(id) { const el = document.getElementById(id); if (el) el.style.display = 'block'; }
function hide(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

// ─── Start ────────────────────────────────────────────────────────────────────
init();