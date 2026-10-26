import { NavLink } from 'react-router-dom';
import { Activity, AlertTriangle, Bell, FileText, Globe, LayoutDashboard, ListTodo, ScanLine, Settings, ShieldCheck } from 'lucide-react';
import '../../styles/sidebar.css';

const items = [
  ['Overview', '/app', LayoutDashboard, true],
  ['Websites', '/app/websites', Globe],
  ['Security scans', '/app/scans', ScanLine],
  ['Findings', '/app/findings', AlertTriangle],
  ['Remediation tasks', '/app/tasks', ListTodo],
  ['Reports', '/app/reports', FileText],
  ['Notifications', '/app/notifications', Bell],
  ['Activity logs', '/app/audit-logs', Activity],
  ['Settings', '/app/settings', Settings],
];

export default function Sidebar({ onNavigate, unreadCount = 0 }) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <NavLink className="brand" to="/app" onClick={onNavigate}>
        <span className="brand-icon"><ShieldCheck size={22} /></span>
        <span>Secure<span className="brand-blue">Track</span><small>SECURITY WORKSPACE</small></span>
      </NavLink>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {items.map(([label, path, Icon, end]) => (
          <NavLink key={path} to={path} end={Boolean(end)} onClick={onNavigate}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={18} aria-hidden="true" />
            <span>{label}</span>
            {label === 'Notifications' && unreadCount > 0 && <span className="nav-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="secure-card"><b>You're in control</b><p>Only monitor websites you're authorized to assess.</p></div>
      </div>
    </aside>
  );
}
