#  Smart Signage Connect

**Retail Analytics Dashboard & Mock API**

A comprehensive retail analytics platform that tracks customer foot traffic, demographics, movement patterns, and advertisement viewer statistics across multiple store locations.

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Deployment](#deployment)
- [Pages Overview](#pages-overview)
- [Contributing](#contributing)

---

##  Overview

Smart Signage Connect is a retail analytics platform designed to provide real-time insights into customer behavior across three retail locations:

- **Nimman Connex** - Retail store
- **One Nimman** - Lifestyle center
- **MAYA Mall** - Shopping mall

The project includes both a **mock API backend** (Express.js) and a **frontend dashboard** with 8 specialized analytics pages.

**Project Duration:** 4-5 weeks (Internship Project)  
**Deadline:** End of March 2026

---

## ✨ Features

### Backend (Mock API)
-  11 RESTful API endpoints
-  JSON-based data storage
-  CORS enabled
-  Date filtering
-  Shop-specific data filtering
-  Static file serving for frontend

### Frontend Dashboard
-  **8 Analytics Pages:**
  - Summary Dashboard
  - Area Analytics
  - Front Store Metrics
  - In-Store Analytics
  - Customer Flow Visualization
  - Advertisement Display Stats
  - Viewer Demographics
  - Feedback Form

-  **UI/UX Features:**
  - Clean, professional design
  - Responsive layouts
  - Real-time data visualization
  - Date range selection
  - Shop switcher (localStorage)
  - Loading states & error handling
  - Animated flow diagrams
  - Interactive charts

---

##  Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Data Storage:** JSON files
- **Environment:** dotenv

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom design system
- **Vanilla JavaScript** - No frameworks
- **Chart.js** - Data visualization (planned)

### Deployment
- **Platform:** Render.com
- **API URL:** `https://signage-mock-api.onrender.com`

---

## 📁 Project Structure

```
signage-mock-api/
├── JSONs/                          # Data storage
│   ├── dashboard-ads.json
│   ├── dashboard-summary.json
│   ├── dashboard-summary-hourly.json
│   ├── dashboard-viewer.json
│   ├── proxy-crowd.json
│   ├── proxy-crowd-batch.json
│   ├── proxy-daily-summery.json
│   ├── proxy-dataunique.json
│   ├── proxy-movement.json
│   └── shop-info.json
│
├── public/                         # Frontend pages
│   ├── summary.html
│   ├── area.html
│   ├── front-store.html
│   ├── in-store.html
│   ├── flow.html
│   ├── ads.html
│   ├── viewer.html
│   └── feedback.html
│
├── scripts/                        # Frontend JavaScript
│   ├── config.js                   # API configuration
│   ├── api.js                      # API client
│   ├── summary.js
│   ├── area.js
│   ├── front-store.js
│   ├── in-store.js
│   ├── flow.js
│   ├── ads.js
│   ├── viewer.js
│   └── feedback.js
│
├── style/                          # CSS files
│   ├── base.css                    # Design tokens & reset
│   ├── components.css              # Reusable components
│   └── pages.css                   # Page-specific styles
│
├── index.js                        # Express server
├── package.json
├── .env                            # Environment variables
└── README.md
```

---

##  Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Local Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd signage-mock-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
# Create .env file
echo "PORT=3000" > .env
```

4. **Start the server**
```bash
# Development mode
npm start

# Production mode
npm run start
```

5. **Access the application**
- API: `http://localhost:3000`
- Frontend: `http://localhost:3000/public/summary.html`

---

##  API Documentation

### Base URL
- **Local:** `http://localhost:3000`
- **Production:** `https://signage-mock-api.onrender.com`

### Endpoints

#### 1. Shop Information
```http
GET /api/v3/shop-info
```

Returns information about all shops (name, location, category, device codes).

---

#### 2. Dashboard Summary
```http
POST /api/v3/dashboard/summary
Content-Type: application/json

{
  "date": "2026-02-25",
  "shopname": "nimman-connex"  // optional
}
```

**Returns:**
```json
{
  "success": true,
  "date": "2026-02-25",
  "dashboard/summary": {
    "nimman-connex": {
      "kpis": {
        "district_count": 1250,
        "area_count": 340,
        "front_store": 296,
        "in_store": 203
      }
    }
  }
}
```

---

#### 3. Advertisement Display Stats
```http
POST /api/v3/dashboard/ads
Content-Type: application/json

{
  "date": "2026-02-25",
  "shopname": "nimman-connex"
}
```

**Returns:** Total ad plays with gender and age demographics.

---

#### 4. Viewer Analytics
```http
POST /api/v3/dashboard/viewer
Content-Type: application/json

{
  "date": "2026-02-25",
  "shopname": "nimman-connex"
}
```

**Returns:** Viewer demographics (gender, age groups).

---

#### 5. Summary Hourly
```http
POST /api/v3/dashboard/summary-hourly
```

Returns hourly breakdown of visitor data (format pending).

---

#### 6. Proxy Crowd
```http
POST /api/v3/proxy/crowd
```

Returns crowd data with temperature, humidity, and pressure sensor readings.

---

#### 7. Proxy Crowd Batch
```http
POST /api/v3/proxy/crowd-batch
```

Returns total crowd count per device.

---

#### 8. Proxy Daily Summary
```http
POST /api/v3/proxy/daily-summery
```

Returns sensor-level daily summaries with location information.

---

#### 9. Proxy Data Unique
```http
POST /api/v3/proxy/dataunique
```

Returns total unique device counts.

---

#### 10. Proxy Movement
```http
POST /api/v3/proxy/movement
```

Returns customer movement flow (inbound, internal, outbound) with category breakdowns.

---

#### 11. Reset State
```http
POST /api/v3/reset
```

Utility endpoint for resetting application state.

---

### Error Responses

**Missing Date Parameter:**
```json
{
  "success": false,
  "message": "date is required!"
}
```

**Shop Not Found:**
```json
{
  "success": false,
  "message": "404 SHOP NOT FOUND"
}
```

---

##  Usage

### Selecting a Shop

The frontend uses `localStorage` to persist shop selection:

```javascript
// Get current shop
const currentShop = getCurrentShop();
// Returns: 'nimman-connex', 'one-nimman', or 'maya-mall'

// Set shop
setCurrentShop('one-nimman');
```

### Making API Calls

```javascript
// Using the built-in API client
const data = await getSummary('2026-02-25', 'nimman-connex');

// Or fetch directly
const response = await fetch('http://localhost:3000/api/v3/dashboard/summary', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    date: '2026-02-25',
    shopname: 'nimman-connex'
  })
});
```

### Date Formatting

All dates must be in `YYYY-MM-DD` format:

```javascript
// Get today's date
const today = getTodayDate();
// Returns: "2026-03-09"
```

---

##  Deployment

### Render.com Deployment

1. **Create a new Web Service**
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables**
   ```
   PORT=3000
   ```

3. **Deploy**
   - Render will automatically deploy on push to main branch

### Accessing Deployed Pages

```
https://signage-mock-api.onrender.com/public/summary.html
https://signage-mock-api.onrender.com/public/area.html
https://signage-mock-api.onrender.com/public/front-store.html
https://signage-mock-api.onrender.com/public/in-store.html
https://signage-mock-api.onrender.com/public/flow.html
https://signage-mock-api.onrender.com/public/ads.html
https://signage-mock-api.onrender.com/public/viewer.html
https://signage-mock-api.onrender.com/public/feedback.html
```

---

##  Pages Overview

### 1. **Summary Dashboard** (`summary.html`)
- Overall district visitor count
- Area, Front Store, and In-Store metrics
- Conversion rate calculation
- Comparison chart

**Key Metrics:**
- District Count
- Area Count
- Front Store Count
- In-Store Count
- Conversion Rate (In-Store / Front-Store)

---

### 2. **Area Analytics** (`area.html`)
- Area visitor statistics
- Environmental sensor data (temperature, humidity, pressure)
- District-level comparison

**Features:**
- Real-time sensor readings
- Last updated timestamp
- Full day data cycle

---

### 3. **Front Store Metrics** (`front-store.html`)
- Front store visitor count
- Conversion visualization (Front → In-Store)
- District traffic comparison

**Highlights:**
- Large hero number display
- Conversion funnel
- District context

---

### 4. **In-Store Analytics** (`in-store.html`)
- In-store visitor count
- Conversion rate details
- Device-level breakdown from sensors
- Average per hour calculation

**Device Details:**
- Sensor name and location
- Per-device totals
- Visual progress indicators

---

### 5. **Customer Flow** (`flow.html`)
- Movement totals (Inbound, Internal, Outbound)
- Category-based flow diagram
- Interactive animated arrows
- Category breakdown with progress bars

**Flow Visualization:**
- Inbound Categories → Front Store → In-Store → Outbound Categories
- Conversion rate badge
- Color-coded category nodes

**Categories:**
- Cafe & Restaurant (Orange)
- Retail (Blue)
- Service (Purple)
- Entertainment (Cyan)
- Others (Gray)

---

### 6. **Advertisement Display** (`ads.html`)
- Total ad plays
- Gender distribution (Male/Female)
- Age demographics pie chart
- Detailed audience breakdown

**Demographics:**
- Gender split with percentages
- Age groups: Adult, Elderly, Children
- Interactive pie chart
- Color-coded statistics

---

### 7. **Viewer Analytics** (`viewer.html`)
- Total viewer count
- Gender proportion bar
- Age group distribution

**Similar to Ads but focuses on viewers rather than ad plays**

---

### 8. **Feedback Form** (`feedback.html`)
- Issue reporting
- Feature requests
- Bug reports
- General feedback

**Form Fields:**
- Type (Feedback/Bug/Feature/Other)
- Subject
- Detailed message
- Auto-captured shop context

---

##  Design System

### Color Palette

**Base Colors:**
```css
--bg: #f6f7fb
--surface: #ffffff
--text: #111827
--muted: #6b7280
--border: #e8eaf2
```

**Accent Colors:**
```css
--primary: #4f46e5    /* Indigo */
--info: #0ea5e9       /* Sky Blue */
--success: #16a34a    /* Green */
--warning: #f59e0b    /* Amber */
--danger: #ef4444     /* Red */
```

### Typography

**Font Stack:**
```css
ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans"
```

### Components

- **Header Card** - Shop info with icon and live badge
- **Date Selector** - Consistent date input across all pages
- **Movement Cards** - Color-coded traffic metrics
- **Flow Nodes** - Category-based visitor flow
- **Stat Cards** - KPI displays with icons
- **Charts** - Bar charts and pie charts

---

##  Configuration

### API Configuration (`scripts/config.js`)

```javascript
const CONFIG = {
    API_URL: 'https://signage-mock-api.onrender.com',
    
    SHOP_NAMES: {
        'nimman-connex': 'Nimman Connex',
        'one-nimman': 'One Nimman',
        'maya-mall': 'MAYA Lifestyle Shopping Center'
    },
    
    ENDPOINTS: {
        DASHBOARD_SUMMARY: '/api/v3/dashboard/summary',
        DASHBOARD_ADS: '/api/v3/dashboard/ads',
        DASHBOARD_VIEWER: '/api/v3/dashboard/viewer',
        PROXY_CROWD: '/api/v3/proxy/crowd',
        PROXY_MOVEMENT: '/api/v3/proxy/movement',
        PROXY_DATAUNIQUE: '/api/v3/proxy/dataunique'
    }
};
```

---

##  Testing

### Manual Testing

1. **Test API Endpoints:**
```bash
# Test summary endpoint
curl -X POST http://localhost:3000/api/v3/dashboard/summary \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-25", "shopname": "nimman-connex"}'
```

2. **Test Frontend Pages:**
   - Navigate to each page
   - Change date selector
   - Verify data displays correctly
   - Check loading and error states

### Browser Testing
-  Chrome
-  Firefox
-  Safari
-  Edge

---

##  Data Structure

### Shop Names (Keys)
- `nimman-connex`
- `one-nimman`
- `maya-mall`

### Sample Data Files

**dashboard-summary.json:**
```json
{
  "dashboard/summary": {
    "nimman-connex": {
      "kpis": {
        "district_count": 1250,
        "area_count": 340,
        "front_store": 296,
        "in_store": 203
      }
    }
  }
}
```

---

##  Contributing

This is an internship project. If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

##  TODO / Roadmap

- [ ] Add Chart.js integration for dynamic charts
- [ ] Implement hourly data visualization
- [ ] Add export functionality (CSV, PDF)
- [ ] Add user authentication
- [ ] Connect to real database
- [ ] Add real-time WebSocket updates
- [ ] Implement shop comparison view
- [ ] Add date range picker
- [ ] Mobile app version
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Performance optimization
- [ ] Accessibility improvements (WCAG compliance)

---

##  License

This project is part of an internship program. All rights reserved.

---

##  Author

**Internship Project**  
Smart Signage Connect  

---

##  Acknowledgments

- Mentor guidance and API specifications
- Design inspiration from modern retail analytics platforms
- Express.js and Node.js communities

---

##  Support

For questions or issues, please:
1. Use the Feedback Form in the application
2. Contact the project mentor
3. Create an issue in the repository (if applicable)

---

##  Quick Links

- **Local Development:** `http://localhost:3000/public/summary.html`
- **Production API:** `https://signage-mock-api.onrender.com`
- **API Docs:** See [API Documentation](#api-documentation) section above

---

**Last Updated:** March 2026  
**Version:** 1.0.0  
**Status:**  In Development (Internship Project)
