// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────
app.use(cors());
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── Supabase ──────────────────────────────────
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// ── Real API config ───────────────────────────
const REAL_BASE = 'https://signage-gateway-api-production.up.railway.app';
const REAL_HDRS = {
    'X-API-Key': 'intern-7f6297201feb20d042a0c38c20e2f2df',
    'Content-Type': 'application/json',
};

async function realGet(path) {
    const r = await axios.get(`${REAL_BASE}${path}`, { headers: REAL_HDRS });
    return r.data;
}
async function realPost(path, body = {}) {
    const r = await axios.post(`${REAL_BASE}${path}`, body, { headers: REAL_HDRS });
    return r.data;
}

// ── Shared helpers ────────────────────────────
function requireBody(req, res, ...fields) {
    for (const f of fields) {
        if (!req.body?.[f]) {
            res.status(400).json({ success: false, message: `${f} is required` });
            return false;
        }
    }
    return true;
}

function errRes(res, err) {
    console.error(err.message);
    res.status(502).json({ success: false, message: err.message });
}

// ── Supabase helpers ──────────────────────────

// Get deviceIds linked to a shop (via device_shops join)
async function getShopDeviceIds(shopname_key) {
    const { data: shopRow } = await supabase
        .from('shops').select('shop_id').eq('shopname_key', shopname_key).single();
    if (!shopRow) return [];

    const { data: links } = await supabase
        .from('device_shops').select('device_id').eq('shop_id', shopRow.shop_id);
    return (links || []).map(l => l.device_id);
}

// Get node_contact for a shop
async function getShopNodeContact(shopname_key) {
    const { data } = await supabase
        .from('shops').select('node_contact').eq('shopname_key', shopname_key).single();
    return data?.node_contact || null;
}

// ════════════════════════════════════════════════════════
// LINE WEBHOOK
// ════════════════════════════════════════════════════════

const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LIFF_URLS = {
    summary: 'https://liff.line.me/2009450913-H5vXzsHe',
    area: 'https://liff.line.me/2009450913-VulGaPs7',
    frontStore: 'https://liff.line.me/2009450913-KwxRl0fw',
    inStore: 'https://liff.line.me/2009450913-hgBapL2u',
    flow: 'https://liff.line.me/2009450913-6UjNMZHm',
    ads: 'https://liff.line.me/2009450913-JUcRJKeu',
    viewer: 'https://liff.line.me/2009450913-BYHJyeKG',
    feedback: 'https://liff.line.me/2009450913-B6U8zOOL',
};

app.post('/webhook', async (req, res) => {
    res.status(200).send('OK');
    const events = req.body.events || [];
    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            if (event.message.text.trim().toLowerCase() === 'start') {
                await sendDashboardMenu(event.replyToken);
            }
        }
    }
});

