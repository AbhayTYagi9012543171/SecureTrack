
import { AuthPage as SharedAuthPage } from './AppPages.jsx';
import '../styles/auth.css';

/**
 * SecureTrack authentication page entry.
 * Authentication logic remains centralized in AppPages.jsx
 * to preserve the existing routes, AuthContext, and API integration.
 */
export default function AuthPage() {
  return <SharedAuthPage mode="login" />;
}
