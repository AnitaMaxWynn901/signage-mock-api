// scripts/feedback.js
// LIFF-side: shop owner sends feedback and views their message history

const API = (typeof CONFIG !== 'undefined' && CONFIG.API_URL)
    ? CONFIG.API_URL
    : 'https://signage-mock-api.onrender.com';

function initFeedback() {
    const session = getShopSession();
    if (!session || !session.shopname_key) {
        window.location.href = 'login.html?redirect=feedback.html';
        return;
    }
    const iconEl = document.getElementById('shopIcon');
    const nameEl = document.getElementById('shopName');
    if (iconEl) iconEl.textContent = session.shop_name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = session.shop_name;
    loadHistory(session.shop_id);
}

async function submitFeedback() {
    const session = getShopSession();
    if (!session) { window.location.href = 'login.html?redirect=feedback.html'; return; }

    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!subject || !message) { alert('Please fill in Subject and Message.'); return; }

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const res = await fetch(`${API}/api/v3/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shop_id: session.shop_id,
                shop_name: session.shop_name,
                phone: null,
                subject,
                message,
            }),
        });
        if (!res.ok) throw new Error('Failed to send');

        document.getElementById('subject').value = '';
        document.getElementById('message').value = '';

        const banner = document.getElementById('successBanner');
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 5000);

        await loadHistory(session.shop_id);
    } catch (err) {
        alert('Error sending message: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
    }
}

async function loadHistory(shopId) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = `<div class="empty-history">Loading...</div>`;
    try {
        const res = await fetch(`${API}/api/v3/messages?shop_id=${encodeURIComponent(shopId)}`);
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

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function statusLabel(s) {
    return s === 'UNREAD' ? '● Pending' : s === 'REPLIED' ? '✓ Replied' : '✕ Closed';
}
function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

initFeedback();