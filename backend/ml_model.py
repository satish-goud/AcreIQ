"""
ml_model.py — acreIQ ML model
Trains a RandomForestRegressor on a reproducible synthetic dataset.
The model is saved to disk after training so subsequent restarts are faster.
"""

import os
import warnings
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore")

MODEL_PATH = "acre_iq_model.joblib"
ENCODERS_PATH = "acre_iq_encoders.joblib"

# ── Locality base prices (₹ per sqft, illustrative) ────────────────────────
LOCALITY_BASE = {
    "Banjara Hills":      12000,
    "Jubilee Hills":      11500,
    "Gachibowli":         10000,
    "Hitech City":         9800,
    "Madhapur":            9500,
    "Kondapur":            8500,
    "Manikonda":           7200,
    "Kukatpally":          6800,
    "Miyapur":             5800,
    "Bachupally":          5200,
    "Kompally":            4800,
    "Uppal":               4500,
    "LB Nagar":            4200,
    "Dilsukhnagar":        4000,
    "Secunderabad":        6500,
    "Begumpet":            8000,
    "Ameerpet":            7500,
    "Attapur":             5000,
    "Tolichowki":          6000,
    "Nallagandla":         7000,
}

PROPERTY_TYPE_MULT = {
    "Villa":              1.35,
    "Independent House":  1.10,
    "Apartment":          1.00,
    "Plot":               0.75,
}

LOCALITIES = list(LOCALITY_BASE.keys())
PROPERTY_TYPES = list(PROPERTY_TYPE_MULT.keys())


def _generate_dataset(n: int = 4000, seed: int = 42) -> pd.DataFrame:
    """Create a reproducible synthetic property dataset."""
    rng = np.random.default_rng(seed)

    localities = rng.choice(LOCALITIES, n)
    prop_types = rng.choice(PROPERTY_TYPES, n)
    areas = rng.uniform(500, 4000, n).round(0)
    bedrooms = rng.integers(1, 6, n)
    age_years = rng.integers(0, 30, n)

    prices = []
    for i in range(n):
        base = LOCALITY_BASE[localities[i]]
        mult = PROPERTY_TYPE_MULT[prop_types[i]]
        bed_adj = 1 + 0.04 * (bedrooms[i] - 2)
        age_adj = 1 - 0.008 * age_years[i]
        noise = rng.normal(1.0, 0.08)
        ppsf = base * mult * bed_adj * age_adj * noise
        price = ppsf * areas[i]
        prices.append(price)

    return pd.DataFrame({
        "locality": localities,
        "property_type": prop_types,
        "area_sqft": areas,
        "bedrooms": bedrooms,
        "age_years": age_years,
        "price_inr": prices,
    })


def _train_model():
    """Train and persist the RandomForest model."""
    print("[acreIQ] Training RandomForestRegressor on synthetic dataset…")
    df = _generate_dataset()

    le_locality = LabelEncoder()
    le_ptype = LabelEncoder()

    df["locality_enc"] = le_locality.fit_transform(df["locality"])
    df["ptype_enc"] = le_ptype.fit_transform(df["property_type"])

    X = df[["locality_enc", "ptype_enc", "area_sqft", "bedrooms", "age_years"]]
    y = df["price_inr"]

    model = RandomForestRegressor(n_estimators=120, random_state=42, n_jobs=-1)
    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    joblib.dump({"locality": le_locality, "property_type": le_ptype}, ENCODERS_PATH)
    print(f"[acreIQ] Model trained and saved -> {MODEL_PATH}")
    return model, le_locality, le_ptype


def load_or_train():
    """Return (model, le_locality, le_ptype). Train if saved files are absent."""
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        print("[acreIQ] Loading saved model…")
        model = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        return model, encoders["locality"], encoders["property_type"]
    return _train_model()


def predict_price(model, le_locality, le_ptype,
                  locality: str, property_type: str,
                  area_sqft: float, bedrooms: int, age_years: int) -> float:
    """Return predicted price in INR for a single property."""
    known_localities = list(le_locality.classes_)
    known_ptypes = list(le_ptype.classes_)

    if locality not in known_localities:
        raise ValueError(
            f"Unknown locality '{locality}'. "
            f"Choose from: {', '.join(sorted(known_localities))}"
        )
    if property_type not in known_ptypes:
        raise ValueError(
            f"Unknown property type '{property_type}'. "
            f"Choose from: {', '.join(sorted(known_ptypes))}"
        )

    loc_enc = le_locality.transform([locality])[0]
    pt_enc = le_ptype.transform([property_type])[0]

    X = pd.DataFrame([{
        "locality_enc": loc_enc,
        "ptype_enc": pt_enc,
        "area_sqft": area_sqft,
        "bedrooms": bedrooms,
        "age_years": age_years,
    }])
    return float(model.predict(X)[0])
