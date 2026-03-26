// scripts/area-devices.js

const API = CONFIG.API_URL;

let allDevices = [];   // full list from API (with .shops[])
let allShops = [];   // for link modal
let filtered = [];

// For link modal
let linkDeviceId = null;
let linkedSet = new Set();

// For edit modal
let editingDeviceId = null;

// ── Init ────────────────────────────────────────
async function init() {
    try {
        show('loading'); hide('error'); hide('mainContent');

        const [devRes, shopRes] = await Promise.all([
            apiFetch(`${API}/api/v3/devices`),
            apiFetch(`${API}/api/v3/shops`)
        ]);

        allDevices = devRes.devices || [];
        allShops = shopRes.shops || [];
        filtered = [...allDevices];

        renderStats();
        renderTable();
        show('mainContent');

        document.getElementById('searchInput').addEventListener('input', applySearch);

    } catch (err) {
        document.getElementById('errorMessage').textContent = err.message;
        show('error');
    } finally {
        hide('loading');
    }
}

// ── Stats ────────────────────────────────────────
function renderStats() {
    const total = allDevices.length;
    const active = allDevices.filter(d => d.active).length;
    const inactive = total - active;
    const links = allDevices.reduce((s, d) => s + (d.shops?.length || 0), 0);

    setText('statTotal', total);
    setText('statActive', active);
    setText('statInactive', inactive);
    setText('statLinks', links);
    setText('deviceCountBadge', `${total} devices`);
}

// ── Search ───────────────────────────────────────
function applySearch() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    filtered = !q ? [...allDevices] : allDevices.filter(d =>
        (d.device_id || '').toLowerCase().includes(q) ||
        (d.name || '').toLowerCase().includes(q) ||
        (d.shops || []).some(s => (s.shop_name || '').toLowerCase().includes(q))
    );
    renderTable();
}

