import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Chrome, Eye, EyeOff, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import { config } from '../config.js';
import { apiRequest } from '../utils/api.js';
import './LoginPage.css';

export function LoginPage({ activeUser, setActiveUser }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  useEffect(() => {
    if (activeUser) {
      const from = location.state?.from || '/';
      const timer = setTimeout(() => navigate(from, { replace: true }), 500);
      return () => clearTimeout(timer);
    }
  }, [activeUser, navigate, location]);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setError(''); };

  const switchMode = (next) => { setMode(next); setError(''); setForm({ name: '', email: '', password: '', confirm: '' }); };

  const googleAuth = () => { window.location.href = `${config.authBaseUrl}${config.apiRoutes.authGoogle}`; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/signin';
      const body = mode === 'signup'
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const data  = await apiRequest(endpoint, {
        method:  'POST',
        body:    JSON.stringify(body)
      });

      window.localStorage.setItem('upay.authToken', data.token);
      window.localStorage.setItem('upay.activeUser', JSON.stringify(data.user));
      setActiveUser(data.user);
    } catch (err) {
      setError(err.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section auth-section">
      <div className="container auth-shell">

        {/* ── Left visual panel ── */}
        <div className={`auth-visual-panel ${mode === 'signup' ? 'mode-signup' : ''}`}>
          <div className="auth-glow" aria-hidden="true" />
          <div className="auth-rings" aria-hidden="true"><span /><span /><span /></div>
          <div className="auth-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="auth-visual-content">
            {mode === 'signin' ? (
              <>
                <span className="eyebrow">Welcome back</span>
                <h2>Sign in to your workspace.</h2>
                <p className="auth-visual-desc">Continue empowering classrooms, one session at a time.</p>
              </>
            ) : (
              <>
                <span className="eyebrow">Join UPAY</span>
                <h2>Create your account.</h2>
                <p className="auth-visual-desc">Register to become part of our volunteer educator network.</p>
              </>
            )}
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="auth-form-panel">
          {activeUser ? (
            <div className="signed-in-card">
              <div className="success-icon"><ShieldCheck size={34} /></div>
              <span className="eyebrow">Secure Connection</span>
              <h3>Welcome back</h3>
              <p>Establishing workspace session...</p>
              <div className="loader-bar"><div className="loader-progress" /></div>
            </div>
          ) : (
            <div className="auth-card">
              {/* Mode toggle tabs */}
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                  onClick={() => switchMode('signin')}
                >
                  <LogIn size={15} /> Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => switchMode('signup')}
                >
                  <UserPlus size={15} /> Sign Up
                </button>
              </div>

              {/* Sliding form viewport */}
              <div className="form-viewport">
                <div className={`form-slider ${mode === 'signup' ? 'shifted' : ''}`}>

                  {/* ── Sign In panel ── */}
                  <form className="auth-form-pane" onSubmit={handleSubmit} noValidate>
                    <h1 className="form-title">Sign In</h1>
                    <p className="auth-intro">Access your volunteer dashboard.</p>

                    <div className="field-group">
                      <label htmlFor="si-email">Email address</label>
                      <input id="si-email" type="email" placeholder="you@example.com"
                        value={mode === 'signin' ? form.email : ''} onChange={set('email')}
                        autoComplete="email" required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="si-pass">Password</label>
                      <div className="pass-wrap">
                        <input id="si-pass" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                          value={mode === 'signin' ? form.password : ''} onChange={set('password')}
                          autoComplete="current-password" required />
                        <button type="button" className="eye-btn" onClick={() => setShowPass((v) => !v)} aria-label="Toggle password">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {error && mode === 'signin' && <p className="auth-error">{error}</p>}

                    <button className="primary-button submit-btn" type="submit" disabled={loading}>
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>

                    <div className="divider-line"><span>or</span></div>

                    <button className="google-button" type="button" onClick={googleAuth}>
                      <Chrome size={19} /> Continue with Google
                    </button>
                  </form>

                  {/* ── Sign Up panel ── */}
                  <form className="auth-form-pane" onSubmit={handleSubmit} noValidate>
                    <h1 className="form-title">Create Account</h1>
                    <p className="auth-intro">New accounts join as <strong>Teacher / Volunteer</strong> with full access to operations.</p>

                    <div className="field-group">
                      <label htmlFor="su-name">Full name</label>
                      <input id="su-name" type="text" placeholder="Priya Sharma"
                        value={mode === 'signup' ? form.name : ''} onChange={set('name')}
                        autoComplete="name" required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="su-email">Email address</label>
                      <input id="su-email" type="email" placeholder="you@example.com"
                        value={mode === 'signup' ? form.email : ''} onChange={set('email')}
                        autoComplete="email" required />
                    </div>
                    <div className="field-group">
                      <label htmlFor="su-pass">Password <span className="hint">(min 8 chars)</span></label>
                      <div className="pass-wrap">
                        <input id="su-pass" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                          value={mode === 'signup' ? form.password : ''} onChange={set('password')}
                          autoComplete="new-password" required />
                        <button type="button" className="eye-btn" onClick={() => setShowPass((v) => !v)} aria-label="Toggle password">
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="field-group">
                      <label htmlFor="su-conf">Confirm password</label>
                      <div className="pass-wrap">
                        <input id="su-conf" type={showConf ? 'text' : 'password'} placeholder="••••••••"
                          value={mode === 'signup' ? form.confirm : ''} onChange={set('confirm')}
                          autoComplete="new-password" required />
                        <button type="button" className="eye-btn" onClick={() => setShowConf((v) => !v)} aria-label="Toggle confirm">
                          {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {error && mode === 'signup' && <p className="auth-error">{error}</p>}

                    <button className="primary-button submit-btn" type="submit" disabled={loading}>
                      {loading ? 'Creating account…' : 'Create Account'}
                    </button>

                    <div className="divider-line"><span>or</span></div>

                    <button className="google-button" type="button" onClick={googleAuth}>
                      <Chrome size={19} /> Sign up with Google
                    </button>
                  </form>

                </div>
              </div>

              <small className="auth-legal">By continuing, you agree to access UPAY NGO internal assets in compliance with organizational policies.</small>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
