"""
main.py — acreIQ FastAPI backend
Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from pathlib import Path
import sqlite3
import uuid
import math
from io import BytesIO
from PIL import Image, UnidentifiedImageError

from schemas import (
    PredictRequest, PredictResponse,
    Property, LocalityTrendResponse, TrendPoint,
)
from ml_model import load_or_train, predict_price, LOCALITIES, PROPERTY_TYPES

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DB_PATH = BASE_DIR / "acre_iq_listings.sqlite3"
MAX_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

def init_db():
    UPLOAD_DIR.mkdir(exist_ok=True)
    with sqlite3.connect(DB_PATH) as db:
        db.execute("""CREATE TABLE IF NOT EXISTS listings (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, locality TEXT NOT NULL,
            property_type TEXT NOT NULL, address TEXT, area_sqft REAL NOT NULL,
            bedrooms INTEGER NOT NULL, age_years INTEGER NOT NULL,
            description TEXT NOT NULL, asking_price REAL, price_inr REAL,
            price_per_sqft REAL, images TEXT NOT NULL)""")

def saved_listings():
    import json
    with sqlite3.connect(DB_PATH) as db:
        db.row_factory = sqlite3.Row
        rows = db.execute("SELECT * FROM listings ORDER BY rowid DESC").fetchall()
    return [Property(id=r["id"], title=r["title"], locality=r["locality"],
        property_type=r["property_type"], area_sqft=r["area_sqft"], bedrooms=r["bedrooms"],
        age_years=r["age_years"], price_inr=r["price_inr"] if r["price_inr"] is not None else r["asking_price"],
        price_per_sqft=(r["price_per_sqft"] if r["price_per_sqft"] is not None else
            ((r["asking_price"] / r["area_sqft"]) if r["asking_price"] is not None else None)),
        description=r["description"], images=json.loads(r["images"])) for r in rows]

# ── Startup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="acreIQ API",
    description="AI-Powered Real Estate Valuation & Locality Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://acre-iq.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
init_db()
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Train / load model at startup
ml_model, le_locality, le_ptype = load_or_train()


# ── Demo property dataset ─────────────────────────────────────────────────────
DEMO_PROPERTIES: List[Property] = [
    Property(id=1,  title="Skyline Residences 3BHK", locality="Banjara Hills",    area_sqft=1850, property_type="Apartment",         bedrooms=3, age_years=4,  price_inr=22200000, price_per_sqft=12000, latitude=17.4126, longitude=78.4488, image_color="#1a6b8a"),
    Property(id=2,  title="Green Villa Estate",       locality="Jubilee Hills",    area_sqft=3200, property_type="Villa",              bedrooms=4, age_years=2,  price_inr=41600000, price_per_sqft=13000, latitude=17.4317, longitude=78.4080, image_color="#2d9e6b"),
    Property(id=3,  title="Tech Park Apartments",     locality="Gachibowli",       area_sqft=1200, property_type="Apartment",         bedrooms=2, age_years=6,  price_inr=12000000, price_per_sqft=10000, latitude=17.4400, longitude=78.3489, image_color="#5b3fa8"),
    Property(id=4,  title="Hitech Heights 2BHK",     locality="Hitech City",      area_sqft=1100, property_type="Apartment",         bedrooms=2, age_years=8,  price_inr=10780000, price_per_sqft=9800,  latitude=17.4481, longitude=78.3763, image_color="#c05621"),
    Property(id=5,  title="Madhapur Luxury Flat",    locality="Madhapur",         area_sqft=1500, property_type="Apartment",         bedrooms=3, age_years=3,  price_inr=14250000, price_per_sqft=9500,  latitude=17.4483, longitude=78.3915, image_color="#9e3b5b"),
    Property(id=6,  title="Kondapur Independent Home",locality="Kondapur",        area_sqft=2200, property_type="Independent House", bedrooms=4, age_years=10, price_inr=20350000, price_per_sqft=9250,  latitude=17.4705, longitude=78.3608, image_color="#1a8a6b"),
    Property(id=7,  title="Manikonda Budget Flat",   locality="Manikonda",        area_sqft=900,  property_type="Apartment",         bedrooms=2, age_years=5,  price_inr=6480000,  price_per_sqft=7200,  latitude=17.3990, longitude=78.3870, image_color="#8a6b1a"),
    Property(id=8,  title="Kukatpally 3BHK",         locality="Kukatpally",       area_sqft=1400, property_type="Apartment",         bedrooms=3, age_years=7,  price_inr=9520000,  price_per_sqft=6800,  latitude=17.4849, longitude=78.3996, image_color="#3b6b9e"),
    Property(id=9,  title="Miyapur Plot",             locality="Miyapur",          area_sqft=2000, property_type="Plot",              bedrooms=0, age_years=0,  price_inr=11600000, price_per_sqft=5800,  latitude=17.4998, longitude=78.3550, image_color="#6b3b9e"),
    Property(id=10, title="Bachupally Premium Villa", locality="Bachupally",       area_sqft=2800, property_type="Villa",             bedrooms=4, age_years=1,  price_inr=20440000, price_per_sqft=7300,  latitude=17.5314, longitude=78.3926, image_color="#2d6b9e"),
    Property(id=11, title="Kompally Cottage",         locality="Kompally",         area_sqft=1600, property_type="Independent House", bedrooms=3, age_years=12, price_inr=10560000, price_per_sqft=6600,  latitude=17.5446, longitude=78.4725, image_color="#9e6b2d"),
    Property(id=12, title="Uppal Budget 2BHK",        locality="Uppal",            area_sqft=850,  property_type="Apartment",         bedrooms=2, age_years=15, price_inr=3825000,  price_per_sqft=4500,  latitude=17.4055, longitude=78.5597, image_color="#6b9e2d"),
    Property(id=13, title="Secunderabad Heritage Home",locality="Secunderabad",   area_sqft=2100, property_type="Independent House", bedrooms=3, age_years=20, price_inr=15120000, price_per_sqft=7200,  latitude=17.4399, longitude=78.4983, image_color="#9e2d6b"),
    Property(id=14, title="Begumpet Executive Flat",  locality="Begumpet",         area_sqft=1300, property_type="Apartment",         bedrooms=2, age_years=9,  price_inr=10400000, price_per_sqft=8000,  latitude=17.4450, longitude=78.4620, image_color="#2d9e9e"),
    Property(id=15, title="Nallagandla Smart Home",   locality="Nallagandla",      area_sqft=1750, property_type="Apartment",         bedrooms=3, age_years=2,  price_inr=12250000, price_per_sqft=7000,  latitude=17.4605, longitude=78.3272, image_color="#6b2d9e"),
]

# ── Locality trend base data (₹/sqft growth, illustrative) ────────────────────
TREND_BASE: dict[str, list[float]] = {
    "Banjara Hills":   [8200, 9000, 9800, 10500, 11200, 12000],
    "Jubilee Hills":   [7800, 8500, 9200, 10000, 10700, 11500],
    "Gachibowli":      [5500, 6500, 7500, 8200, 9000, 10000],
    "Hitech City":     [5800, 6600, 7500, 8200, 9000, 9800],
    "Madhapur":        [5500, 6300, 7200, 8000, 8800, 9500],
    "Kondapur":        [4500, 5300, 6200, 7000, 7800, 8500],
    "Manikonda":       [3800, 4500, 5200, 5900, 6600, 7200],
    "Kukatpally":      [3500, 4200, 5000, 5700, 6300, 6800],
    "Miyapur":         [3000, 3500, 4000, 4500, 5200, 5800],
    "Bachupally":      [2800, 3200, 3800, 4200, 4700, 5200],
    "Kompally":        [2500, 3000, 3500, 4000, 4400, 4800],
    "Uppal":           [2200, 2700, 3200, 3600, 4100, 4500],
    "LB Nagar":        [2000, 2500, 2900, 3300, 3700, 4200],
    "Dilsukhnagar":    [2000, 2400, 2800, 3200, 3600, 4000],
    "Secunderabad":    [3800, 4500, 5200, 5800, 6200, 6500],
    "Begumpet":        [5000, 5800, 6400, 7000, 7500, 8000],
    "Ameerpet":        [4200, 5000, 5800, 6400, 7000, 7500],
    "Attapur":         [2800, 3300, 3800, 4200, 4600, 5000],
    "Tolichowki":      [3500, 4000, 4600, 5200, 5600, 6000],
    "Nallagandla":     [4000, 4600, 5300, 6000, 6500, 7000],
}
TREND_YEARS_HIST = [2020, 2021, 2022, 2023, 2024, 2025]
TREND_YEARS_PROJ = [2026, 2027, 2028]


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "acreIQ API", "version": "1.0.0"}


# ── Localities ────────────────────────────────────────────────────────────────
@app.get("/api/localities", response_model=List[str])
def get_localities():
    return sorted(LOCALITIES)


# ── Properties ────────────────────────────────────────────────────────────────
@app.get("/api/properties", response_model=List[Property])
def get_properties(
    locality: Optional[str] = Query(None),
    property_type: Optional[str] = Query(None),
    max_budget: Optional[float] = Query(None),
    min_area: Optional[float] = Query(None),
):
    results = DEMO_PROPERTIES + saved_listings()

    if locality:
        results = [p for p in results if locality.lower() in p.locality.lower()]
    if property_type:
        results = [p for p in results if p.property_type.lower() == property_type.lower()]
    if max_budget is not None:
        results = [p for p in results if p.price_inr is not None and p.price_inr <= max_budget]
    if min_area is not None:
        results = [p for p in results if p.area_sqft >= min_area]

    return results


@app.get("/api/properties/{property_id}", response_model=Property)
def get_property(property_id: str):
    match = next((p for p in DEMO_PROPERTIES + saved_listings() if str(p.id) == property_id), None)
    if not match:
        raise HTTPException(status_code=404, detail="Property not found")
    return match


def image_signature(content: bytes, mime: str) -> bool:
    if mime == "image/jpeg": return content.startswith(b"\xff\xd8\xff")
    if mime == "image/png": return content.startswith(b"\x89PNG\r\n\x1a\n")
    if mime == "image/webp": return content.startswith(b"RIFF") and content[8:12] == b"WEBP"
    return False

def valid_image_content(content: bytes, mime: str) -> bool:
    expected = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}.get(mime)
    try:
        with Image.open(BytesIO(content)) as image:
            if (image.format != expected or image.width > 12000 or image.height > 12000
                    or image.width * image.height > 40000000):
                return False
            image.verify()
        return True
    except (UnidentifiedImageError, OSError, ValueError):
        return False


@app.post("/api/properties", response_model=Property, status_code=201)
async def create_property(
    title: str = Form(...), property_type: str = Form(...), locality: str = Form(...),
    area_sqft: float = Form(...), bedrooms: int = Form(0), age_years: int = Form(0),
    description: str = Form(...), address: str = Form(""), asking_price: Optional[float] = Form(None),
    files: List[UploadFile] = File(default=[]),
):
    title, locality, description = title.strip(), locality.strip(), description.strip()
    allowed_listing_types = {"Apartment", "Independent House", "Plot", "Land"}
    if not 3 <= len(title) <= 100: raise HTTPException(422, "Title must be 3–100 characters")
    if not locality or len(locality) > 80: raise HTTPException(422, "Enter a valid Hyderabad locality")
    if property_type not in allowed_listing_types: raise HTTPException(422, "Unsupported property type")
    if area_sqft <= 0 or area_sqft > 1000000: raise HTTPException(422, "Area must be positive and reasonable")
    if age_years < 0 or age_years > 200: raise HTTPException(422, "Age must be between 0 and 200 years")
    if bedrooms < 0 or bedrooms > 20 or (property_type in {"Apartment", "Independent House"} and bedrooms < 1):
        raise HTTPException(422, "Enter a valid bedroom count")
    if not description or len(description) > 2000: raise HTTPException(422, "Description is required (up to 2000 characters)")
    if len(address) > 300: raise HTTPException(422, "Address must be at most 300 characters")
    if asking_price is not None and asking_price < 0: raise HTTPException(422, "Asking price cannot be negative")
    if len(files) > 5: raise HTTPException(422, "Upload at most five photos")

    import json
    staged = []
    for file in files:
        mime = file.content_type or ""
        if mime not in ALLOWED_TYPES: raise HTTPException(415, "Photos must be JPG, PNG, or WebP")
        data = await file.read(MAX_IMAGE_BYTES + 1)
        if len(data) > MAX_IMAGE_BYTES: raise HTTPException(413, "Each photo must be 5 MB or smaller")
        if not image_signature(data, mime) or not valid_image_content(data, mime):
            raise HTTPException(415, "Photo is not a valid JPG, PNG, or WebP image")
        staged.append((uuid.uuid4().hex + ALLOWED_TYPES[mime], data))

    listing_id = "user-" + uuid.uuid4().hex[:12]
    image_urls = [f"/uploads/{name}" for name, _ in staged]
    # Only known model types/localities are eligible; unavailable estimates stay optional.
    estimate = None
    if property_type in PROPERTY_TYPES and locality in LOCALITIES:
        try:
            estimate = predict_price(ml_model, le_locality, le_ptype, locality, property_type,
                area_sqft, max(1, bedrooms), age_years)
        except ValueError:
            pass
    price = float(estimate) if estimate is not None else asking_price
    ppsf = (price / area_sqft) if price is not None else None
    written = []
    try:
        for name, data in staged:
            (UPLOAD_DIR / name).write_bytes(data)
            written.append(UPLOAD_DIR / name)
        with sqlite3.connect(DB_PATH) as db:
            db.execute("INSERT INTO listings VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (
                listing_id, title, locality, property_type, address.strip(), area_sqft,
                bedrooms, age_years, description, asking_price, price, ppsf, json.dumps(image_urls)))
    except Exception as exc:
        for path in written:
            path.unlink(missing_ok=True)
        raise HTTPException(500, "Could not save listing. Please try again.") from exc
    return Property(id=listing_id, title=title, locality=locality, property_type=property_type,
        area_sqft=area_sqft, bedrooms=bedrooms, age_years=age_years, price_inr=price,
        price_per_sqft=ppsf, description=description, images=image_urls)


# ── Predict Price ─────────────────────────────────────────────────────────────
@app.post("/api/predict-price", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        price = predict_price(
            ml_model, le_locality, le_ptype,
            req.locality, req.property_type,
            req.area_sqft, req.bedrooms, req.age_years,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return PredictResponse(
        predicted_price_inr=round(price, 2),
        price_per_sqft=round(price / req.area_sqft, 2),
        locality=req.locality,
        property_type=req.property_type,
        area_sqft=req.area_sqft,
    )


# ── Locality Trend ────────────────────────────────────────────────────────────
@app.get("/api/localities/{locality}/trend", response_model=LocalityTrendResponse)
def locality_trend(locality: str):
    # Case-insensitive lookup
    matched = next(
        (loc for loc in TREND_BASE if loc.lower() == locality.lower()), None
    )
    if matched is None:
        raise HTTPException(
            status_code=404,
            detail=f"No trend data for locality '{locality}'. "
                   f"Available: {', '.join(sorted(TREND_BASE.keys()))}",
        )

    hist_prices = TREND_BASE[matched]
    trend: List[TrendPoint] = []

    for year, price in zip(TREND_YEARS_HIST, hist_prices):
        trend.append(TrendPoint(year=year, avg_price_per_sqft=price, label="Historical"))

    # Simple linear extrapolation for projections
    recent_growth = (hist_prices[-1] - hist_prices[-3]) / 2  # avg over last 2 years
    last_price = hist_prices[-1]
    for i, year in enumerate(TREND_YEARS_PROJ, start=1):
        projected = last_price + recent_growth * i
        trend.append(TrendPoint(year=year, avg_price_per_sqft=round(projected, 0), label="Projected"))

    return LocalityTrendResponse(locality=matched, trend=trend)