async function sendDashboardMenu(replyToken) {
    const pages = [
        { title: '📊 Summary', subtitle: 'Overall visitor statistics', url: LIFF_URLS.summary, color: '#4F46E5' },
        { title: '📍 Area', subtitle: 'People in the area', url: LIFF_URLS.area, color: '#16A34A' },
        { title: '🏪 Front Store', subtitle: 'Visitors in front of the store', url: LIFF_URLS.frontStore, color: '#D97706' },
        { title: '🛍️ In Store', subtitle: 'Visitors inside the store', url: LIFF_URLS.inStore, color: '#EF4444' },
        { title: '🔄 Flow', subtitle: 'Customer movement flow', url: LIFF_URLS.flow, color: '#7C3AED' },
        { title: '📺 ADS', subtitle: 'Ad display analytics', url: LIFF_URLS.ads, color: '#2563EB' },
        { title: '👁️ Viewer', subtitle: 'Viewer demographics', url: LIFF_URLS.viewer, color: '#F97316' },
        { title: '✉️ Feedback', subtitle: 'Send feedback to admin', url: LIFF_URLS.feedback, color: '#0891B2' },
    ];
    const bubbles = pages.map(p => ({
        type: 'bubble', size: 'kilo',
        header: { type: 'box', layout: 'vertical', contents: [], backgroundColor: p.color, height: '8px', paddingAll: '0px' },
        body: {
            type: 'box', layout: 'vertical', paddingAll: '16px', contents: [
                { type: 'text', text: p.title, weight: 'bold', size: 'md', color: '#111827', wrap: true },
                { type: 'text', text: p.subtitle, size: 'xs', color: '#6B7280', margin: 'sm', wrap: true },
            ]
        },
        footer: {
            type: 'box', layout: 'vertical', paddingAll: '12px', contents: [
                { type: 'button', action: { type: 'uri', label: 'Open', uri: p.url }, style: 'primary', color: p.color, height: 'sm' },
            ]
        },
    }));
    await axios.post('https://api.line.me/v2/bot/message/reply',
        { replyToken, messages: [{ type: 'flex', altText: '📊 Smart Signage Dashboard', contents: { type: 'carousel', contents: bubbles } }] },
        { headers: { Authorization: `Bearer ${LINE_ACCESS_TOKEN}` } }
    );
}

// ════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════

