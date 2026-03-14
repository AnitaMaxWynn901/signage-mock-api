// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require("path");

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/style", express.static(path.join(__dirname, "style")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const shopInfo = require('./JSONs/shop-info.json');
const dashboardSummary = require('./JSONs/dashboard-summary.json');
const dashboardSummaryHourly = require('./JSONs/dashboard-summary-hourly.json');
const dashboardAds = require('./JSONs/dashboard-ads.json');
const dashboardViewer = require('./JSONs/dashboard-viewer.json');
const proxyCrowd = require('./JSONs/proxy-crowd.json');
const proxyCrowdBatch = require('./JSONs/proxy-crowd-batch.json');
const proxyDailySummary = require('./JSONs/proxy-daily-summery.json');
const proxyDataUnique = require('./JSONs/proxy-dataunique.json');
const proxyMovement = require('./JSONs/proxy-movement.json');

// ════════════════════════════════════════════════════════
// LINE WEBHOOK — Replace your existing webhook code in index.js
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

// ── Webhook endpoint
app.post('/webhook', async (req, res) => {
    res.status(200).send('OK');

    const events = req.body.events || [];
    for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
            const text = event.message.text.trim().toLowerCase();
            if (text === 'start') {
                await sendDashboardMenu(event.replyToken);
            }
        }
    }
});

// ── Send carousel with all 8 pages
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
        type: 'bubble',
        size: 'kilo',
        header: {
            type: 'box',
            layout: 'vertical',
            contents: [],
            backgroundColor: p.color,
            height: '8px',
            paddingAll: '0px',
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                { type: 'text', text: p.title, weight: 'bold', size: 'md', color: '#111827', wrap: true },
                { type: 'text', text: p.subtitle, size: 'xs', color: '#6B7280', margin: 'sm', wrap: true },
            ],
            paddingAll: '16px',
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'button',
                    action: { type: 'uri', label: 'Open', uri: p.url },
                    style: 'primary',
                    color: p.color,
                    height: 'sm',
                },
            ],
            paddingAll: '12px',
        },
    }));

    await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        {
            replyToken,
            messages: [{
                type: 'flex',
                altText: '📊 Smart Signage Dashboard',
                contents: { type: 'carousel', contents: bubbles },
            }],
        },
        { headers: { Authorization: `Bearer ${LINE_ACCESS_TOKEN}` } }
    );
}


// ════════════════════════════════════════════════════════
// AUTH — LOGIN ENDPOINT
// ════════════════════════════════════════════════════════

