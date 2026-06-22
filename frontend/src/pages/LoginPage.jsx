import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Chrome, Gauge, ShieldCheck, Sparkles } from 'lucide-react';
import { config } from '../config.js';
import './LoginPage.css';

export function LoginPage({ activeUser, setActiveUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const steps = [
    'Connecting to secure gateway...',
    'Synchronizing database credentials...',
    'Loading classroom configurations...',
    'Establishing session...'
  ];

  useEffect(() => {
    let interval;
    if (isAuthenticating) {
      interval = setInterval(() => {
        setLoadingStep((current) => {
          if (current >= steps.length - 1) {
            clearInterval(interval);
            // Complete authentication
            setActiveUser({
              name: 'Volunteer Teacher',
              email: 'volunteer.teacher@upay.org',
              role: 'Teacher',
              center: ''
            });
            return current;
          }
          return current + 1;
        });
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isAuthenticating, setActiveUser]);

  useEffect(() => {
    if (activeUser) {
      const from = location.state?.from || '/';
      const timer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeUser, navigate, location]);

  const startAutoLogin = () => {
    setIsAuthenticating(true);
    setLoadingStep(0);
  };

  const googleAuth = () => {
    window.location.href = `${config.authBaseUrl}${config.apiRoutes.authGoogle}`;
  };

  return (
    <section className="section auth-section">
      <div className="container auth-shell">
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
            <span className="eyebrow">UPAY Education Gate</span>
            <h2>Restoring the promise of childhood.</h2>
            <p className="auth-visual-desc">A unified workspace designed to empower educators, volunteers, and leaders.</p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-card">
            {activeUser ? (
              <div className="signed-in-card">
                <div className="success-icon">
                  <ShieldCheck size={34} />
                </div>
                <span className="eyebrow">Secure Connection</span>
                <h3>Welcome back</h3>
                <p>Establishing workspace session...</p>
                <div className="loader-bar"><div className="loader-progress" /></div>
              </div>
            ) : isAuthenticating ? (
              <div className="auth-loading-card">
                <div className="auth-spinner">
                  <div className="ring-inner" />
                  <div className="ring-middle" />
                  <div className="ring-outer" />
                  <Sparkles size={24} className="spinner-spark" />
                </div>
                <h3>{steps[loadingStep]}</h3>
                <p>Please hold, initializing secure workspace...</p>
              </div>
            ) : (
              <div className="auth-form">
                <span className="eyebrow">Sign In</span>
                <h1>Access Gateway</h1>
                <p className="auth-intro">All teachers and coordinators are registered volunteers. Select a login mode below to enter the portal.</p>

                <div className="auth-actions-group">
                  <button className="primary-button launch-workspace-button" type="button" onClick={startAutoLogin}>
                    Launch Volunteer Workspace
                    <ArrowRight size={18} />
                  </button>

                  <div className="divider-line">
                    <span>or continue as admin</span>
                  </div>

                  <button className="google-button" type="button" onClick={googleAuth}>
                    <Chrome size={19} />
                    Sign in with Google
                  </button>
                </div>

                <small>By entering, you agree to access UPAY NGO internal assets in compliance with organizational policies.</small>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
