import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const icons = { error: AlertCircle, success: CheckCircle2, info: Info };
export default function InlineNotice({ type = 'info', title, children, role }) {
  const Icon = icons[type] || Info;
  return <section className={`st-notice st-notice--${type}`} role={role || (type === 'error' ? 'alert' : 'status')}>
    <Icon size={18} aria-hidden="true" /><div><strong>{title}</strong>{children && <div className="st-notice__body">{children}</div>}</div>
  </section>;
}