// POST /api/v3/auth/login
// Body: { shop_id, phone_number }
// Returns: { success, shop } where shop includes shopname_key
app.post('/api/v3/auth/login', async (req, res) => {
    try {
        const { shop_id, phone_number } = req.body;

        if (!shop_id || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'shop_id and phone_number are required'
            });
        }

        // Find shop in Supabase matching both shop_id AND phone_number
        const { data, error } = await supabase
            .from('shops')
            .select('shop_id, shop_name, shopname_key, category, phone_number, active')
            .eq('shop_id', shop_id.trim().toUpperCase())
            .eq('phone_number', phone_number.trim())
            .single();

        if (error || !data) {
            return res.status(401).json({
                success: false,
                message: 'Shop ID or phone number is incorrect'
            });
        }

        if (!data.active) {
            return res.status(403).json({
                success: false,
                message: 'This shop account has been suspended'
            });
        }

        if (!data.shopname_key) {
            return res.status(403).json({
                success: false,
                message: 'This shop does not have dashboard access yet'
            });
        }

        res.json({
            success: true,
            shop: {
                shop_id: data.shop_id,
                shop_name: data.shop_name,
                shopname_key: data.shopname_key,
                category: data.category,
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
// ===== helpers =====
const requireDate = (req, res) => {
    const { date } = req.body || {};
    if (!date) {
        res.status(400).json({ success: false, message: "date is required!" });
        return null;
    }
    return date;
};

const respondWithOptionalShopFilter = (res, payload, rootKey, date, shopname) => {
    const rootObj = payload[rootKey];
    if (!rootObj || typeof rootObj !== "object") {
        return res.status(500).json({ success: false, message: `Invalid JSON format: missing root key "${rootKey}"` });
    }
    if (shopname) {
        const shopData = rootObj[shopname];
        if (!shopData) return res.status(404).json({ success: false, message: "404 SHOP NOT FOUND" });
        return res.json({ success: true, date, [rootKey]: { [shopname]: shopData } });
    }
    return res.json({ success: true, date, ...payload });
};

// ============================================
// ROOT
// ============================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Smart Signage Mock API',
        status: 'running',
        version: 'v3',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// MOCK JSON ENDPOINTS
// ============================================
app.get('/api/v3/shop-info', (req, res) => res.json(shopInfo));

app.post('/api/v3/dashboard/summary', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, dashboardSummary, "dashboard/summary", date, req.body.shopname);
});
app.post('/api/v3/dashboard/ads', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, dashboardAds, "dashboard/ads", date, req.body.shopname);
});
app.post('/api/v3/dashboard/viewer', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, dashboardViewer, "dashboard/viewer", date, req.body.shopname);
});
app.post('/api/v3/dashboard/summary-hourly', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, dashboardSummaryHourly, "dashboard/summary-hourly", date, req.body.shopname);
});
app.post('/api/v3/proxy/crowd', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, proxyCrowd, "proxy/crowd", date, req.body.shopname);
});
app.post('/api/v3/proxy/crowd-batch', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, proxyCrowdBatch, "proxy/crowd-batch", date, req.body.shopname);
});
app.post('/api/v3/proxy/daily-summery', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, proxyDailySummary, "proxy/daily-summery", date, req.body.shopname);
});
app.post('/api/v3/proxy/dataunique', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, proxyDataUnique, "proxy/dataunique", date, req.body.shopname);
});
app.post('/api/v3/proxy/movement', (req, res) => {
    const date = requireDate(req, res); if (!date) return;
    return respondWithOptionalShopFilter(res, proxyMovement, "proxy/movement", date, req.body.shopname);
});
app.post('/api/v3/reset', (req, res) => {
    res.json({ success: true, message: 'State reset successfully', timestamp: new Date().toISOString() });
});

// ============================================
// ADMIN — SHOPS (Supabase)
// ============================================

