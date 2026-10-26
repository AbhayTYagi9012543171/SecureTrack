
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const isAuthenticated = Boolean(user);

  const closeMenus = () => {
    setMenuOpen(false);
    setAccountOpen(false);
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
      closeMenus();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      window.alert(
        'Unable to complete logout. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="public-nav">
      <div className="public-nav-inner">
        <Link
          className="brand"
          to="/"
          aria-label="SecureTrack home"
          onClick={closeMenus}
        >
          <span className="brand-icon">
            <ShieldCheck size={23} strokeWidth={2.2} />
            <span className="brand-icon-status" />
          </span>

          <span className="brand-wordmark">
            Secure<span className="brand-blue">Track</span>
            <span className="brand-edition">SECURITY PLATFORM</span>
          </span>
        </Link>

        <nav
          className={`public-nav-links ${
            menuOpen ? 'is-open' : ''
          }`}
          id="public-navigation"
          aria-label="Main navigation"
        >
          <Link to="/features" onClick={closeMenus}>
            Features
          </Link>

          <Link to="/how-it-works" onClick={closeMenus}>
            How it works
          </Link>

          <Link to="/pricing" onClick={closeMenus}>
            Pricing
          </Link>

          {isAuthenticated && (
            <Link
              className="mobile-dashboard-link"
              to="/app"
              onClick={closeMenus}
            >
              Dashboard <ArrowUpRight size={16} />
            </Link>
          )}

          <div className="mobile-nav-actions">
            {isAuthenticated ? (
              <button
                className="nav-logout-button"
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut size={17} />
                {loggingOut ? 'Logging out…' : 'Logout'}
              </button>
            ) : (
              <>
                <Link
                  className="nav-mobile-login"
                  to="/login"
                  onClick={closeMenus}
                >
                  <LogIn size={17} /> Sign in
                </Link>

                <Link
                  className="nav-mobile-register"
                  to="/register"
                  onClick={closeMenus}
                >
                  Get started <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="public-nav-actions">
          {isAuthenticated ? (
            <>
              <Link className="nav-dashboard" to="/app">
                Dashboard <ArrowUpRight size={16} />
              </Link>

              <div className="nav-account">
                <button
                  className="nav-account-trigger"
                  type="button"
                  aria-expanded={accountOpen}
                  aria-label="Open account menu"
                  onClick={() => setAccountOpen((open) => !open)}
                >
                  <span className="nav-avatar">
                    {(user?.name || user?.email || 'U')
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>

                  <ChevronDown size={15} />
                </button>

                {accountOpen && (
                  <div className="nav-account-menu">
                    <div className="nav-account-details">
                      <span className="nav-account-name">
                        {user?.name || 'SecureTrack User'}
                      </span>

                      <span className="nav-account-email">
                        {user?.email || 'Signed-in account'}
                      </span>
                    </div>

                    <div className="nav-account-divider" />

                    <Link
                      to="/app/profile"
                      onClick={closeMenus}
                    >
                      <Check size={16} /> My profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <LogOut size={16} />
                      {loggingOut ? 'Logging out…' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">
                <LogIn size={16} />
                Sign in
              </Link>

              <Link className="nav-register" to="/register">
                Get started
                <ArrowUpRight size={17} />
              </Link>
            </>
          )}
        </div>

        <button
          className="nav-mobile-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-controls="public-navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
    </header>
  );
}
