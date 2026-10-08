import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Approximate neighborhood centers used only when an API record has no usable coordinates.
// These identify localities, not individual property addresses.
const LOCALITY_CENTERS = {
  'Banjara Hills': [17.413, 78.449],
  'Jubilee Hills': [17.432, 78.408],
  Gachibowli: [17.440, 78.349],
  'Hitech City': [17.448, 78.376],
  Madhapur: [17.448, 78.392],
  Kondapur: [17.471, 78.361],
  Manikonda: [17.399, 78.387],
  Kukatpally: [17.485, 78.400],
  Miyapur: [17.500, 78.355],
  Bachupally: [17.531, 78.393],
  Kompally: [17.545, 78.473],
  Uppal: [17.406, 78.560],
  Secunderabad: [17.440, 78.498],
  Begumpet: [17.445, 78.462],
  Nallagandla: [17.461, 78.327],
  'LB Nagar': [17.346, 78.552],
  Dilsukhnagar: [17.369, 78.525],
  Ameerpet: [17.438, 78.448],
  Attapur: [17.369, 78.431],
  Tolichowki: [17.399, 78.412],
};

function getCoordinates(property) {
  const latitude = property.latitude;
  const longitude = property.longitude;
  if (latitude !== null && latitude !== '' && longitude !== null && longitude !== '') {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      // The backend's generic city-center default is not a property location.
      if (lat === 17.4399 && lng === 78.4983 && property.locality !== 'Secunderabad') {
        return LOCALITY_CENTERS[property.locality] || [lat, lng];
      }
      return [lat, lng];
    }
  }
  return LOCALITY_CENTERS[property.locality] || null;
}

function getPriceColor(price) {
  if (price >= 1e7) return '#e53e3e';
  if (price >= 5e6) return '#dd6b20';
  if (price >= 2.5e6) return '#d69e2e';
  return '#38a169';
}

function FitToMarkers({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length) {
      map.fitBounds(coordinates, { padding: [28, 28], maxZoom: 11 });
    }
  }, [coordinates, map]);
  return null;
}

export default function LocalityMap({ properties }) {
  const [mapError, setMapError] = useState(false);
  const center = [17.4399, 78.4483]; // Hyderabad center
  const mappedProperties = useMemo(() => properties
    .map((property) => ({ property, position: getCoordinates(property) }))
    .filter((item) => item.position), [properties]);
  const coordinates = useMemo(() => mappedProperties.map((item) => item.position), [mappedProperties]);

  return (
    <div>
      <div
        className="map-container"
        style={{ height: 440, position: 'relative' }}
        onError={() => setMapError(true)}
      >
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ error: () => setMapError(true) }}
          />
          <FitToMarkers coordinates={coordinates} />
          {mappedProperties.map(({ property: p, position }) => {
            const markerColor = getPriceColor(Number(p.price_inr) || 0);
            const icon = L.divIcon({
              className: 'acreIQ-map-icon',
              html: `<svg width="34" height="42" viewBox="0 0 34 42" aria-hidden="true"><path d="M17 1C8.2 1 1 8.1 1 16.8c0 11.2 16 24.2 16 24.2s16-13 16-24.2C33 8.1 25.8 1 17 1Z" fill="${markerColor}" stroke="white" stroke-width="2"/><circle cx="17" cy="16" r="5" fill="white"/></svg>`,
              iconSize: [34, 42],
              iconAnchor: [17, 42],
              popupAnchor: [0, -38],
            });
            return <Marker key={p.id} position={position} icon={icon}>
              <Popup>
                <strong>{p.locality}</strong><br />
                {p.title && <>{p.title}<br /></>}
                <span style={{ color: '#0ea5b0', fontWeight: 700 }}>
                  {p.price_inr == null ? 'Demo price unavailable' : formatPrice(Number(p.price_inr))}
                </span><br />
                {p.area_sqft != null && <small>{Number(p.area_sqft).toLocaleString()} sqft · {p.property_type}</small>}
              </Popup>
            </Marker>;
          })}
        </MapContainer>
        {!mapError && mappedProperties.length === 0 && (
          <div className="map-empty-state">No property locations are available. Check the API connection and try again.</div>
        )}
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
