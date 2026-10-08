import { useState, useEffect, useCallback } from 'react';
import { Search, Map as MapIcon, BarChart2, Building2, AlertCircle, CheckCircle, X, PlusSquare } from 'lucide-react';
import './index.css';
import './App.css';

import { fetchProperties, fetchLocalities, fetchHealth } from './api.js';
import { POPULAR_LOCALITIES, PROPERTY_TYPES } from './utils.js';

import PropertyCard from './components/PropertyCard.jsx';
import PropertyDetail from './components/PropertyDetail.jsx';
import PricePredictor from './components/PricePredictor.jsx';
import LocalityMap from './components/LocalityMap.jsx';
import LocalitiesView from './components/LocalitiesView.jsx';
import CompareView from './components/CompareView.jsx';
import ListProperty from './components/ListProperty.jsx';

// ── Nav pages ──────────────────────────────────────────────────────────────
const PAGES = ['Search', 'Explore Map', 'Localities', 'Compare', 'List Property'];
const PAGE_ICONS = {
  Search: <Search size={15} />,
  'Explore Map': <MapIcon size={15} />,
  Localities: <Building2 size={15} />,
  Compare: <BarChart2 size={15} />,
  'List Property': <PlusSquare size={15} />,
};

export default function App() {
  // ── State ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState('Search');
  const [apiOk, setApiOk] = useState(null); // null=checking, true=ok, false=down

  // Properties
  const [properties, setProperties] = useState([]);
  const [propertyCatalog, setPropertyCatalog] = useState([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const [propsError, setPropsError] = useState(null);
  const [compareMessage, setCompareMessage] = useState('');

  // Localities
  const [localities, setLocalities] = useState([]);

  // Search filters
  const [searchLocality, setSearchLocality] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBudget, setFilterBudget] = useState('');
  const [filterArea, setFilterArea] = useState('');

  // Detail modal
  const [detailProp, setDetailProp] = useState(null);

  // Compare set (max 3)
  const [compareIds, setCompareIds] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('acreIQ.compareIds') || '[]').slice(0, 3).map(String); }
    catch { return []; }
  });
  const compareSet = compareIds.map((id) => propertyCatalog.find((p) => String(p.id) === id)).filter(Boolean);
  useEffect(() => { sessionStorage.setItem('acreIQ.compareIds', JSON.stringify(compareIds)); }, [compareIds]);

  // ── API health check ───────────────────────────────────────────────────
  useEffect(() => {
    fetchHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  // ── Load localities ────────────────────────────────────────────────────
  useEffect(() => {
    fetchLocalities()
      .then((r) => setLocalities(r.data))
      .catch(() => setLocalities(POPULAR_LOCALITIES));
  }, []);

  // ── Load properties ────────────────────────────────────────────────────
  const loadProperties = useCallback(async (params = {}) => {
    setPropsLoading(true);
    setPropsError(null);
    try {
      const res = await fetchProperties(params);
      setProperties(res.data);
      setPropertyCatalog((previous) => [...new Map([...previous, ...res.data].map((p) => [String(p.id), p])).values()]);
    } catch {
      setPropsError('Could not load properties. Is the backend running on port 8000?');
    } finally {
      setPropsLoading(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  // ── Search / filter ────────────────────────────────────────────────────
  function handleSearch() {
    const params = {};
    if (searchLocality) params.locality = searchLocality;
    if (filterType) params.property_type = filterType;
    if (filterBudget) params.max_budget = Number(filterBudget) * 1e5; // input in Lakhs
    if (filterArea) params.min_area = Number(filterArea);
    loadProperties(params);
    setPage('Search');
  }

  function handleChipClick(loc) {
    setSearchLocality(loc);
    loadProperties({ locality: loc });
    setPage('Search');
  }

  // ── Compare ────────────────────────────────────────────────────────────
  function toggleCompare(prop) {
    const id = String(prop.id);
    setPropertyCatalog((previous) => [...new Map([...previous, prop].map((p) => [String(p.id), p])).values()]);
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) { setCompareMessage('You can compare up to three properties. Remove one to add another.'); return prev; }
      setCompareMessage(''); return [...prev, id];
    });
  }
  function isCompared(prop) { return compareIds.includes(String(prop.id)); }

  async function handlePublished(savedProperty) {
    await loadProperties();
    setDetailProp(savedProperty);
    setPage('Search');
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Navbar ───────────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setPage('Search')}>
          <div className="navbar-logo-icon">A</div>
          <span className="navbar-title">acre<span>IQ</span></span>
        </div>
        <div className="navbar-nav">
          {PAGES.map((p) => (
            <button
              key={p}
              className={`nav-btn${page === p ? ' active' : ''}`}
              onClick={() => setPage(p)}
            >
              {PAGE_ICONS[p]}
              <span>{p}</span>
            </button>
          ))}
        </div>
        {/* API status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {apiOk === true && <CheckCircle size={14} color="#0ea5b0" title="Backend connected" />}
          {apiOk === false && <AlertCircle size={14} color="#e53e3e" title="Backend offline" />}
        </div>
      </nav>

      {/* ── API offline banner ────────────────────────────────────────── */}
      {apiOk === false && (
        <div style={{
          background: '#fff0f0', borderBottom: '1px solid #ffc5c5',
          padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.85rem', color: '#c0392b',
        }}>
          <AlertCircle size={14} />
          Backend API not reachable. Run:&nbsp;
          <code style={{ background: '#ffe4e4', padding: '1px 6px', borderRadius: 4 }}>
            uvicorn main:app --reload --port 8000
          </code>
          &nbsp;in the backend folder.
        </div>
      )}

      {/* ── SEARCH PAGE ───────────────────────────────────────────────── */}
      {page === 'Search' && (
        <>
          {/* Hero */}
          <section className="hero-section">
            <div className="hero-badge">
              ✦ AI-Powered Real Estate Intelligence
            </div>
            <h1 className="hero-title">
              Find a property.<br />
              <span>Understand its value.</span>
            </h1>
            <p className="hero-subtitle">
              Hyderabad's most intelligent property valuation platform — powered by machine learning and local market data.
            </p>

            {/* Search box */}
            <div className="search-box">
              <div className="search-row">
                <div className="form-group">
                  <label className="form-label">Search locality</label>
                  <input
                    className="input"
                    placeholder="e.g. Banjara Hills"
                    value={searchLocality}
                    onChange={(e) => setSearchLocality(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Property Type</label>
                  <select className="select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Budget (Lakhs)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 150"
                    value={filterBudget}
                    onChange={(e) => setFilterBudget(e.target.value)}
                  />
                </div>
              </div>
              <div className="search-row-bottom">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Min Area (sqft)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 1000"
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary btn-lg search-btn" onClick={handleSearch}>
                  <Search size={18} /> Search
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSearchLocality('');
                    setFilterType('');
                    setFilterBudget('');
                    setFilterArea('');
                    loadProperties();
                  }}
                >
                  Clear
                </button>
              </div>

              {/* Popular chips */}
              <div className="popular-row">
                <span className="popular-label">Popular:</span>
                {POPULAR_LOCALITIES.map((loc) => (
                  <button
                    key={loc}
                    className={`chip${searchLocality === loc ? ' active' : ''}`}
                    onClick={() => handleChipClick(loc)}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Property Listings */}
          <div className="main-layout">
            {/* Filter bar */}
            <div className="filter-bar">
              <div className="filter-group">
                <span className="filter-label">Showing</span>
                <span style={{ fontWeight: 700, color: 'var(--navy)' }}>
                  {properties.length} properties
                </span>
              </div>
              <div className="filter-group">
                <label className="filter-label">Type</label>
                <select
                  className="select"
                  style={{ minWidth: 140 }}
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); handleSearch(); }}
                >
                  <option value="">All Types</option>
                  {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {propsLoading && (
              <div className="loading-center">
                <div className="spinner" />
                <span>Loading properties…</span>
              </div>
            )}
            {propsError && <div className="error-box">{propsError}</div>}
            {!propsLoading && !propsError && (
              <>
                {properties.length === 0 ? (
                  <div className="loading-center">
                    <span style={{ fontSize: '2rem' }}>🔍</span>
                    <span>No properties found. Try different filters.</span>
                  </div>
                ) : (
                  <div className="property-grid">
                    {properties.map((p) => (
                      <PropertyCard
                        key={p.id}
                        property={p}
                        onView={setDetailProp}
                        onCompareToggle={toggleCompare}
                        isCompared={isCompared(p)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Price Predictor */}
            <div className="page-section" style={{ marginTop: 36 }}>
              <div className="section-title">🔮 AI Price Estimator</div>
              <div className="section-subtitle">
                Enter property details to get an ML-powered demo estimate
              </div>
              <PricePredictor localities={localities} />
            </div>
          </div>
        </>
      )}

      {/* ── EXPLORE MAP PAGE ──────────────────────────────────────────── */}
      {page === 'Explore Map' && (
        <div className="main-layout">
          <div className="page-section">
            <div className="section-title">🗺️ Explore Hyderabad</div>
            <div className="section-subtitle">
              Click any marker to see locality and demo price information
            </div>
            <LocalityMap properties={properties.length > 0 ? properties : []} />
          </div>
        </div>
      )}

      {/* ── LOCALITIES PAGE ───────────────────────────────────────────── */}
      {page === 'Localities' && (
        <div className="main-layout">
          <div className="page-section">
            <div className="section-title">📍 Locality Intelligence</div>
            <div className="section-subtitle">
              Browse all localities — click a card to view the price trend chart
            </div>
            <LocalitiesView localities={localities} />
          </div>
        </div>
      )}

      {/* ── COMPARE PAGE ─────────────────────────────────────────────── */}
      {page === 'List Property' && <ListProperty localities={localities} onPublished={handlePublished} onCancel={() => setPage('Search')} />}

      {page === 'Compare' && (
        <div className="main-layout">
          <div className="page-section">
            <div className="section-title">⚖️ Compare Properties</div>
            <div className="section-subtitle">
              Select up to 3 properties using the "Compare" checkbox on any listing
            </div>
            <CompareView
              properties={compareSet}
              onRemove={(p) => setCompareIds((prev) => prev.filter((id) => id !== String(p.id)))}
              onClear={() => setCompareIds([])}
            />
          </div>
        </div>
      )}

      {/* ── Property Detail Modal ─────────────────────────────────────── */}
      {detailProp && (
        <PropertyDetail
          property={detailProp}
          onClose={() => setDetailProp(null)}
          onCompareToggle={toggleCompare}
          isCompared={isCompared(detailProp)}
        />
      )}

      {/* ── Floating Compare Bar ──────────────────────────────────────── */}
      {compareMessage && <div className="compare-message" role="status">{compareMessage}<button onClick={() => setCompareMessage('')} aria-label="Dismiss"><X size={14}/></button></div>}
      {compareSet.length > 0 && page !== 'Compare' && page !== 'List Property' && (
        <div className="compare-bar">
          <span className="compare-bar-count">{compareSet.length}</span>
          <span className="compare-bar-info">
            propert{compareSet.length === 1 ? 'y' : 'ies'} selected for comparison
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => setPage('Compare')}>
            Compare Now
          </button>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-200)', display: 'flex' }}
            onClick={() => setCompareIds([])}
            title="Clear compare"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
