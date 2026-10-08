import { useState, useEffect } from 'react';
import { fetchLocalityTrend } from '../api.js';
import { DEMO_PPSF, formatPPSF } from '../utils.js';
import { MapPin, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const MAX_PPSF = Math.max(...Object.values(DEMO_PPSF));

export default function LocalitiesView({ localities }) {
  const [selected, setSelected] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetchLocalityTrend(selected)
      .then((r) => setTrend(r.data))
      .catch(() => setTrend(null))
      .finally(() => setLoading(false));
  }, [selected]);

  const list = localities.length > 0 ? localities : Object.keys(DEMO_PPSF);

  return (
    <div>
      <div className="localities-grid" style={{ marginBottom: 24 }}>
        {list.map((loc) => {
          const ppsf = DEMO_PPSF[loc] ?? 5000;
          const barWidth = Math.round((ppsf / MAX_PPSF) * 100);
          return (
            <div
              key={loc}
              className="locality-card"
              style={selected === loc ? { borderColor: 'var(--teal)', background: '#f0fbfc' } : {}}
              onClick={() => setSelected(selected === loc ? null : loc)}
            >
              <div className="locality-name">
                <MapPin size={13} style={{ display: 'inline', marginRight: 4, color: 'var(--teal)' }} />
                {loc}
              </div>
              <div className="locality-price">{formatPPSF(ppsf)}</div>
              <div className="locality-meta">Avg. price per sqft (illustrative)</div>
              <div className="locality-bar">
                <div className="locality-bar-fill" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="predictor-box" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={18} color="#0ea5b0" />
            <strong>{selected} — Price Trend</strong>
          </div>
          {loading && <div className="loading-center"><div className="spinner" /></div>}
          {!loading && trend && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend.trend} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5b0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5b0" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}/sqft`} />
                <Area
                  type="monotone" dataKey="avg_price_per_sqft"
                  stroke="#0ea5b0" fill="url(#trendGrad)" strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {!loading && !trend && (
            <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>
              Could not load trend. Ensure the backend is running.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
