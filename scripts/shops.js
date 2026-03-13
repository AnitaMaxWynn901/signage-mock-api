// scripts/shops.js

let allShops = [];
let filteredShops = [];
let editingShopId = null;

// ── Fetch shops from Supabase API ──
async function getShops() {
    const response = await fetch(`${CONFIG.API_URL}/api/v3/shops`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch shops');
    return data.shops;
}

// ── Init ──
async function init() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';

        allShops = await getShops();
        filteredShops = [...allShops];

        populateCategoryFilter();
        renderStats();
        renderTable();

        document.getElementById('mainContent').style.display = 'block';

        // live search + filter
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('categoryFilter').addEventListener('change', applyFilters);

    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// ── Stats ──
function renderStats() {
    const total = allShops.length;
    const active = allShops.filter(s => s.active).length;
    const devices = allShops.reduce((sum, s) => sum + Number(s.devices_count || 0), 0);
    const cats = new Set(allShops.map(s => s.category).filter(Boolean)).size;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statDevices').textContent = devices;
    document.getElementById('statCats').textContent = cats;
    document.getElementById('shopCountBadge').textContent = `${total} shops`;
}

// ── Category filter dropdown ──
function populateCategoryFilter() {
    const cats = [...new Set(allShops.map(s => s.category).filter(Boolean))].sort();
    const sel = document.getElementById('categoryFilter');
    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        sel.appendChild(opt);
    });
}

// ── Filtering ──
function applyFilters() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const cat = document.getElementById('categoryFilter').value;

    filteredShops = allShops.filter(s => {
        const matchSearch = !query ||
            (s.node_id || '').toLowerCase().includes(query) ||
            (s.shop_id || '').toLowerCase().includes(query) ||
            (s.shop_name || '').toLowerCase().includes(query);

        const matchCat = !cat || s.category === cat;

        return matchSearch && matchCat;
    });

    renderTable();
}

