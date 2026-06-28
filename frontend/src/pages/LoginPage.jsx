import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { config } from '../config.js';
import { apiRequest } from '../utils/api.js';
import './LoginPage.css';

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

function authErrorMessage(value) {
  if (value === 'google_auth_failed') return 'Google sign-in was cancelled or could not be verified. Please try again.';
  return value ? 'Sign-in could not be completed. Please try again.' : '';
}

export function LoginPage({ activeUser, setActiveUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const callbackCode = new URLSearchParams(location.hash.replace(/^#/, '')).get('code');
  const [loading, setLoading] = useState(Boolean(callbackCode));
  const [error, setError] = useState(authErrorMessage(params.get('error')));

  useEffect(() => {
    if (!callbackCode || activeUser) return undefined;
    let cancelled = false;

    window.history.replaceState({}, document.title, location.pathname);
    apiRequest(config.apiRoutes.authExchange, {
      method: 'POST',
      body: JSON.stringify({ code: callbackCode }),
      skipAuthRedirect: true
    })
      .then((data) => {
        if (cancelled) return;
        window.sessionStorage.setItem('upayinfoPVT.authToken', data.token);
        window.sessionStorage.setItem('upayinfoPVT.activeUser', JSON.stringify(data.user));
        setActiveUser(data.user);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'The sign-in link expired. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeUser, callbackCode, location.pathname, setActiveUser]);

  useEffect(() => {
    if (!activeUser) return undefined;
    const destination = location.state?.from || '/';
    const timer = setTimeout(() => navigate(destination, { replace: true }), 350);
    return () => clearTimeout(timer);
  }, [activeUser, location.state, navigate]);

  const googleAuth = () => window.location.assign(`${config.authBaseUrl}${config.apiRoutes.authGoogle}`);

  return (
    <section className="section auth-section">
      <div className="container auth-shell">
        <div className="auth-visual-panel">
          <div className="auth-glow" aria-hidden="true" />
          <div className="auth-rings" aria-hidden="true"><span /><span /><span /></div>
          <div className="auth-visual-copy">
            <span className="eyebrow">Private teacher workspace</span>
            <h2>{config.appName} attendance management.</h2>
            <p className="auth-visual-desc">A personal tool for approved teachers to manage classes, attendance, students, and reports.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          {activeUser ? (
            <div className="signed-in-card">
              <div className="success-icon"><ShieldCheck size={34} /></div>
              <span className="eyebrow">Identity verified</span>
              <h3>Welcome back</h3>
              <p>{activeUser.role === 'Viewer' ? 'Your account is awaiting classroom access approval.' : 'Opening your workspace…'}</p>
              <div className="loader-bar"><div className="loader-progress" /></div>
            </div>
          ) : (
            <div className="auth-card">
              <h1 className="form-title">Sign in to {config.appName}</h1>
              <p className="auth-intro">Use your verified Google account. New accounts receive no classroom access until the workspace owner approves them.</p>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button className="google-button" type="button" onClick={googleAuth} disabled={loading}>
                <GoogleMark /> {loading ? 'Verifying with Google…' : 'Sign in with Google'}
              </button>

              <div className="portal-identity-note">
                <strong>Know where you are signing in</strong>
                <p>{config.appName} is an independently operated personal productivity tool hosted on Render, not a public or institution-operated service. Google authenticates your identity; this tool never asks for or receives your Google password.</p>
              </div>

              <small className="auth-legal">
                Authorized use only. Read our <Link to={config.routes.privacy}>privacy notice</Link> and <Link to={config.routes.terms}>portal terms</Link>.
              </small>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
