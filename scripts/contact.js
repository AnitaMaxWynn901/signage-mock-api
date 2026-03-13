// scripts/contact.js
// Admin inbox: view messages, reply, close, delete

const API = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) ? CONFIG.API_URL : 'https://signage-mock-api.onrender.com';

let allMessages = [];
let activeFilter = 'All';
let activeId = null;
let replyTargetId = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadMessages() {
    try {
        const res = await fetch(`${API}/api/v3/messages`);
        allMessages = await res.json();
        updateStats();
        renderList();
        // auto-open first unread
        const first = allMessages.find(m => m.message_status === 'UNREAD') || allMessages[0];
        if (first) openDetail(first.id);
    } catch (err) {
        document.getElementById('msgList').innerHTML = `<div class="msg-list-empty">Failed to load messages.</div>`;
    }
}

function updateStats() {
    document.getElementById('statTotal').textContent = allMessages.length;
    document.getElementById('statUnread').textContent = allMessages.filter(m => m.message_status === 'UNREAD').length;
    document.getElementById('statReplied').textContent = allMessages.filter(m => m.message_status === 'REPLIED').length;
    document.getElementById('statClosed').textContent = allMessages.filter(m => m.message_status === 'CLOSED').length;
}

// ─── List rendering ───────────────────────────────────────────────────────────

function setFilter(btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderList();
}

function renderList() {
    const q = (document.getElementById('searchInput').value || '').toLowerCase();

    const filtered = allMessages.filter(m => {
        if (activeFilter !== 'All' && m.message_status !== activeFilter) return false;
        if (q) {
            return (m.shop_name || '').toLowerCase().includes(q) ||
                (m.phone || '').includes(q) ||
                (m.subject || '').toLowerCase().includes(q) ||
                (m.message_id || '').toLowerCase().includes(q);
        }
        return true;
    });

    const list = document.getElementById('msgList');

    if (filtered.length === 0) {
        list.innerHTML = `<div class="msg-list-empty">No messages found.</div>`;
        return;
    }

    list.innerHTML = filtered.map(m => `
    <div class="msg-item ${m.message_status === 'UNREAD' ? 'unread-item' : ''} ${m.id === activeId ? 'active' : ''}"
         onclick="openDetail(${m.id})">
      <div class="msg-top">
        <div class="msg-shop">
          <span class="status-dot ${m.message_status}"></span>
          ${escHtml(m.shop_name || m.phone || 'Unknown')}
        </div>
        <div class="msg-date">${timeAgo(m.created_at)}</div>
      </div>
      <div class="msg-subject">${escHtml(m.subject)}</div>
      <div class="msg-preview">${escHtml(m.message)}</div>
    </div>
  `).join('');
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function openDetail(id) {
    activeId = id;
    const m = allMessages.find(x => x.id === id);
    if (!m) return;

    renderList(); // re-render list to update active state

    const panel = document.getElementById('detailPanel');
    panel.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-shop-name">${escHtml(m.subject)}</div>
        <div class="detail-meta">
          ${m.shop_name ? escHtml(m.shop_name) + ' · ' : ''}
          ${m.phone ? escHtml(m.phone) + ' · ' : ''}
          <span style="color:var(--primary);font-weight:800;">${m.message_id}</span>
        </div>
      </div>
      <span class="status-pill ${m.message_status}">${m.message_status}</span>
    </div>

    <div class="thread">
      <!-- Shop message -->
      <div class="bubble-row">
        <div class="bubble-avatar shop">${(m.shop_name || m.phone || '?').charAt(0).toUpperCase()}</div>
        <div class="bubble-content">
          <div class="bubble-meta">${escHtml(m.shop_name || m.phone || 'Unknown')} · ${formatDate(m.created_at)}</div>
          <div class="bubble shop">${escHtml(m.message)}</div>
        </div>
      </div>

      ${m.admin_reply ? `
        <div class="bubble-row admin">
          <div class="bubble-avatar admin">A</div>
          <div class="bubble-content">
            <div class="bubble-meta">${formatDate(m.updated_at)} · Admin</div>
            <div class="bubble admin-reply">${escHtml(m.admin_reply)}</div>
          </div>
        </div>
      ` : ''}
    </div>

    <div class="detail-actions">
      <button class="action-btn reply" onclick="openModal(${m.id})">
        💬 ${m.admin_reply ? 'Edit Reply' : 'Reply'}
      </button>
      ${m.message_status !== 'CLOSED' ? `
        <button class="action-btn close-btn" onclick="updateStatus(${m.id}, 'CLOSED')">✕ Close</button>
      ` : `
        <button class="action-btn close-btn" onclick="updateStatus(${m.id}, 'UNREAD')">↩ Reopen</button>
      `}
      <button class="action-btn delete-btn" onclick="deleteMessage(${m.id})">🗑️</button>
    </div>
  `;
}

// ─── Reply Modal ──────────────────────────────────────────────────────────────

function openModal(id) {
    const m = allMessages.find(x => x.id === id);
    if (!m) return;
    replyTargetId = id;

    document.getElementById('modalTitle').textContent = `Reply to ${m.message_id}`;
    document.getElementById('modalSub').textContent = `From: ${m.shop_name || m.phone || 'Unknown'} · Subject: ${m.subject}`;
    document.getElementById('modalOriginal').textContent = m.message;
    document.getElementById('replyText').value = m.admin_reply || '';
    document.getElementById('replyModal').style.display = 'flex';
    setTimeout(() => document.getElementById('replyText').focus(), 50);
}

function closeModal() {
    document.getElementById('replyModal').style.display = 'none';
    replyTargetId = null;
}

function closeModalOnBg(e) {
    if (e.target === e.currentTarget) closeModal();
}

async function submitReply() {
    const text = document.getElementById('replyText').value.trim();
    if (!text) { alert('Reply cannot be empty.'); return; }

    const btn = document.getElementById('sendReplyBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const res = await fetch(`${API}/api/v3/messages/${replyTargetId}/reply`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_reply: text }),
        });
        if (!res.ok) throw new Error('Failed');

        // Update local state
        const m = allMessages.find(x => x.id === replyTargetId);
        if (m) {
            m.admin_reply = text;
            m.message_status = 'REPLIED';
            m.updated_at = new Date().toISOString();
        }

        closeModal();
        updateStats();
        renderList();
        openDetail(replyTargetId);

    } catch (err) {
        alert('Error sending reply: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Reply';
    }
}

// ─── Status / Delete ──────────────────────────────────────────────────────────

async function updateStatus(id, status) {
    try {
        const res = await fetch(`${API}/api/v3/messages/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message_status: status }),
        });
        if (!res.ok) throw new Error('Failed');

        const m = allMessages.find(x => x.id === id);
        if (m) m.message_status = status;

        updateStats();
        renderList();
        openDetail(id);
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function deleteMessage(id) {
    if (!confirm('Delete this message? This cannot be undone.')) return;

    try {
        const res = await fetch(`${API}/api/v3/messages/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed');

        allMessages = allMessages.filter(x => x.id !== id);
        activeId = null;
        updateStats();
        renderList();
        document.getElementById('detailPanel').innerHTML = `<div class="detail-empty">Select a message from the list</div>`;
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

// ─── Start ────────────────────────────────────────────────────────────────────
loadMessages();