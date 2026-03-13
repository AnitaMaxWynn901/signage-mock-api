// scripts/shops.js

async function getShops() {
    const response = await fetch(`${CONFIG.API_URL}/api/v3/shops`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.message || 'Failed to fetch shops');
    }

    return data.shops;
}

async function init() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('error').style.display = 'none';
        document.getElementById('shopsContainer').style.display = 'none';

        const shops = await getShops();
        displayShops(shops);
    } catch (error) {
        showError(error.message);
    }
}

function displayShops(shops) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('shopsContainer').style.display = 'block';

    // Update header count
    document.getElementById('totalShops').textContent = `${shops.length} shops`;

    const tbody = document.getElementById('shopsTableBody');
    tbody.innerHTML = '';

    shops.forEach(shop => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid var(--border)';
        row.innerHTML = `
            <td style="padding: 14px; font-family: monospace; font-size: 12px; color: var(--muted);">${shop.node_id}</td>
            <td style="padding: 14px; font-family: monospace; font-size: 12px; font-weight: 600;">${shop.shop_id}</td>
            <td style="padding: 14px; font-weight: 600;">${shop.shop_name}</td>
            <td style="padding: 14px; font-size: 12px; color: var(--info);">${shop.location || '—'}</td>
            <td style="padding: 14px;">
                <span style="background: var(--primaryDim, rgba(79, 70, 229, 0.1)); color: var(--primary); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                    ${shop.devices_count}
                </span>
            </td>
            <td style="padding: 14px; font-size: 12px; color: var(--muted);">${shop.phone_number || '—'}</td>
            <td style="padding: 14px;">
                <span style="background: var(--warningDim, rgba(245, 158, 11, 0.1)); color: var(--warning); padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600;">
                    ${shop.category}
                </span>
            </td>
            <td style="padding: 14px;">
                <span style="
                    background: ${shop.active ? 'var(--successDim, rgba(16, 185, 129, 0.1))' : 'var(--errorDim, rgba(239, 68, 68, 0.1))'};
                    color: ${shop.active ? 'var(--success)' : 'var(--danger)'};
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                ">
                    ${shop.status}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Initialize on page load
init();