// Utility helpers for acreIQ

export function formatPrice(inr) {
  if (inr >= 1e7) return `₹${(inr / 1e7).toFixed(2)} Cr`;
  if (inr >= 1e5) return `₹${(inr / 1e5).toFixed(1)} L`;
  return `₹${inr.toLocaleString('en-IN')}`;
}

export function formatPPSF(ppsf) {
  return `₹${Math.round(ppsf).toLocaleString('en-IN')}/sqft`;
}

export const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Independent House'];

export const POPULAR_LOCALITIES = [
  'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Hitech City',
  'Madhapur', 'Kondapur', 'Kukatpally', 'Miyapur',
];

// Colour pool for locality map markers
export const LOCALITY_COLORS = {
  'Banjara Hills':   '#e53e3e',
  'Jubilee Hills':   '#dd6b20',
  'Gachibowli':      '#d69e2e',
  'Hitech City':     '#38a169',
  'Madhapur':        '#3182ce',
  'Kondapur':        '#805ad5',
  'Manikonda':       '#d53f8c',
  'Kukatpally':      '#2b6cb0',
  'Miyapur':         '#276749',
  'Bachupally':      '#744210',
  'Kompally':        '#553c9a',
  'Uppal':           '#c53030',
  'Secunderabad':    '#1a365d',
  'Begumpet':        '#2c7a7b',
  'Nallagandla':     '#6b46c1',
};

export const DEMO_PPSF = {
  'Banjara Hills':   12000,
  'Jubilee Hills':   11500,
  'Gachibowli':      10000,
  'Hitech City':      9800,
  'Madhapur':         9500,
  'Kondapur':         8500,
  'Manikonda':        7200,
  'Kukatpally':       6800,
  'Miyapur':          5800,
  'Bachupally':       5200,
  'Kompally':         4800,
  'Uppal':            4500,
  'LB Nagar':         4200,
  'Dilsukhnagar':     4000,
  'Secunderabad':     6500,
  'Begumpet':         8000,
  'Ameerpet':         7500,
  'Attapur':          5000,
  'Tolichowki':       6000,
  'Nallagandla':      7000,
};
