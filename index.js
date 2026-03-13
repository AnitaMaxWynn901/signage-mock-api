// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const path = require("path");

// Serve HTML files in /public at /public/...
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/style", express.static(path.join(__dirname, "style")));
app.use("/scripts", express.static(path.join(__dirname, "scripts")));

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

// ===== helpers =====
const requireDate = (req, res) => {
    const { date } = req.body || {};
    if (!date) {
        res.status(400).json({
            success: false,
            message: "date is required!"
        });
        return null;
    }
    return date;
};

const respondWithOptionalShopFilter = (res, payload, rootKey, date, shopname) => {
    const rootObj = payload[rootKey];

    // safety check
    if (!rootObj || typeof rootObj !== "object") {
        return res.status(500).json({
            success: false,
            message: `Invalid JSON format: missing root key "${rootKey}"`
        });
    }

    // filter by shopname
    if (shopname) {
        const shopData = rootObj[shopname];
        if (!shopData) {
            return res.status(404).json({
                success: false,
                message: "404 SHOP NOT FOUND"
            });
        }
        return res.json({
            success: true,
            date,
            [rootKey]: {
                [shopname]: shopData
            }
        });
    }

    // return all
    return res.json({
        success: true,
        date,
        ...payload
    });
};

// ============================================
// TEST ENDPOINT
// ============================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Smart Signage Mock API',
        status: 'running',
        version: 'v3',
        endpoints: {
            "GET": ["/", "/api/v3/shop-info"],
            "POST": [
                "/api/v3/dashboard/summary",
                "/api/v3/dashboard/ads",
                "/api/v3/dashboard/viewer",
                "/api/v3/dashboard/summary-hourly",
                "/api/v3/proxy/crowd",
                "/api/v3/proxy/crowd-batch",
                "/api/v3/proxy/daily-summery",
                "/api/v3/proxy/dataunique",
                "/api/v3/proxy/movement",
                "/api/v3/reset"
            ]
        },
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 1. SHOP INFO
// ============================================
app.get('/api/v3/shop-info', (req, res) => {
    console.log('📍 GET /api/v3/shop-info');
    res.json(shopInfo);
});

// ============================================
// 2. DASHBOARD SUMMARY
// ============================================
app.post('/api/v3/dashboard/summary', (req, res) => {
    console.log('📊 POST /api/v3/dashboard/summary');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, dashboardSummary, "dashboard/summary", date, shopname);
});

// ============================================
// 3. DASHBOARD ADS
// ============================================
app.post('/api/v3/dashboard/ads', (req, res) => {
    console.log('📺 POST /api/v3/dashboard/ads');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, dashboardAds, "dashboard/ads", date, shopname);
});

// ============================================
// 4. RESET
// ============================================
app.post('/api/v3/reset', (req, res) => {
    console.log('🔄 POST /api/v3/reset');
    res.json({
        success: true,
        message: 'State reset successfully',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// 5. DASHBOARD VIEWER
// ============================================
app.post('/api/v3/dashboard/summary-hourly', (req, res) => {
    console.log('👁️ POST /api/v3/dashboard/summary-hourly');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, dashboardSummaryHourly, "dashboard/summary-hourly", date, shopname);
});


// ============================================
// 5. DASHBOARD VIEWER
// ============================================
app.post('/api/v3/dashboard/viewer', (req, res) => {
    console.log('👁️ POST /api/v3/dashboard/viewer');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, dashboardViewer, "dashboard/viewer", date, shopname);
});

// ============================================
// 6. PROXY CROWD
// ============================================
app.post('/api/v3/proxy/crowd', (req, res) => {
    console.log('👥 POST /api/v3/proxy/crowd');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, proxyCrowd, "proxy/crowd", date, shopname);
});

// ============================================
// 7. PROXY CROWD BATCH
// ============================================
app.post('/api/v3/proxy/crowd-batch', (req, res) => {
    console.log('📦 POST /api/v3/proxy/crowd-batch');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, proxyCrowdBatch, "proxy/crowd-batch", date, shopname);
});

// ============================================
// 8. PROXY DAILY SUMMARY
// ============================================
app.post('/api/v3/proxy/daily-summery', (req, res) => {
    console.log('📅 POST /api/v3/proxy/daily-summery');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, proxyDailySummary, "proxy/daily-summery", date, shopname);
});

// ============================================
// 9. PROXY DATA UNIQUE
// ============================================
app.post('/api/v3/proxy/dataunique', (req, res) => {
    console.log('🔢 POST /api/v3/proxy/dataunique');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, proxyDataUnique, "proxy/dataunique", date, shopname);
});

// ============================================
// 10. PROXY MOVEMENT
// ============================================
app.post('/api/v3/proxy/movement', (req, res) => {
    console.log('🚶 POST /api/v3/proxy/movement');

    const date = requireDate(req, res);
    if (!date) return;

    const { shopname } = req.body;
    return respondWithOptionalShopFilter(res, proxyMovement, "proxy/movement", date, shopname);
});

// ============================================
// SHOP MANAGEMENT - GET ALL SHOPS
// ============================================
app.get('/api/v3/shops', async (req, res) => {
    console.log('🏪 GET /api/v3/shops');

    try {
        const { data, error } = await supabase
            .from('shops')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            shops: data
        });
    } catch (error) {
        console.error('Supabase error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log('   Smart Signage Mock API v3');
    console.log(`   Server: http://localhost:${PORT}`);
    console.log('   Status: Running');
    console.log('🚀 ========================================\n');
    console.log('📝 Available Endpoints:');
    console.log('   GET  /');
    console.log('   GET  /api/v3/shop-info');
    console.log('   POST /api/v3/dashboard/summary');
    console.log('   POST /api/v3/dashboard/ads');
    console.log('   POST /api/v3/dashboard/viewer');
    console.log('   POST /api/v3/dashboard/summary-hourly');
    console.log('   POST /api/v3/proxy/crowd');
    console.log('   POST /api/v3/proxy/crowd-batch');
    console.log('   POST /api/v3/proxy/daily-summery');
    console.log('   POST /api/v3/proxy/dataunique');
    console.log('   POST /api/v3/proxy/movement');
    console.log('   POST /api/v3/reset');
    console.log('\n✅ Ready to accept requests!\n');
});