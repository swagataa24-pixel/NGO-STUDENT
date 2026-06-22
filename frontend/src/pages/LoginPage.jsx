import { useState } from 'react';
import { ArrowRight, Chrome, LockKeyhole, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { config } from '../config.js';

export function LoginPage({ activeUser, setActiveUser }) {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Teacher',
    center: '',
    password: ''
  });

  const isSignup = mode === 'signup';

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const localAuth = (event) => {
    event.preventDefault();
    setActiveUser({
      name: form.name || (isSignup ? 'New UPAY Member' : 'UPAY User'),
      email: form.email || 'local.user@upay.local',
      role: form.role,
      center: form.center
    });
  };

  const googleAuth = () => {
    window.location.href = `${config.authBaseUrl}${config.apiRoutes.authGoogle}`;
  };

  return (
    <section className="section auth-section">
      <div className={`container auth-shell ${isSignup ? 'signup-mode' : 'signin-mode'}`}>
        <div className="auth-visual-panel">
          <div className="auth-glow" aria-hidden="true" />
          <div className="auth-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="auth-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="auth-visual-content">
            <span className="eyebrow">UPAY secure access</span>
            <h2>{isSignup ? 'Step into the workspace.' : 'Welcome back.'}</h2>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button className={!isSignup ? 'active' : ''} onClick={() => setMode('signin')} type="button">
              Sign in
            </button>
            <button className={isSignup ? 'active' : ''} onClick={() => setMode('signup')} type="button">
              Sign up
            </button>
          </div>

          {activeUser ? (
            <div className="signed-in-card">
              <ShieldCheck size={42} />
              <h3>{activeUser.name}</h3>
              <p>{activeUser.role} access is active for this session.</p>
              <button className="secondary-button" onClick={() => setActiveUser(null)} type="button">
                Sign out
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={localAuth}>
              <span className="eyebrow">{isSignup ? 'New access' : 'Google OAuth'}</span>
              <h1>{isSignup ? 'Create access' : 'Sign in'}</h1>

              {isSignup && (
                <label>
                  <span>Full name</span>
                  <div className="auth-input">
                    <UserPlus size={18} />
                    <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Your name" />
                  </div>
                </label>
              )}

              <label>
                <span>Email</span>
                <div className="auth-input">
                  <Mail size={18} />
                  <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="name@upay.org" />
                </div>
              </label>

              <label>
                <span>Password</span>
                <div className="auth-input">
                  <LockKeyhole size={18} />
                  <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Local preview password" />
                </div>
              </label>

              <div className="auth-two-col">
                <label>
                  <span>Role</span>
                  <select value={form.role} onChange={(event) => update('role', event.target.value)}>
                    <option>Teacher</option>
                    <option>Admin</option>
                    <option>Volunteer</option>
                    <option>Viewer</option>
                  </select>
                </label>
                <label>
                  <span>Center</span>
                  <input value={form.center} onChange={(event) => update('center', event.target.value)} placeholder="Assigned center" />
                </label>
              </div>

              <button className="primary-button auth-submit" type="submit">
                {isSignup ? 'Create preview account' : 'Sign in'}
                <ArrowRight size={18} />
              </button>

              <button className="google-button" type="button" onClick={googleAuth}>
                <Chrome size={19} />
                {isSignup ? 'Sign up with Google' : 'Continue with Google'}
              </button>

              <small>Secure login through UPAY Google workspace.</small>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
