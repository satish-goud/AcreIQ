import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { formatPrice } from '../utils.js';

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LEGEND_COLORS = [
  { range: '> ₹1 Cr', color: '#e53e3e' },
  { range: '₹50L–1Cr', color: '#dd6b20' },
  { range: '₹25L–50L', color: '#d69e2e' },
  { range: '< ₹25L', color: '#38a169' },
];

function getPriceColor(price) {
  if (price >= 1e7) return '#e53e3e';
  if (price >= 5e6) return '#dd6b20';
  if (price >= 2.5e6) return '#d69e2e';
  return '#38a169';
}

export default function LocalityMap({ properties }) {
  const [mapError, setMapError] = useState(false);
  const center = [17.4399, 78.4983]; // Hyderabad center

  return (
    <div>
      <div
        className="map-container"
        style={{ height: 440, position: 'relative' }}
        onError={() => setMapError(true)}
      >
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ error: () => setMapError(true) }}
          />
          {properties.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={14}
              pathOptions={{
                fillColor: getPriceColor(p.price_inr),
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.85,
              }}
            >
              <Popup>
                <strong>{p.locality}</strong><br />
                {p.title}<br />
                <span style={{ color: '#0ea5b0', fontWeight: 700 }}>
                  {formatPrice(p.price_inr)}
                </span><br />
                <small>{p.area_sqft.toLocaleString()} sqft · {p.property_type}</small>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        {mapError && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'var(--off-white)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8, color: 'var(--gray-400)',
          }}>
            <span style={{ fontSize: '2rem' }}>🗺️</span>
            <span>Map tiles unavailable — other features still work.</span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        <div className="map-legend-title">📍 Price Legend</div>
        <div className="map-legend-grid">
          {LEGEND_COLORS.map((l) => (
            <div key={l.range} className="map-legend-item">
              <div className="map-legend-dot" style={{ background: l.color }} />
              {l.range}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
