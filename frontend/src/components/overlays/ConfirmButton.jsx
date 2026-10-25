import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
export default function ConfirmButton({ children, confirmText = 'Are you sure?', onConfirm, className = 'btn secondary', disabled = false }) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? <span className="st-confirm-inline" role="group" aria-label="Confirm action">
    <span><AlertTriangle size={14} aria-hidden="true" />{confirmText}</span>
    <button type="button" className="btn small primary" disabled={disabled} onClick={async () => { await onConfirm?.(); setConfirming(false); }}>Confirm</button>
    <button type="button" className="btn small ghost" onClick={() => setConfirming(false)}>Cancel</button>
  </span> : <button type="button" className={className} disabled={disabled} onClick={() => setConfirming(true)}>{children}</button>;
}
