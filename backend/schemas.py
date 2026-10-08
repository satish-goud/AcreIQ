"""
Pydantic schemas for acreIQ API request and response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


# ── Predict Price ────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    locality: str = Field(..., description="Locality name (e.g. 'Banjara Hills')")
    property_type: str = Field(..., description="'Apartment', 'Villa', 'Plot', or 'Independent House'")
    area_sqft: float = Field(..., gt=0, description="Built-up area in square feet")
    bedrooms: int = Field(1, ge=0, le=10, description="Number of bedrooms; use 0 for land")
    age_years: int = Field(..., ge=0, le=50, description="Property age in years")


class PredictResponse(BaseModel):
    predicted_price_inr: float
    price_per_sqft: float
    locality: str
    property_type: str
    area_sqft: float
    disclaimer: str = (
        "⚠️ DEMO ESTIMATE — This prediction is based on a synthetic training "
        "dataset and does not represent verified real-market valuations."
    )


# ── Property Listing ─────────────────────────────────────────────────────────

class Property(BaseModel):
    id: int | str
    title: str
    locality: str
    area_sqft: float
    property_type: str
    bedrooms: Optional[int] = 0
    age_years: int
    price_inr: Optional[float] = None
    price_per_sqft: Optional[float] = None
    latitude: float = 17.4399
    longitude: float = 78.4983
    image_color: str = "#0ea5b0"
    description: Optional[str] = None
    images: List[str] = Field(default_factory=list)


# ── Locality Trend ────────────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    year: int
    avg_price_per_sqft: float
    label: str  # "Historical" or "Projected"


class LocalityTrendResponse(BaseModel):
    locality: str
    trend: List[TrendPoint]
    disclaimer: str = (
        "📊 Historical values are illustrative. "
        "Projected values are trend extrapolations, not verified market forecasts."
    )
