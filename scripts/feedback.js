// scripts/feedback.js
// LIFF-side: shop owner sends feedback and views their message history

const API = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'https://signage-mock-api.onrender.com';

let currentShopId = null;
let currentShopName = null;
let currentPhone = null;

// ─── Init ────────────────────────────────────────────────────────────────────

async function initFeedback() {
    // In real LINE LIFF: get shop from liff.getProfile() + your login session
    // For demo: load shops dropdown
    await loadShopsDropdown();

    const selector = document.getElementById('shopSelector');
    selector.addEventListener('change', () => {
        const opt = selector.options[selector.selectedIndex];
        currentShopId = opt.value || null;
        currentShopName = opt.dataset.name || null;
        currentPhone = opt.dataset.phone || null;

        const iconEl = document.getElementById('shopIcon');
        const nameEl = document.getElementById('shopName');
        if (iconEl) iconEl.textContent = currentShopName ? currentShopName.charAt(0).toUpperCase() : 'S';
        if (nameEl) nameEl.textContent = currentShopName || 'My Shop';

        loadHistory();
    });
}

async function loadShopsDropdown() {
    try {
        const res = await fetch(`${API}/api/v3/shops`);
        const json = await res.json();
        // API returns { success: true, shops: [...] }
        const shops = json.shops || json || [];

        const selector = document.getElementById('shopSelector');
        selector.innerHTML = `<option value="">— Select your shop (demo) —</option>`;

        (Array.isArray(shops) ? shops : []).forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.shop_id;
            opt.textContent = `${s.shop_id} — ${s.shop_name}`;
            opt.dataset.name = s.shop_name;
            opt.dataset.phone = s.phone_number || '';
            selector.appendChild(opt);
        });
    } catch (e) {
        console.error('Failed to load shops', e);
    }
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function submitFeedback() {
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!subject || !message) {
        alert('Please fill in Subject and Message.');
        return;
    }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const body = {
            shop_id: currentShopId || null,
            shop_name: currentShopName || null,
            phone: currentPhone || null,
            subject,
            message,
        };

        const res = await fetch(`${API}/api/v3/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('Failed to send');

        // Clear form
        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';

        // Show success
        const banner = document.getElementById('successBanner');
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 5000);

        // Reload history
        await loadHistory();

    } catch (err) {
        alert('Error sending message: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
    }
}

// ─── History ──────────────────────────────────────────────────────────────────

async function loadHistory() {
    const container = document.getElementById('historyContainer');
    if (!currentShopId) {
        container.innerHTML = `<div class="empty-history">Select a shop to see message history.</div>`;
        return;
    }

    container.innerHTML = `<div class="empty-history">Loading...</div>`;

    try {
        const res = await fetch(`${API}/api/v3/messages?shop_id=${encodeURIComponent(currentShopId)}`);
        const msgs = await res.json();

        if (!msgs || msgs.length === 0) {
            container.innerHTML = `<div class="empty-history">No messages yet. Send your first message above!</div>`;
            return;
        }

        container.innerHTML = msgs.map(m => `
      <div class="history-item">
        <div class="history-meta">
          <div class="history-subject">${escHtml(m.subject)}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="status-pill ${m.message_status}">${statusLabel(m.message_status)}</span>
            <span class="history-date">${formatDate(m.created_at)}</span>
          </div>
        </div>
        <div class="history-message">${escHtml(m.message)}</div>
        ${m.admin_reply ? `
          <div class="admin-reply-bubble">
            <div class="reply-label">💬 Admin Reply</div>
            <div class="reply-text">${escHtml(m.admin_reply)}</div>
          </div>
        ` : ''}
      </div>
    `).join('');

    } catch (err) {
        container.innerHTML = `<div class="empty-history">Failed to load history.</div>`;
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function statusLabel(s) {
    return s === 'UNREAD' ? '● Pending' : s === 'REPLIED' ? '✓ Replied' : '✕ Closed';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Start ────────────────────────────────────────────────────────────────────
initFeedback();