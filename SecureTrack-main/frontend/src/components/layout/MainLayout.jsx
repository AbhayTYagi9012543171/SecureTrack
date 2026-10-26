
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LoaderCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import Sidebar from '../navigation/Sidebar.jsx';
import Topbar from '../navigation/Topbar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

import '../../styles/mainlayout.css';

export default function MainLayout({
  children,
  sidebar,
  topbar,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('st-layout-ready');

    return () => {
      document.documentElement.classList.remove('st-layout-ready');
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;

    const confirmed = window.confirm(
      'Are you sure you want to sign out of SecureTrack?'
    );

    if (!confirmed) return;

    setLoggingOut(true);

    try {
      await logout();

      toast.success('You have signed out successfully.');

      navigate('/login', { replace: true });
    } catch (error) {
      console.error('SecureTrack logout failed:', error);

      toast.error(
        'The server could not confirm sign-out. Please try again.'
      );
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="app-shell">
      {sidebar || <Sidebar />}

      <main className="main-area">
        <div className="main-layout-topbar">
          {topbar || <Topbar user={user} />}

          <div className="main-layout-account">
            <div className="main-layout-user">
              <span className="main-layout-user-avatar">
                {(user?.name || 'U').slice(0, 1).toUpperCase()}
              </span>

              <div className="main-layout-user-info">
                <span className="main-layout-user-name">
                  {user?.name || 'User'}
                </span>

                <span className="main-layout-user-email">
                  {user?.email || 'SecureTrack account'}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="main-layout-logout"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Sign out of SecureTrack"
              title="Sign out"
            >
              {loggingOut ? (
                <LoaderCircle
                  size={17}
                  className="main-layout-logout-spinner"
                  aria-hidden="true"
                />
              ) : (
                <LogOut size={17} aria-hidden="true" />
              )}

              <span>
                {loggingOut ? 'Signing out…' : 'Logout'}
              </span>
            </button>
          </div>
        </div>

        <div className="page-wrap">{children}</div>
      </main>
    </div>
  );
}
