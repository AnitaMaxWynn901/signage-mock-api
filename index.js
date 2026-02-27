// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const shopInfo = require('./JSONs/shop-info.json');
const dashboardSummary = require('./JSONs/dashboard-summary.json');
const dashboardAds = require('./JSONs/dashboard-ads.json');
const dashboardViewer = require('./JSONs/dashboard-viewer.json');
const proxyCrowd = require('./JSONs/proxy-crowd.json');
const proxyCrowdBatch = require('./JSONs/proxy-crowd-batch.json');
const proxyDailySummary = require('./JSONs/proxy-daily-summery.json');
const proxyDataUnique = require('./JSONs/proxy-dataunique.json');
const proxyMovement = require('./JSONs/proxy-movement.json');

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
    res.json(dashboardSummary);
});

// ============================================
// 3. DASHBOARD ADS
// ============================================
app.post('/api/v3/dashboard/ads', (req, res) => {
    console.log('📺 POST /api/v3/dashboard/ads');
    res.json(dashboardAds);
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
// 5. DASHBOARD SUMMARY HOURLY (placeholder)
// ============================================
// app.post('/api/v3/dashboard/summary-hourly', (req, res) => {
//     console.log('⏰ POST /api/v3/dashboard/summary-hourly');
//     // TODO: Ask mentor for JSON format
//     res.json({
//         "dashboard/summary-hourly": {
//             "nimman-connex": {
//                 "sample_hourly_data": [
//                     { "hour": "09:00", "count": 120 },
//                     { "hour": "10:00", "count": 150 },
//                     { "hour": "11:00", "count": 180 }
//                 ]
//             }
//         }
//     });
// });

// ============================================
// 6. DASHBOARD VIEWER
// ============================================
app.post('/api/v3/dashboard/viewer', (req, res) => {
    console.log('👁️ POST /api/v3/dashboard/viewer');
    res.json(dashboardViewer);
});

// ============================================
// 7. PROXY CROWD
// ============================================
app.post('/api/v3/proxy/crowd', (req, res) => {
    console.log('👥 POST /api/v3/proxy/crowd');
    res.json(proxyCrowd);
});

// ============================================
// 8. PROXY CROWD BATCH
// ============================================
app.post('/api/v3/proxy/crowd-batch', (req, res) => {
    console.log('📦 POST /api/v3/proxy/crowd-batch');
    res.json(proxyCrowdBatch);
});

// ============================================
// 9. PROXY DAILY SUMMARY
// ============================================
app.post('/api/v3/proxy/daily-summery', (req, res) => {
    console.log('📅 POST /api/v3/proxy/daily-summery');
    res.json(proxyDailySummary);
});

// ============================================
// 10. PROXY DATA UNIQUE
// ============================================
app.post('/api/v3/proxy/dataunique', (req, res) => {
    console.log('🔢 POST /api/v3/proxy/dataunique');
    res.json(proxyDataUnique);
});

// ============================================
// 11. PROXY MOVEMENT
// ============================================
app.post('/api/v3/proxy/movement', (req, res) => {
    console.log('🚶 POST /api/v3/proxy/movement');
    res.json(proxyMovement);
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
    console.log('   POST /api/v3/proxy/crowd');
    console.log('   POST /api/v3/proxy/crowd-batch');
    console.log('   POST /api/v3/proxy/daily-summery');
    console.log('   POST /api/v3/proxy/dataunique');
    console.log('   POST /api/v3/proxy/movement');
    console.log('   POST /api/v3/reset');
    console.log('\n✅ Ready to accept requests!\n');
});