// ── Table ────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById('devicesTableBody');
    tbody.innerHTML = '';

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--muted);font-weight:600;">No devices found</td></tr>`;
        setText('footerLabel', 'Showing 0 of 0 devices');
        return;
    }

    filtered.forEach((dev, i) => {
        const isActive = Boolean(dev.active);
        const checked = isActive ? 'checked' : '';
        const statusCls = isActive ? 'active' : 'inactive';
        const statusTxt = isActive ? 'Active' : 'Inactive';

        const shopsHtml = (dev.shops && dev.shops.length)
            ? dev.shops.map(s => {
                const shopActive = s.active !== false;
                return `<span class="chip-shop ${shopActive ? 'linked' : ''}">
                    ${esc(s.shop_name || '—')}
                    ${!shopActive ? '<span class="dot-inactive">●</span>' : ''}
                </span>`;
            }).join('')
            : '<span style="color:var(--muted);font-size:12px;">— no links</span>';

        const createdDisplay = dev.created_at
            ? new Date(dev.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')
            : '—';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num">${i + 1}</td>
            <td class="dev-code">${esc(dev.device_id || '—')}</td>
            <td class="dev-name">${esc(dev.name || '—')}</td>
            <td><div class="chips">${shopsHtml}</div></td>
            <td>
                <div class="toggle-wrap">
                    <label class="toggle">
                        <input type="checkbox" ${checked} ${isAdminRole() ? '' : 'disabled'} onchange="toggleDevice('${esc(dev.device_id)}', this.checked)">
                        <div class="toggle-track"></div>
                        <div class="toggle-thumb"></div>
                    </label>
                    <span class="status-label ${statusCls}" id="devStatus_${esc(dev.device_id)}">${statusTxt}</span>
                </div>
            </td>
            <td class="date-cell">${createdDisplay}</td>
            <td>
                <div class="actions-cell">
                    <button class="act-btn edit"   onclick="openEditModal('${esc(dev.device_id)}')">✏️ Edit</button>
                    <button class="act-btn shops"  onclick="openLinkModal('${esc(dev.device_id)}')">🔗 Shops</button>
                    <button class="act-btn delete" onclick="deleteDevice('${esc(dev.device_id)}')">🗑️ Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    setText('footerLabel', `Showing ${filtered.length} of ${allDevices.length} devices`);
}

// ── Toggle active ────────────────────────────────
async function toggleDevice(deviceId, isActive) {
    try {
        if (!isAdminRole()) {
            const checkbox = document.querySelector(`input[onchange*="'${deviceId}'"]`);
            if (checkbox) checkbox.checked = !isActive;
            return;
        }
        await apiFetch(`${API}/api/v3/devices/${deviceId}`, 'PATCH', {
            active: isActive,
            status: isActive ? 'Active' : 'Inactive'
        });

        const dev = allDevices.find(d => d.device_id === deviceId);
        if (dev) { dev.active = isActive; dev.status = isActive ? 'Active' : 'Inactive'; }

        const label = document.getElementById(`devStatus_${deviceId}`);
        if (label) {
            label.textContent = isActive ? 'Active' : 'Inactive';
            label.className = `status-label ${isActive ? 'active' : 'inactive'}`;
        }

        renderStats();
    } catch (err) {
        alert('Failed to update status: ' + err.message);
    }
}

// ── Add / Edit Device Modal ───────────────────────
function openAddModal() {
    editingDeviceId = null;
    setText('deviceModalTitle', 'Add Device');
    setText('deviceModalSub', 'Add a new device to the system');
    setVal('fDeviceId', '');
    setVal('fDeviceName', '');
    document.getElementById('fStatusGroup').style.display = 'none';
    document.getElementById('deviceModal').classList.add('open');
}

function openEditModal(deviceId) {
    const dev = allDevices.find(d => d.device_id === deviceId);
    if (!dev) return;
    editingDeviceId = deviceId;
    setText('deviceModalTitle', 'Edit Device');
    setText('deviceModalSub', `Editing ${deviceId}`);
    setVal('fDeviceId', dev.device_id || '');
    setVal('fDeviceName', dev.name || '');
    setVal('fDeviceStatus', dev.status || 'Active');
    document.getElementById('fDeviceId').disabled = true;   // can't change PK
    document.getElementById('fStatusGroup').style.display = 'block';
    document.getElementById('deviceModal').classList.add('open');
}

function closeDeviceModal() {
    document.getElementById('deviceModal').classList.remove('open');
    document.getElementById('fDeviceId').disabled = false;
    editingDeviceId = null;
}

async function saveDevice() {
    const deviceId = getVal('fDeviceId').trim();
    const name = getVal('fDeviceName').trim();
    const status = getVal('fDeviceStatus') || 'Active';

    if (!name) { alert('Name is required.'); return; }

    try {
        if (editingDeviceId) {
            // PATCH
            const updated = await apiFetch(`${API}/api/v3/devices/${editingDeviceId}`, 'PATCH', {
                name,
                status,
                active: status === 'Active'
            });
            const idx = allDevices.findIndex(d => d.device_id === editingDeviceId);
            if (idx !== -1) allDevices[idx] = { ...allDevices[idx], ...updated.device };
        } else {
            // POST
            if (!deviceId) { alert('Device Code is required.'); return; }
            const created = await apiFetch(`${API}/api/v3/devices`, 'POST', {
                device_id: deviceId,
                name,
                status,
                active: status === 'Active'
            });
            allDevices.push({ ...created.device, shops: [] });
        }

        applySearch();
        renderStats();
        closeDeviceModal();

    } catch (err) {
        alert('Error saving device: ' + err.message);
    }
}

// ── Delete ───────────────────────────────────────
async function deleteDevice(deviceId) {
    if (!confirm(`Delete device ${deviceId}? This cannot be undone.`)) return;
    try {
        await apiFetch(`${API}/api/v3/devices/${deviceId}`, 'DELETE');
        allDevices = allDevices.filter(d => d.device_id !== deviceId);
        applySearch();
        renderStats();
    } catch (err) {
        alert('Error deleting device: ' + err.message);
    }
}

// ── Link Shops Modal ──────────────────────────────
function openLinkModal(deviceId) {
    const dev = allDevices.find(d => d.device_id === deviceId);
    if (!dev) return;

    linkDeviceId = deviceId;
    linkedSet = new Set((dev.shops || []).map(s => s.shop_id));

    setText('linkDeviceCode', deviceId);
    setVal('linkSearchInput', '');

    renderShopList('');
    document.getElementById('linkModal').classList.add('open');

    document.getElementById('linkSearchInput').oninput = function () {
        renderShopList(this.value.toLowerCase().trim());
    };
}

function renderShopList(query) {
    const list = document.getElementById('shopList');
    const shops = query
        ? allShops.filter(s =>
            (s.shop_id || '').toLowerCase().includes(query) ||
            (s.shop_name || '').toLowerCase().includes(query) ||
            (s.category || '').toLowerCase().includes(query)
        )
        : allShops;

    if (!shops.length) {
        list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">No shops found</div>`;
        return;
    }

    list.innerHTML = shops.map(shop => {
        const isChecked = linkedSet.has(shop.shop_id);
        const isActive = Boolean(shop.active);
        return `
            <div class="shop-check-row ${isChecked ? 'checked' : ''}"
                 onclick="toggleShopLink('${esc(shop.shop_id)}')">
                <div class="custom-check ${isChecked ? 'on' : ''}" id="chk_${esc(shop.shop_id)}">
                    ${isChecked ? '✓' : ''}
                </div>
                <div style="flex:1;">
                    <div class="shop-check-name">${esc(shop.shop_name || '—')}</div>
                    <div class="shop-check-sub">${esc(shop.shop_id || '—')} · ${esc(shop.category || '—')}</div>
                </div>
                <span class="shop-status-pill ${isActive ? 'active' : 'inactive'}">
                    ${isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
        `;
    }).join('');

    updateLinkCount();
}

function toggleShopLink(shopId) {
    if (linkedSet.has(shopId)) {
        linkedSet.delete(shopId);
    } else {
        linkedSet.add(shopId);
    }
    // Re-render list with current search
    const q = document.getElementById('linkSearchInput').value.toLowerCase().trim();
    renderShopList(q);
}

function updateLinkCount() {
    setText('linkCount', `${linkedSet.size} shop${linkedSet.size !== 1 ? 's' : ''} selected`);
}

function closeLinkModal() {
    document.getElementById('linkModal').classList.remove('open');
    linkDeviceId = null;
    linkedSet = new Set();
}

async function saveLinks() {
    if (!linkDeviceId) return;
    try {
        await apiFetch(`${API}/api/v3/devices/${linkDeviceId}/shops`, 'PUT', {
            shop_ids: [...linkedSet]
        });

        // Update local device shops list
        const dev = allDevices.find(d => d.device_id === linkDeviceId);
        if (dev) {
            dev.shops = allShops
                .filter(s => linkedSet.has(s.shop_id))
                .map(s => ({ shop_id: s.shop_id, shop_name: s.shop_name, category: s.category, active: s.active }));
        }

        applySearch();
        renderStats();
        closeLinkModal();

    } catch (err) {
        alert('Error saving links: ' + err.message);
    }
}

// ── Close modals on overlay click ────────────────
document.getElementById('deviceModal').addEventListener('click', function (e) {
    if (e.target === this) closeDeviceModal();
});
document.getElementById('linkModal').addEventListener('click', function (e) {
    if (e.target === this) closeLinkModal();
});

// ── Helpers ───────────────────────────────────────
async function apiFetch(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (data.success === false) throw new Error(data.message || 'API error');
    return data;
}

function show(id) { document.getElementById(id).style.display = 'block'; }
function hide(id) { document.getElementById(id).style.display = 'none'; }
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ── Start ─────────────────────────────────────────
init();