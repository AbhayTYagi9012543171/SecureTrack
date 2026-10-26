const levels = ['critical', 'high', 'medium', 'low', 'info', 'resolved'];
export default function SeverityBadge({ severity = 'info' }) {
  const normalized = String(severity).toLowerCase().replace(/\s+/g, '-');
  const safe = levels.includes(normalized) ? normalized : 'info';
  return <span className={`badge ${safe}`} data-severity={safe}>{safe.replace('-', ' ')}</span>;
}