// ── Table ──
function renderTable() {
    const tbody = document.getElementById('shopsTableBody');
    tbody.innerHTML = '';

    if (!filteredShops.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:28px;color:var(--muted);font-weight:600;">No shops found</td></tr>`;
        document.getElementById('footerLabel').textContent = 'Showing 0 of 0 restaurants';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    filteredShops.forEach(shop => {
        const catKey = (shop.category || '').toLowerCase();
        const isActive = Boolean(shop.active);
        const checked = isActive ? 'checked' : '';
        const statusCls = isActive ? 'active' : 'suspended';
        const statusTxt = isActive ? 'Active' : 'Suspended';

        const lat = shop.location ? shop.location.split(',')[0]?.trim() : null;
        const lng = shop.location ? shop.location.split(',')[1]?.trim() : null;
        const coordDisplay = (lat && lng) ? `${lat}, ${lng}` : '—';
        const coordLink = (lat && lng)
            ? `<a class="coord-link" href="https://maps.google.com/?q=${lat},${lng}" target="_blank">${coordDisplay}</a>`
            : '<span style="color:var(--muted)">—</span>';

        const createdRaw = shop.created_at || '';
        const createdDisplay = createdRaw
            ? new Date(createdRaw).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })
            + ' ' +
            new Date(createdRaw).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            : '—';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="node-id">${esc(shop.node_id || '—')}</td>
            <td class="shop-id-badge">${esc(shop.shop_id || '—')}</td>
            <td class="shop-name-cell">${esc(shop.shop_name || '—')}</td>
            <td>${coordLink}</td>
            <td><span class="device-badge">${shop.devices_count ?? 0}</span></td>
            <td style="font-size:13px;">${esc(shop.phone_number || '—')}</td>
            <td><span class="chip ${catKey}">${esc(shop.category || '—')}</span></td>
            <td>
                <div class="toggle-wrap">
                    <label class="toggle">
                        <input type="checkbox" ${checked} onchange="toggleStatus('${shop.shop_id}', this.checked)">
                        <div class="toggle-track"></div>
                        <div class="toggle-thumb"></div>
                    </label>
                    <span class="status-label ${statusCls}" id="statusLabel_${esc(shop.shop_id)}">${statusTxt}</span>
                </div>
            </td>
            <td class="date-cell">${createdDisplay}</td>
            <td>
                <div class="actions-cell">
                    <button class="act-btn edit" onclick="editShop('${esc(shop.shop_id)}')">✏️ Edit</button>
                    <button class="act-btn delete" onclick="deleteShop('${esc(shop.shop_id)}')">🗑️ Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('footerLabel').textContent =
        `Showing ${filteredShops.length} of ${allShops.length} restaurants`;

    // Simple pagination placeholder (1 page)
    document.getElementById('pagination').innerHTML =
        `<button class="page-btn">1</button>`;
}

// ── Toggle status (local only — wire to API when ready) ──
function toggleStatus(shopId, isActive) {
    const shop = allShops.find(s => s.shop_id === shopId);
    if (!shop) return;

    shop.active = isActive;

    const label = document.getElementById(`statusLabel_${shopId}`);
    if (label) {
        label.textContent = isActive ? 'Active' : 'Suspended';
        label.className = `status-label ${isActive ? 'active' : 'suspended'}`;
    }

    // Update stats
    renderStats();

    console.log(`[shops] toggled ${shopId} → ${isActive ? 'active' : 'suspended'}`);
    // TODO: PATCH /api/v3/shops/:id when backend supports it
}

// ── Edit ──
function editShop(shopId) {
    const shop = allShops.find(s => s.shop_id === shopId);
    if (!shop) return;

    editingShopId = shopId;

    document.getElementById('modalTitle').textContent = 'Edit store';
    document.getElementById('fNodeId').value = shop.node_id || '';
    document.getElementById('fShopId').value = shop.shop_id || '';
    document.getElementById('fShopName').value = shop.shop_name || '';
    document.getElementById('fPhone').value = shop.phone_number || '';
    document.getElementById('fCategory').value = shop.category || '';

    if (shop.location) {
        const parts = shop.location.split(',');
        document.getElementById('fLat').value = (parts[0] || '').trim();
        document.getElementById('fLng').value = (parts[1] || '').trim();
    } else {
        document.getElementById('fLat').value = '';
        document.getElementById('fLng').value = '';
    }

    document.getElementById('modalOverlay').classList.add('open');
}

// ── Delete ──
function deleteShop(shopId) {
    if (!confirm(`Delete shop ${shopId}? This cannot be undone.`)) return;

    allShops = allShops.filter(s => s.shop_id !== shopId);
    applyFilters();
    renderStats();

    console.log(`[shops] deleted ${shopId}`);
    // TODO: DELETE /api/v3/shops/:id when backend supports it
}

// ── Modal ──
function openModal(mode) {
    editingShopId = null;
    document.getElementById('modalTitle').textContent = 'Add a new store';
    document.getElementById('fNodeId').value = '';
    document.getElementById('fShopId').value = '';
    document.getElementById('fShopName').value = '';
    document.getElementById('fPhone').value = '';
    document.getElementById('fCategory').value = 'Cafe';
    document.getElementById('fLat').value = '';
    document.getElementById('fLng').value = '';
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    editingShopId = null;
}

function saveModal() {
    const nodeId = document.getElementById('fNodeId').value.trim();
    const shopId = document.getElementById('fShopId').value.trim();
    const shopName = document.getElementById('fShopName').value.trim();
    const phone = document.getElementById('fPhone').value.trim();
    const category = document.getElementById('fCategory').value;
    const lat = document.getElementById('fLat').value.trim();
    const lng = document.getElementById('fLng').value.trim();

    if (!shopName) { alert('Shop name is required.'); return; }

    const location = (lat && lng) ? `${lat}, ${lng}` : '';

    if (editingShopId) {
        // Update existing
        const shop = allShops.find(s => s.shop_id === editingShopId);
        if (shop) {
            shop.node_id = nodeId;
            shop.shop_id = shopId;
            shop.shop_name = shopName;
            shop.phone_number = phone;
            shop.category = category;
            shop.location = location;
        }
        console.log(`[shops] edited ${editingShopId}`);
    } else {
        // Add new
        allShops.push({
            node_id: nodeId,
            shop_id: shopId,
            shop_name: shopName,
            phone_number: phone,
            category: category,
            location: location,
            devices_count: 0,
            active: true,
            status: 'Active',
            created_at: new Date().toISOString(),
        });
        console.log(`[shops] added new shop: ${shopName}`);
    }

    applyFilters();
    renderStats();
    closeModal();
    // TODO: POST/PATCH to API when backend supports it
}

// Close modal on overlay click
document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

// ── CSV export ──
function exportCSV() {
    const headers = ['node_id', 'shop_id', 'shop_name', 'location', 'devices_count', 'phone_number', 'category', 'status', 'created_at'];
    const rows = allShops.map(s => headers.map(h => `"${(s[h] ?? '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shops-export.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function importCSV() {
    alert('Import CSV: connect a file input and POST to the API when backend supports it.');
}

// ── Helpers ──
function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

init();