app.post('/api/v3/auth/login', async (req, res) => {
    try {
        const { shop_id, phone_number } = req.body;
        if (!shop_id || !phone_number)
            return res.status(400).json({ success: false, message: 'shop_id and phone_number are required' });

        const { data, error } = await supabase.from('shops')
            .select('shop_id, shop_name, shopname_key, category, phone_number, active')
            .eq('shop_id', shop_id.trim().toUpperCase())
            .eq('phone_number', phone_number.trim())
            .single();

        if (error || !data) return res.status(401).json({ success: false, message: 'Shop ID or phone number is incorrect' });
        if (!data.active) return res.status(403).json({ success: false, message: 'This shop account has been suspended' });
        if (!data.shopname_key) return res.status(403).json({ success: false, message: 'This shop does not have dashboard access yet' });

        res.json({ success: true, shop: { shop_id: data.shop_id, shop_name: data.shop_name, shopname_key: data.shopname_key, category: data.category } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════

app.get('/', (req, res) => {
    res.json({ message: '🚀 Smart Signage API', status: 'running', version: 'v3', timestamp: new Date().toISOString() });
});

// ════════════════════════════════════════════════════════
// LIFF — DASHBOARD ENDPOINTS
// All heavy lifting is done here. Frontend just calls and renders.
// ════════════════════════════════════════════════════════

// ── Summary ───────────────────────────────────
// Uses: crowd-batch (district total) + proxy/crowd per device (area total)
// Body: { date, shopname }
// Returns: { success, "dashboard/summary": { [shopname]: { kpis: { district_count, area_count, front_store, in_store } } } }
app.post('/api/v3/dashboard/summary', async (req, res) => {
    if (!requireBody(req, res, 'date', 'shopname')) return;
    const { date, shopname } = req.body;
    try {
        // 1. District total from crowd-batch (same for all shops)
        const batchData = await realPost('/api/v3/proxy/crowd-batch', { date });
        const districtTotal = Number(batchData?.data?.totalSum || 0);

        // 2. Area total = sum of crowd for devices linked to this shop
        const deviceIds = await getShopDeviceIds(shopname);
        let areaTotal = 0;
        if (deviceIds.length > 0) {
            const crowdResults = await Promise.all(
                deviceIds.map(deviceId => realPost('/api/v3/proxy/crowd', { date, deviceId }).catch(() => null))
            );
            areaTotal = crowdResults.reduce((sum, r) => sum + Number(r?.data?.value || 0), 0);
        }

        res.json({
            success: true,
            date,
            'dashboard/summary': {
                [shopname]: {
                    kpis: {
                        district_count: districtTotal,
                        area_count: areaTotal,
                        front_store: 0, // No real endpoint yet
                        in_store: 0, // No real endpoint yet
                    }
                }
            }
        });
    } catch (err) { errRes(res, err); }
});

// ── Area (crowd per device) ───────────────────
// Uses: devices-crowd (names) + proxy/crowd per device (counts)
// Body: { date, shopname }
// Returns: { success, "proxy/crowd": { [shopname]: { devices: [{ deviceId, name, value }], total } } }
app.post('/api/v3/proxy/crowd', async (req, res) => {
    if (!requireBody(req, res, 'date', 'shopname')) return;
    const { date, shopname } = req.body;
    try {
        // 1. Get all real device names
        const devicesData = await realGet('/api/v3/devices-crowd');
        const nameMap = {};
        for (const d of (devicesData?.data || [])) {
            nameMap[d.deviceId] = d.name;
        }

        // 2. Get deviceIds linked to this shop from Supabase
        const deviceIds = await getShopDeviceIds(shopname);

        if (deviceIds.length === 0) {
            return res.json({
                success: true, date,
                'proxy/crowd': { [shopname]: { devices: [], total: 0 } }
            });
        }

        // 3. Fetch crowd count for each linked device
        const crowdResults = await Promise.all(
            deviceIds.map(async deviceId => {
                const r = await realPost('/api/v3/proxy/crowd', { date, deviceId }).catch(() => null);
                return {
                    deviceId,
                    name: nameMap[deviceId] || deviceId,
                    value: Number(r?.data?.value || 0),
                    timestamp: r?.data?.timestamp || null,
                };
            })
        );

        const total = crowdResults.reduce((sum, d) => sum + d.value, 0);

        res.json({
            success: true,
            date,
            'proxy/crowd': { [shopname]: { devices: crowdResults, total } }
        });
    } catch (err) { errRes(res, err); }
});

// ── Movement / Flow ───────────────────────────
// Uses: movement-raw + shops.node_contact from Supabase
// Body: { date, shopname }
// Returns: { success, "proxy/movement": { [shopname]: { totals, byCategory } } }
app.post('/api/v3/proxy/movement', async (req, res) => {
    if (!requireBody(req, res, 'date', 'shopname')) return;
    const { date, shopname } = req.body;
    try {
        // 1. Get this shop's node_contact from Supabase
        const myNodeContact = await getShopNodeContact(shopname);

        // 2. Fetch movement-raw from real API
        const rawData = await realPost('/api/v3/deeptrack/movement-raw', { selectedDate: date });
        const movements = Array.isArray(rawData?.data?.movement) ? rawData.data.movement : [];

        // 3. Transform: use node_contact as isMyShop identifier
        const inboundMap = {};
        const outboundMap = {};
        let internalTotal = 0;
        let overallTotal = 0;

        for (const row of movements) {
            const value = Number(row.value) || 0;
            overallTotal += value;

            const fromIsMe = myNodeContact && row.from === myNodeContact;
            const toIsMe = myNodeContact && row.to === myNodeContact;

            if (row.from === row.to && fromIsMe) {
                // Internal — staying within my node
                internalTotal += value;
            } else if (toIsMe && !fromIsMe) {
                // Inbound — coming into my node from somewhere else
                // Use the from node_contact as category label (can be enriched later)
                const cat = row.from || 'Others';
                inboundMap[cat] = (inboundMap[cat] || 0) + value;
            } else if (fromIsMe && !toIsMe) {
                // Outbound — leaving my node to somewhere else
                const cat = row.to || 'Others';
                outboundMap[cat] = (outboundMap[cat] || 0) + value;
            }
        }

        const inboundTotal = Object.values(inboundMap).reduce((a, b) => a + b, 0);
        const outboundTotal = Object.values(outboundMap).reduce((a, b) => a + b, 0);

        res.json({
            success: true,
            date,
            'proxy/movement': {
                [shopname]: {
                    totals: {
                        inbound: inboundTotal,
                        internal: internalTotal,
                        outbound: outboundTotal,
                        overall: overallTotal,
                    },
                    byCategory: {
                        inbound: Object.entries(inboundMap)
                            .map(([from_category, value]) => ({ from_category, value }))
                            .sort((a, b) => b.value - a.value),
                        outbound: Object.entries(outboundMap)
                            .map(([to_category, value]) => ({ to_category, value }))
                            .sort((a, b) => b.value - a.value),
                    },
                }
            }
        });
    } catch (err) { errRes(res, err); }
});

// ── ADS & Viewer ──────────────────────────────
// No real endpoints yet (P'Oat's scope) — return empty shape so pages don't crash
app.post('/api/v3/dashboard/ads', async (req, res) => {
    if (!requireBody(req, res, 'date', 'shopname')) return;
    const { date, shopname } = req.body;
    res.json({
        success: true, date,
        'dashboard/ads': {
            [shopname]: { total: 0, groups: { male: { count: 0, percent: 0 }, female: { count: 0, percent: 0 }, adult: { count: 0, percent: 0 }, elderly: { count: 0, percent: 0 }, child: { count: 0, percent: 0 } } }
        }
    });
});

app.post('/api/v3/dashboard/viewer', async (req, res) => {
    if (!requireBody(req, res, 'date', 'shopname')) return;
    const { date, shopname } = req.body;
    res.json({
        success: true, date,
        'dashboard/viewer': {
            [shopname]: { total: 0, groups: { male: { count: 0, percent: 0 }, female: { count: 0, percent: 0 }, adult: { count: 0, percent: 0 }, elderly: { count: 0, percent: 0 }, child: { count: 0, percent: 0 } } }
        }
    });
});

// ════════════════════════════════════════════════════════
// ADMIN — SHOPS (Supabase)
// ════════════════════════════════════════════════════════

app.get('/api/v3/shops', async (req, res) => {
    try {
        const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        res.json({ success: true, shops: data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/v3/shops', async (req, res) => {
    try {
        const { node_id, shop_id, shop_name, location, devices_count, phone_number, category, status, active, node_contact } = req.body;
        const { data, error } = await supabase.from('shops')
            .insert([{ node_id, shop_id, shop_name, location, devices_count: devices_count || 0, phone_number, category, status: status || 'Active', active: active !== false, node_contact: node_contact || null }])
            .select().single();
        if (error) throw error;
        res.json({ success: true, shop: data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/v3/shops/:shop_id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('shops').update(req.body).eq('shop_id', req.params.shop_id).select().single();
        if (error) throw error;
        res.json({ success: true, shop: data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/v3/shops/:shop_id', async (req, res) => {
    try {
        const { error } = await supabase.from('shops').delete().eq('shop_id', req.params.shop_id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════
// ADMIN — DEVICES (Supabase)
// ════════════════════════════════════════════════════════

app.get('/api/v3/devices', async (req, res) => {
    try {
        const { data: devices, error: devErr } = await supabase.from('devices').select('*').order('created_at', { ascending: true });
        if (devErr) throw devErr;
        const { data: links, error: linkErr } = await supabase.from('device_shops')
            .select('device_id, shop_id, shops(shop_id, shop_name, category, active)');
        if (linkErr) throw linkErr;
        const devicesWithShops = devices.map(dev => ({
            ...dev,
            shops: links.filter(l => l.device_id === dev.device_id).map(l => l.shops).filter(Boolean)
        }));
        res.json({ success: true, devices: devicesWithShops });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.post('/api/v3/devices', async (req, res) => {
    try {
        const { device_id, name, status, active } = req.body;
        const { data, error } = await supabase.from('devices')
            .insert([{ device_id, name, status: status || 'Active', active: active !== false }])
            .select().single();
        if (error) throw error;
        res.json({ success: true, device: data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.patch('/api/v3/devices/:device_id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('devices').update(req.body).eq('device_id', req.params.device_id).select().single();
        if (error) throw error;
        res.json({ success: true, device: data });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.delete('/api/v3/devices/:device_id', async (req, res) => {
    try {
        const { error } = await supabase.from('devices').delete().eq('device_id', req.params.device_id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

app.put('/api/v3/devices/:device_id/shops', async (req, res) => {
    try {
        const { device_id } = req.params;
        const { shop_ids } = req.body;
        const { error: delErr } = await supabase.from('device_shops').delete().eq('device_id', device_id);
        if (delErr) throw delErr;
        if (shop_ids && shop_ids.length > 0) {
            const { error: insErr } = await supabase.from('device_shops').insert(shop_ids.map(sid => ({ device_id, shop_id: sid })));
            if (insErr) throw insErr;
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════
// ADMIN — MESSAGES (Supabase)
// ════════════════════════════════════════════════════════

async function generateMessageId() {
    const { data } = await supabase.from('messages').select('message_id').order('id', { ascending: false }).limit(1);
    if (!data || data.length === 0) return 'MSG-001';
    const last = parseInt((data[0].message_id || 'MSG-000').split('-')[1], 10);
    return `MSG-${String(last + 1).padStart(3, '0')}`;
}

app.get('/api/v3/messages', async (req, res) => {
    try {
        let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
        if (req.query.shop_id) query = query.eq('shop_id', req.query.shop_id);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v3/messages', async (req, res) => {
    try {
        const { shop_id, shop_name, phone, subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'subject and message are required' });
        const message_id = await generateMessageId();
        const { data, error } = await supabase.from('messages')
            .insert([{ message_id, shop_id: shop_id || null, shop_name: shop_name || null, phone: phone || null, subject, message, message_status: 'UNREAD', admin_reply: null }])
            .select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/v3/messages/:id', async (req, res) => {
    try {
        const { message_status } = req.body;
        if (!message_status) return res.status(400).json({ error: 'message_status is required' });
        const { data, error } = await supabase.from('messages')
            .update({ message_status, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/v3/messages/:id/reply', async (req, res) => {
    try {
        const { admin_reply } = req.body;
        if (!admin_reply) return res.status(400).json({ error: 'admin_reply is required' });
        const { data, error } = await supabase.from('messages')
            .update({ admin_reply, message_status: 'REPLIED', updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/v3/messages/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('messages').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════
// ADMIN — USERS (Supabase)
// ════════════════════════════════════════════════════════

app.get('/api/v3/users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/v3/users', async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email) return res.status(400).json({ error: 'email is required' });
        const { data, error } = await supabase.from('users')
            .insert([{ email, role: role || 'user', active: true, is_self: false }]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/v3/users/:id', async (req, res) => {
    try {
        const { role, active } = req.body;
        const updates = {};
        if (role !== undefined) updates.role = role;
        if (active !== undefined) updates.active = active;
        const { data, error } = await supabase.from('users').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/v3/users/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════
// ADMIN LOGIN
// ════════════════════════════════════════════════════════

app.post('/api/v3/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
        if (password !== 'nimman2025') return res.status(401).json({ success: false, message: 'Invalid email or password' });
        const { data, error } = await supabase.from('users').select('id, email, role, active').eq('email', email.trim().toLowerCase()).single();
        if (error || !data) return res.status(401).json({ success: false, message: 'Invalid email or password' });
        if (!data.active) return res.status(403).json({ success: false, message: 'Your account has been suspended' });
        res.json({ success: true, user: { id: data.id, email: data.email, role: data.role } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════

app.listen(PORT, () => {
    console.log('\n🚀 Smart Signage API v3');
    console.log(`   http://localhost:${PORT}`);
    console.log('\n📝 Admin pages:');
    console.log(`   http://localhost:${PORT}/public/shops.html`);
    console.log(`   http://localhost:${PORT}/public/area_devices.html`);
    console.log('\n✅ Ready!\n');
});