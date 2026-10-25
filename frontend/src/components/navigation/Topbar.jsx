
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  ChevronRight,
  LogIn,
  LogOut,
  LoaderCircle,
} from 'lucide-react';

import '../../styles/topbar.css';

// Update this path if your AuthContext is stored elsewhere.
import { useAuth } from '../../context/AuthContext.jsx';

export default function Topbar({
  onMenuClick,
  onThemeToggle,
  theme = 'dark',
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const authenticated = Boolean(user);
  const isDark = theme === 'dark';

  const pageName =
    location.pathname === '/app' ||
    location.pathname === '/app/'
      ? 'Overview'
      : location.pathname
          .split('/')
          .filter(Boolean)
          .pop()
          ?.replace(/-/g, ' ')
          .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
        'Overview';

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    const confirmed = window.confirm(
      'Are you sure you want to log out of SecureTrack?'
    );

    if (!confirmed) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('SecureTrack logout failed:', error);
      window.alert('Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();

    const query = search.trim();
    if (!query) return;

    // Connect this to your existing global search route if available.
    navigate(`/app/search?q=${encodeURIComponent(query)}`);
  };

  const avatarLabel = (
    user?.name ||
    user?.username ||
    user?.email ||
    'A'
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="st-topbar">
      <div className="st-topbar-left">
        <button
          type="button"
          className="st-topbar-icon-button st-menu-button"
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
        >
          <Menu size={23} />
        </button>

        <nav className="st-breadcrumb" aria-label="Breadcrumb">
          <span className="st-breadcrumb-parent">Workspace</span>
          <ChevronRight size={17} aria-hidden="true" />
          <span className="st-breadcrumb-current">{pageName}</span>
        </nav>
      </div>

      <div className="st-topbar-right">
        <form
          className="st-topbar-search"
          role="search"
          onSubmit={handleSearch}
        >
          <Search size={20} aria-hidden="true" />

          <input
            type="search"
            placeholder="Search pages and actions"
            aria-label="Search pages and actions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <kbd>⌘ K</kbd>
        </form>

        <div
          className="st-system-status"
          role="status"
          aria-label="System status"
        >
          <span className="st-status-dot" />
          <span>Systems operational</span>
        </div>

        <button
          type="button"
          className="st-topbar-icon-button st-theme-button"
          onClick={onThemeToggle}
          aria-label={
            isDark ? 'Switch to light theme' : 'Switch to dark theme'
          }
          title={isDark ? 'Light theme' : 'Dark theme'}
        >
          {isDark ? <Sun size={21} /> : <Moon size={21} />}
        </button>

        <button
          type="button"
          className="st-topbar-avatar"
          aria-label={`Account: ${user?.name || user?.email || 'User'}`}
          title={user?.name || user?.email || 'Account'}
          onClick={() => navigate('/profile')}
        >
          {avatarLabel}
        </button>

        {authenticated ? (
          <button
            type="button"
            className="st-topbar-auth st-topbar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <LoaderCircle
                size={17}
                className="st-logout-spinner"
                aria-hidden="true"
              />
            ) : (
              <LogOut size={17} aria-hidden="true" />
            )}

            <span>
              {loggingOut ? 'Logging out…' : 'Logout'}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="st-topbar-auth st-topbar-login"
            onClick={handleLogin}
          >
            <LogIn size={17} aria-hidden="true" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
}
