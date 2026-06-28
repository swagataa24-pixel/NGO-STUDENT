import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { config } from '../config.js';
import { apiRequest } from '../utils/api.js';
import './LoginPage.css';

function authErrorMessage(value) {
  if (value === 'google_auth_failed') return 'Sign-in was cancelled or could not be verified. Please try again.';
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

  const authProviderRedirect = () => window.location.assign(`${config.authBaseUrl}${config.apiRoutes.authGoogle}`);

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
              <p className="auth-intro">Use your verified teacher account. New accounts receive no classroom access until the workspace owner approves them.</p>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button className="auth-provider-button" type="button" onClick={authProviderRedirect} disabled={loading}>
                {loading ? 'Verifying access…' : 'Secure Teacher Sign-in'}
              </button>

              <div className="portal-identity-note">
                <strong>Know where you are signing in</strong>
                <p>{config.appName} is an independently operated personal productivity tool hosted on Render, not a public or institution-operated service. This tool authenticates your identity securely without ever asking for or receiving your personal password.</p>
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
