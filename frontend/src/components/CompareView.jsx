import { formatPrice, formatPPSF } from '../utils.js';
import { BarChart2, X } from 'lucide-react';

export default function CompareView({ properties, onRemove, onClear }) {
  if (properties.length === 0) {
    return (
      <div className="compare-empty">
        <BarChart2 size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
        <div style={{ fontWeight: 700, marginBottom: 6 }}>No properties selected</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>
          Tick the "Compare" checkbox on up to 3 property cards to compare them here.
        </div>
      </div>
    );
  }

  const rows = [
    { label: 'Locality', fn: (p) => p.locality },
    { label: 'Type', fn: (p) => p.property_type },
    { label: 'Area', fn: (p) => `${p.area_sqft.toLocaleString()} sqft` },
    { label: 'Bedrooms', fn: (p) => p.bedrooms > 0 ? `${p.bedrooms} BHK` : 'N/A' },
    { label: 'Age', fn: (p) => p.age_years === 0 ? 'New' : `${p.age_years} yrs` },
    {
      label: 'Price',
      fn: (p) => p.price_inr == null ? 'Not provided' : formatPrice(p.price_inr),
      highlight: true,
      best: (ps) => {
        const values = ps.map((p) => p.price_inr).filter(Number.isFinite);
        const min = values.length ? Math.min(...values) : null;
        return (p) => min !== null && p.price_inr === min;
      },
    },
    {
      label: '₹/sqft',
      fn: (p) => p.price_per_sqft == null ? 'Not provided' : formatPPSF(p.price_per_sqft),
      highlight: true,
      best: (ps) => {
        const values = ps.map((p) => p.price_per_sqft).filter(Number.isFinite);
        const min = values.length ? Math.min(...values) : null;
        return (p) => min !== null && p.price_per_sqft === min;
      },
    },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <div className="compare-toolbar"><span>{properties.length} of 3 properties selected</span><button className="btn btn-ghost btn-sm" onClick={onClear}>Clear All</button></div>
      <table className="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            {properties.map((p) => (
              <th key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{p.title}</span>
                  <button
                    onClick={() => onRemove(p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex' }}
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isBest = row.best ? row.best(properties) : null;
            return (
              <tr key={row.label}>
                <td style={{ fontWeight: 600, color: 'var(--gray-600)', fontSize: '0.82rem' }}>
                  {row.label}
                </td>
                {properties.map((p) => (
                  <td
                    key={p.id}
                    className={isBest && isBest(p) ? 'compare-highlight' : ''}
                  >
                    {row.fn(p)}
                    {isBest && isBest(p) && (
                      <span style={{ marginLeft: 6, fontSize: '0.7rem' }}>✓ Best</span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
