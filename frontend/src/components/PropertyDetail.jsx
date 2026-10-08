import { useState, useEffect } from 'react';
import { X, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { fetchLocalityTrend } from '../api.js';
import { formatPrice, formatPPSF } from '../utils.js';

export default function PropertyDetail({ property, onClose, onCompareToggle, isCompared }) {
  const [trend, setTrend] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState(null);

  useEffect(() => {
    if (!property) return;
    setTrendLoading(true);
    setTrend(null);
    setTrendError(null);
    fetchLocalityTrend(property.locality)
      .then((res) => setTrend(res.data))
      .catch(() => setTrendError('Could not load trend data. Please ensure the backend is running.'))
      .finally(() => setTrendLoading(false));
  }, [property]);

  if (!property) return null;

  const chartData = trend
    ? trend.trend.map((t) => ({
        year: t.year,
        price: t.avg_price_per_sqft,
        label: t.label,
      }))
    : [];

  const historicalData = chartData.filter((d) => d.label === 'Historical');
  const projectedData = chartData.filter((d) => d.label === 'Projected');
  // Merge so the line is continuous
  const lastHistorical = historicalData[historicalData.length - 1];
  const fullProjected = lastHistorical
    ? [lastHistorical, ...projectedData]
    : projectedData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">{property.title}</div>
            <div className="modal-subtitle">
              <MapPin size={14} />
              {property.locality}, Hyderabad
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Price box */}
          <div className="detail-price-box">
            <div>
              <div className="detail-price-label">{property.price_inr == null ? 'ASKING PRICE' : 'ESTIMATED VALUE'}</div>
              <div className="detail-price">{property.price_inr == null ? 'Price on request' : formatPrice(property.price_inr)}</div>
              {property.price_per_sqft != null && <div className="detail-ppsf">{formatPPSF(property.price_per_sqft)}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                onClick={() => onCompareToggle(property)}
              >
                {isCompared ? '✓ Comparing' : '+ Compare'}
              </button>
            </div>
          </div>

          {property.images?.length > 0 && <div className="detail-photos">{property.images.map((src) => <img key={src} src={`http://localhost:8000${src}`} alt={property.title} />)}</div>}
          {property.description && <p className="detail-description">{property.description}</p>}

          {/* Specs */}
          <div className="detail-specs">
            {[
              { val: `${property.area_sqft.toLocaleString()} sqft`, key: 'Area' },
              { val: property.bedrooms > 0 ? `${property.bedrooms} BHK` : 'N/A', key: 'Bedrooms' },
              { val: property.property_type, key: 'Type' },
              { val: property.age_years === 0 ? 'New' : `${property.age_years} years`, key: 'Age' },
              { val: property.locality, key: 'Locality' },
            ].map((s) => (
              <div key={s.key} className="spec-item">
                <div className="spec-val">{s.val}</div>
                <div className="spec-key">{s.key}</div>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="chart-title">
            <TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} />
            Price Trend — {property.locality}
          </div>
          <div className="chart-subtitle">
            Average ₹/sqft · 2020–2025 (Historical) and 2026–2028 (Illustrative Projection)
          </div>

          {trendLoading && (
            <div className="loading-center" style={{ minHeight: 120 }}>
              <div className="spinner" />
              <span>Loading trend…</span>
            </div>
          )}
          {trendError && <div className="error-box">{trendError}</div>}

          {trend && (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${val.toLocaleString('en-IN')}/sqft`, 'Avg Price']}
                  />
                  <ReferenceLine x={2025} stroke="#cdd5df" strokeDasharray="4 4" label={{ value: 'Now', fill: '#8a9ab5', fontSize: 11 }} />
                  <Line
                    data={historicalData}
                    dataKey="price"
                    name="Historical"
                    stroke="#0ea5b0"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0ea5b0' }}
                    connectNulls
                  />
                  <Line
                    data={fullProjected}
                    dataKey="price"
                    name="Projected"
                    stroke="#0ea5b0"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: '#0ea5b0', strokeDasharray: '' }}
                    connectNulls
                  />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>

              <div className="disclaimer-box">
                <AlertTriangle size={13} style={{ display: 'inline', marginRight: 5 }} />
                {trend.disclaimer}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
