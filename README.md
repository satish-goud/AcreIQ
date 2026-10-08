# acreIQ — AI-Powered Real Estate Valuation & Locality Intelligence Platform

A full-stack college project: React + Vite frontend + Python FastAPI backend with a RandomForest ML model.

## Project Structure

```
C:\acreIQ\
├── backend\
│   ├── main.py          # FastAPI app + all endpoints
│   ├── ml_model.py      # RandomForest + synthetic training data
│   ├── schemas.py       # Pydantic request/response models
│   ├── requirements.txt # Python dependencies
│   └── .venv\           # Pre-configured virtual environment
└── frontend\
    ├── src\
    │   ├── App.jsx              # Main app (navbar, pages, state)
    │   ├── main.jsx             # React entry point
    │   ├── index.css            # Global design system
    │   ├── App.css              # Component styles
    │   ├── api.js               # Axios API client
    │   ├── utils.js             # Shared utilities & constants
    │   └── components\
    │       ├── PropertyCard.jsx     # Property listing card
    │       ├── PropertyDetail.jsx   # Detail modal + trend chart
    │       ├── PricePredictor.jsx   # AI price estimator form
    │       ├── LocalityMap.jsx      # Leaflet interactive map
    │       ├── LocalitiesView.jsx   # Localities grid + trend
    │       └── CompareView.jsx      # Side-by-side comparison
    ├── package.json
    └── vite.config.js
```

## How to Run

### Terminal 1 — Backend

```powershell
cd C:\acreIQ\backend
.\.venv\Scripts\uvicorn.exe main:app --reload --port 8000
```

### Terminal 2 — Frontend

```powershell
cd C:\acreIQ\frontend
node node_modules/vite/bin/vite.js
```

Then open: **http://localhost:5173**

The FastAPI interactive docs are at: **http://localhost:8000/docs**

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/localities | List all localities |
| GET | /api/properties | List properties (with filters) |
| POST | /api/predict-price | ML price prediction |
| GET | /api/localities/{name}/trend | Historical + projected price trend |

## Features

- **Search & Filter** — by locality, type, budget, area
- **Property Cards** — 15 demo properties with images, prices, BHK info
- **AI Estimator** — RandomForest trained on 4000 synthetic records
- **Trend Charts** — Recharts line/area charts with historical + projections
- **Interactive Map** — Leaflet map with color-coded price markers
- **Locality Intelligence** — Price bars + expandable trend charts
- **Compare** — Side-by-side table for up to 3 properties

> ⚠️ All prices are DEMO ESTIMATES based on synthetic data. Not verified market data.
