const statuses = ['active', 'completed', 'secure', 'resolved', 'critical', 'failed', 'unavailable', 'high', 'warning', 'medium', 'queued', 'open', 'cancelled', 'accepted', 'info', 'in_progress', 'pending', 'running'];
export default function StatusBadge({ status = 'pending' }) {
  const normalized = String(status).toLowerCase().trim().replace(/\s+/g, '_');
  const safe = statuses.includes(normalized) ? normalized : 'info';
  return <span className={`badge ${safe}`}>{safe.replace(/_/g, ' ')}</span>;
}
