import { MapPin, Home, Building2, TreePine, Layers } from 'lucide-react';
import { formatPrice, formatPPSF } from '../utils.js';

const TYPE_ICONS = {
  Apartment: <Building2 size={20} />,
  Villa: <Home size={20} />,
  Plot: <TreePine size={20} />,
  'Independent House': <Home size={20} />,
};

const TYPE_EMOJIS = {
  Apartment: '🏢',
  Villa: '🏡',
  Plot: '🌳',
  'Independent House': '🏠',
};

export default function PropertyCard({ property, onView, onCompareToggle, isCompared }) {
  return (
    <div className="prop-card" onClick={() => onView(property)}>
      {/* Image placeholder */}
      <div
        className="prop-card-img"
        style={{ background: `linear-gradient(135deg, ${property.image_color}cc, ${property.image_color})` }}
      >
        {property.images?.length ? <img className="prop-card-photo" src={`http://localhost:8000${property.images[0]}`} alt={property.title} /> : <span style={{ fontSize: '3rem' }}>{TYPE_EMOJIS[property.property_type] || '🏠'}</span>}
        <div className="prop-card-img-label">
          <span className="badge badge-teal">{property.property_type}</span>
        </div>
      </div>

      <div className="prop-card-body">
        <div className="prop-card-title">{property.title}</div>
        <div className="prop-card-loc">
          <MapPin size={12} />
          {property.locality}
        </div>

        <div className="prop-card-stats">
          <span className="prop-stat">
            <Layers size={13} />
            {property.area_sqft.toLocaleString()} sqft
          </span>
          {property.bedrooms > 0 && (
            <span className="prop-stat">
              🛏 {property.bedrooms} BHK
            </span>
          )}
          <span className="prop-stat">
            🏗 {property.age_years === 0 ? 'New' : `${property.age_years}y old`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="prop-price">{property.price_inr == null ? 'Price on request' : formatPrice(property.price_inr)}</span>
          {property.price_per_sqft != null && <span className="prop-ppsf">{formatPPSF(property.price_per_sqft)}</span>}
        </div>

        <div className="prop-card-footer">
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={(e) => { e.stopPropagation(); onView(property); }}
          >
            View Analysis
          </button>
          <label
            className="compare-check"
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={isCompared}
              onChange={() => onCompareToggle(property)}
              style={{ accentColor: '#0ea5b0', cursor: 'pointer' }}
            />
            Compare
          </label>
        </div>
      </div>
    </div>
  );
}
