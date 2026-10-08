import { useState } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import { predictPrice } from '../api.js';
import { PROPERTY_TYPES, POPULAR_LOCALITIES, formatPrice, formatPPSF } from '../utils.js';

const BEDROOMS = [1, 2, 3, 4, 5];

export default function PricePredictor({ localities }) {
  const allLocalities = localities && localities.length > 0 ? localities : POPULAR_LOCALITIES;

  const [form, setForm] = useState({
    locality: allLocalities[0] || 'Banjara Hills',
    property_type: 'Apartment',
    area_sqft: 1200,
    bedrooms: 2,
    age_years: 5,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handlePredict() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictPrice({
        ...form,
        area_sqft: Number(form.area_sqft),
        bedrooms: Number(form.bedrooms),
        age_years: Number(form.age_years),
      });
      setResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Prediction failed. Is the backend running?';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="predictor-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Brain size={22} color="#0ea5b0" />
        <div>
          <div className="section-title" style={{ marginBottom: 0 }}>AI Price Estimator</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
            RandomForest model · Synthetic data · Demo estimates only
          </div>
        </div>
      </div>

      <div className="predictor-grid">
        <div className="form-group">
          <label className="form-label">Locality</label>
          <select className="select" value={form.locality} onChange={(e) => set('locality', e.target.value)}>
            {allLocalities.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Property Type</label>
          <select className="select" value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
            {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Area (sqft)</label>
          <input
            type="number" className="input" min="200" max="10000" step="50"
            value={form.area_sqft}
            onChange={(e) => set('area_sqft', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bedrooms</label>
          <select className="select" value={form.bedrooms} onChange={(e) => set('bedrooms', Number(e.target.value))}>
            {BEDROOMS.map((b) => <option key={b} value={b}>{b} BHK</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Property Age (years)</label>
          <input
            type="number" className="input" min="0" max="50"
            value={form.age_years}
            onChange={(e) => set('age_years', e.target.value)}
          />
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={handlePredict}
        disabled={loading}
      >
        {loading ? (
          <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Predicting…</>
        ) : (
          <><Brain size={18} /> Estimate Price</>
        )}
      </button>

      {error && <div className="error-box" style={{ marginTop: 14 }}>{error}</div>}

      {result && (
        <div className="prediction-result">
          <div style={{ fontSize: '0.82rem', opacity: 0.7, letterSpacing: '0.05em', fontWeight: 600 }}>
            DEMO ESTIMATE — {result.property_type} · {result.locality}
          </div>
          <div className="prediction-price">{formatPrice(result.predicted_price_inr)}</div>
          <div className="prediction-ppsf">{formatPPSF(result.price_per_sqft)} · {result.area_sqft.toLocaleString()} sqft</div>
          <div className="disclaimer-box" style={{ marginTop: 14 }}>
            <AlertTriangle size={13} style={{ display: 'inline', marginRight: 5 }} />
            {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
}