// GET all shops
app.get('/api/v3/shops', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('shops').select('*').order('created_at', { ascending: true });
        if (error) throw error;
        res.json({ success: true, shops: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create shop
app.post('/api/v3/shops', async (req, res) => {
    try {
        const { node_id, shop_id, shop_name, location, devices_count, phone_number, category, status, active } = req.body;
        const { data, error } = await supabase
            .from('shops').insert([{ node_id, shop_id, shop_name, location, devices_count: devices_count || 0, phone_number, category, status: status || 'Active', active: active !== false }])
            .select().single();
        if (error) throw error;
        res.json({ success: true, shop: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH update shop
app.patch('/api/v3/shops/:shop_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('shops').update(req.body).eq('shop_id', req.params.shop_id).select().single();
        if (error) throw error;
        res.json({ success: true, shop: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE shop
app.delete('/api/v3/shops/:shop_id', async (req, res) => {
    try {
        const { error } = await supabase.from('shops').delete().eq('shop_id', req.params.shop_id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ============================================
// ADMIN — DEVICES (Supabase)
// ============================================

// GET all devices (with linked shops via device_shops join)
app.get('/api/v3/devices', async (req, res) => {
    try {
        const { data: devices, error: devErr } = await supabase
            .from('devices').select('*').order('created_at', { ascending: true });
        if (devErr) throw devErr;

        // Fetch all device_shops links with shop info
        const { data: links, error: linkErr } = await supabase
            .from('device_shops')
            .select('device_id, shop_id, shops(shop_id, shop_name, category, active)');
        if (linkErr) throw linkErr;

        // Attach linked shops to each device
        const devicesWithShops = devices.map(dev => ({
            ...dev,
            shops: links
                .filter(l => l.device_id === dev.device_id)
                .map(l => l.shops)
                .filter(Boolean)
        }));

        res.json({ success: true, devices: devicesWithShops });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST create device
app.post('/api/v3/devices', async (req, res) => {
    try {
        const { device_id, name, status, active } = req.body;
        const { data, error } = await supabase
            .from('devices').insert([{ device_id, name, status: status || 'Active', active: active !== false }])
            .select().single();
        if (error) throw error;
        res.json({ success: true, device: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PATCH update device
app.patch('/api/v3/devices/:device_id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('devices').update(req.body).eq('device_id', req.params.device_id).select().single();
        if (error) throw error;
        res.json({ success: true, device: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE device
app.delete('/api/v3/devices/:device_id', async (req, res) => {
    try {
        const { error } = await supabase.from('devices').delete().eq('device_id', req.params.device_id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT update device-shop links (replace all links for a device)
app.put('/api/v3/devices/:device_id/shops', async (req, res) => {
    try {
        const { device_id } = req.params;
        const { shop_ids } = req.body; // array of shop_id strings

        // Delete existing links
        const { error: delErr } = await supabase
            .from('device_shops').delete().eq('device_id', device_id);
        if (delErr) throw delErr;

        // Insert new links
        if (shop_ids && shop_ids.length > 0) {
            const rows = shop_ids.map(sid => ({ device_id, shop_id: sid }));
            const { error: insErr } = await supabase.from('device_shops').insert(rows);
            if (insErr) throw insErr;
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// ════════════════════════════════════════════════════════
// MESSAGES ENDPOINTS — add these to your index.js
// ════════════════════════════════════════════════════════

// Helper: generate next message_id like MSG-007
async function generateMessageId(supabase) {
    const { data } = await supabase
        .from('messages')
        .select('message_id')
        .order('id', { ascending: false })
        .limit(1);
    if (!data || data.length === 0) return 'MSG-001';
    const last = parseInt((data[0].message_id || 'MSG-000').split('-')[1], 10);
    return `MSG-${String(last + 1).padStart(3, '0')}`;
}

// ── GET /api/v3/messages
// Admin: get all messages (sorted newest first)
// LIFF:  get messages for a specific shop ?shop_id=SH001
app.get('/api/v3/messages', async (req, res) => {
    try {
        let query = supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (req.query.shop_id) {
            query = query.eq('shop_id', req.query.shop_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/v3/messages
// Shop owner submits a new message (from feedback.html)
app.post('/api/v3/messages', async (req, res) => {
    try {
        const { shop_id, shop_name, phone, subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ error: 'subject and message are required' });
        }

        const message_id = await generateMessageId(supabase);

        const { data, error } = await supabase
            .from('messages')
            .insert([{
                message_id,
                shop_id: shop_id || null,
                shop_name: shop_name || null,
                phone: phone || null,
                subject,
                message,
                message_status: 'UNREAD',
                admin_reply: null,
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/v3/messages/:id
// Update message status (UNREAD → CLOSED etc.)
app.patch('/api/v3/messages/:id', async (req, res) => {
    try {
        const { message_status } = req.body;
        if (!message_status) {
            return res.status(400).json({ error: 'message_status is required' });
        }

        const { data, error } = await supabase
            .from('messages')
            .update({ message_status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /api/v3/messages/:id/reply
// Admin sends a reply — sets admin_reply and status → REPLIED
app.patch('/api/v3/messages/:id/reply', async (req, res) => {
    try {
        const { admin_reply } = req.body;
        if (!admin_reply) {
            return res.status(400).json({ error: 'admin_reply is required' });
        }

        const { data, error } = await supabase
            .from('messages')
            .update({
                admin_reply,
                message_status: 'REPLIED',
                updated_at: new Date().toISOString(),
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── DELETE /api/v3/messages/:id
app.delete('/api/v3/messages/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ════════════════════════════════════════════════════════
// USERS ENDPOINTS — add these to your index.js
// ════════════════════════════════════════════════════════

// GET /api/v3/users — get all users
app.get('/api/v3/users', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        res.json(data); // plain array
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/v3/users — add a new user
app.post('/api/v3/users', async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email) return res.status(400).json({ error: 'email is required' });

        const { data, error } = await supabase
            .from('users')
            .insert([{ email, role: role || 'user', active: true, is_self: false }])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/v3/users/:id — update role or active status
app.patch('/api/v3/users/:id', async (req, res) => {
    try {
        const { role, active } = req.body;
        const updates = {};
        if (role !== undefined) updates.role = role;
        if (active !== undefined) updates.active = active;

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/v3/users/:id — remove a user
app.delete('/api/v3/users/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('\n🚀 Smart Signage Mock API v3');
    console.log(`   http://localhost:${PORT}`);
    console.log('\n📝 Admin pages:');
    console.log(`   http://localhost:${PORT}/public/shops.html`);
    console.log(`   http://localhost:${PORT}/public/area-devices.html`);
    console.log('\n✅ Ready!\n');
});