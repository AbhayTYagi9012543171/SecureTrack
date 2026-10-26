import { Search, X } from 'lucide-react';
export default function SearchField({ value, onChange, placeholder = 'Search…', label = 'Search', onClear }) {
  return <label className="st-search-field"><span className="u-sr-only">{label}</span><Search size={16} aria-hidden="true" />
    <input type="search" value={value} onChange={e => onChange?.(e.target.value)} placeholder={placeholder} />
    {value && <button type="button" onClick={() => { onChange?.(''); onClear?.(); }} aria-label="Clear search"><X size={15} /></button>}
  </label>;
}
