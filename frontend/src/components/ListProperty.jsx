import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, ImagePlus, X } from 'lucide-react';
import { createProperty, predictPrice } from '../api.js';
import { formatPrice, formatPPSF } from '../utils.js';

const TYPES = ['Apartment', 'Independent House', 'Plot', 'Land'];
const MAX_BYTES = 5 * 1024 * 1024;
const emptyForm = { title: '', property_type: 'Apartment', locality: '', address: '', area_sqft: '', bedrooms: '2', age_years: '0', description: '', asking_price: '' };

export default function ListProperty({ localities, onPublished, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const previewUrls = useRef(new Set());
  const [estimate, setEstimate] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);
  const set = (key, value) => { setEstimate(null); setForm((current) => ({ ...current, [key]: value })); };

  function addFiles(event) {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    const next = [...files];
    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Photos must be JPG, PNG, or WebP.'); return; }
      if (file.size > MAX_BYTES) { setError('Each photo must be 5 MB or smaller.'); return; }
      if (next.length >= 5) { setError('You can add up to five photos.'); return; }
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      next.push({ file, previewUrl });
    }
    setError(''); setFiles(next); setEstimate(null);
  }

  function validate() {
    if (form.title.trim().length < 3 || form.title.length > 100) return 'Title must be 3–100 characters.';
    if (!form.locality.trim()) return 'Enter the Hyderabad locality.';
    if (!Number.isFinite(Number(form.area_sqft)) || Number(form.area_sqft) <= 0) return 'Area must be a positive number.';
    if (!Number.isInteger(Number(form.age_years)) || Number(form.age_years) < 0) return 'Age must be a non-negative whole number.';
    if (['Apartment', 'Independent House'].includes(form.property_type) && (!Number.isInteger(Number(form.bedrooms)) || Number(form.bedrooms) < 1 || Number(form.bedrooms) > 20)) return 'Enter a bedroom count from 1 to 20.';
    if (!form.description.trim() || form.description.length > 2000) return 'Description is required and must be at most 2,000 characters.';
    if (form.address.length > 300) return 'Address must be at most 300 characters.';
    if (form.asking_price && (!Number.isFinite(Number(form.asking_price)) || Number(form.asking_price) < 0)) return 'Asking price cannot be negative.';
    return '';
  }

  async function getEstimate() {
    const validation = validate(); if (validation) { setError(validation); return; }
    setBusy(true); setError(''); setEstimate(null);
    try {
      const response = await predictPrice({ locality: form.locality, property_type: form.property_type,
        area_sqft: Number(form.area_sqft), bedrooms: ['Plot', 'Land'].includes(form.property_type) ? 0 : Number(form.bedrooms), age_years: Number(form.age_years) });
      setEstimate(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Price estimate is unavailable for these inputs. You can still publish the listing.');
    } finally { setBusy(false); }
  }

  async function publish(event) {
    event.preventDefault(); const validation = validate(); if (validation) { setError(validation); return; }
    setBusy(true); setError('');
    try {
      const { data } = await createProperty({ ...form, bedrooms: ['Plot', 'Land'].includes(form.property_type) ? 0 : Number(form.bedrooms), files: files.map((item) => item.file) });
      setSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not publish the listing. Your form data is still here.');
    } finally { setBusy(false); }
  }

  if (success) return <div className="main-layout"><div className="listing-success">
    <CheckCircle size={36} color="var(--teal)"/><h2>Property saved successfully</h2>
    <p>Your listing is stored locally for this demo and is now available in Search.</p>
    <h3>{success.title}</h3><p>{success.locality} · {success.area_sqft.toLocaleString()} sqft</p>
    <div className="listing-previews">{success.images?.map((src) => <img key={src} src={`http://localhost:8000${src}`} alt="Uploaded property"/>)}</div>
    <button className="btn btn-primary" onClick={() => onPublished(success)}>View in Search</button>
  </div></div>;

  const field = (label, key, options = {}) => <div className="form-group" key={key}><label className="form-label" htmlFor={`listing-${key}`}>{label}</label>
    {options.choices ? <select id={`listing-${key}`} className="select" value={form[key]} onChange={(e) => set(key, e.target.value)}>{options.choices.map((choice) => <option key={choice}>{choice}</option>)}</select> :
      options.multiline ? <textarea id={`listing-${key}`} className="input listing-textarea" maxLength={2000} value={form[key]} onChange={(e) => set(key, e.target.value)} /> :
      <input id={`listing-${key}`} className="input" type={options.type || 'text'} min={options.min} max={options.max} value={form[key]} onChange={(e) => set(key, e.target.value)} />}
  </div>;

  return <div className="main-layout"><section className="listing-panel">
    <h1 className="section-title">List Your Property</h1><p className="section-subtitle">Add a Hyderabad property to the acreIQ demo.</p>
    <div className="disclaimer-box"><AlertTriangle size={14}/> Listings and photos are stored locally on this computer for this college demonstration. Prices are demonstration estimates, not verified valuations.</div>
    {error && <div className="error-box" role="alert">{error}</div>}
    <form onSubmit={publish}>
      <div className="listing-grid">
        {field('Property title *', 'title')}
        {field('Property type *', 'property_type', { choices: TYPES })}
        {field('Hyderabad locality *', 'locality', { choices: ['', ...localities] })}
        {field('Full address (optional)', 'address')}
        {field('Area (sq ft) *', 'area_sqft', { type: 'number', min: '1' })}
        {!['Plot', 'Land'].includes(form.property_type) && field('Bedrooms *', 'bedrooms', { type: 'number', min: '1', max: '20' })}
        {field('Property age (years) *', 'age_years', { type: 'number', min: '0' })}
        {field('Asking price (₹, optional)', 'asking_price', { type: 'number', min: '0' })}
        <div className="listing-full">{field('Description * (up to 2,000 characters)', 'description', { multiline: true })}</div>
      </div>
      <div className="form-group listing-upload"><label className="form-label" htmlFor="listing-photos">Property photos (up to five, 5 MB each)</label>
        <label className="upload-pick" htmlFor="listing-photos"><ImagePlus size={19}/> Choose JPG, PNG, or WebP images</label>
        <input id="listing-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles}/>
        <div className="listing-previews">{files.map((item, index) => <div className="listing-preview" key={`${item.file.name}-${index}`}><img src={item.previewUrl} alt={item.file.name}/><button type="button" aria-label="Remove photo" onClick={() => { URL.revokeObjectURL(item.previewUrl); previewUrls.current.delete(item.previewUrl); setFiles(files.filter((_, i) => i !== index)); }}><X size={14}/></button></div>)}</div>
      </div>
      <div className="listing-actions"><button type="button" className="btn btn-outline" disabled={busy} onClick={getEstimate}>Get Price Estimate</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Please wait…' : 'Publish Property'}</button>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={onCancel}>Cancel</button></div>
    </form>
    {estimate && <div className="prediction-result"><strong>DEMO ESTIMATE</strong><div className="prediction-price">{formatPrice(estimate.predicted_price_inr)}</div><div>{formatPPSF(estimate.price_per_sqft)}</div><p>{estimate.disclaimer}</p></div>}
  </section></div>;
}
