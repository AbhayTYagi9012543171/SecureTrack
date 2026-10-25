import { Inbox } from 'lucide-react';
export default function EmptyState({ title = 'Nothing here yet', description, action, icon: Icon = Inbox }) {
  return <section className="st-empty" aria-live="polite">
    <span className="st-empty__icon"><Icon size={22} aria-hidden="true" /></span>
    <h3>{title}</h3>{description && <p>{description}</p>}{action}
  </section>;
}
