import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
  Home,
  Image,
  LogIn,
  LogOut,
  Menu,
  Settings,
  Users,
  X
} from 'lucide-react';
import { config } from '../config.js';
import './Layout.css';

const publicNavItems = [
  [config.routes.home, 'Home', Home],
  [config.routes.about, 'About', BookOpen],
  [config.routes.programs, 'Programs', HeartHandshake]
];

const operationsNavItems = [
  [config.routes.students, 'Students', GraduationCap],
  [config.routes.attendance, 'Attendance', CalendarCheck],
  [config.routes.reports, 'Reports', BarChart3],
  [config.routes.gallery, 'Gallery', Image]
];

const roleRank = { Viewer: 0, Volunteer: 1, Teacher: 2, Admin: 3 };

function canSee(role, minimumRole) {
  return roleRank[role || 'Viewer'] >= roleRank[minimumRole];
}

export function Layout({ activeUser, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const role = activeUser?.role || 'Viewer';
  const isSignedIn = Boolean(activeUser);
  const showOperations = canSee(role, 'Volunteer');
  const showSystem = canSee(role, 'Admin');

  const visiblePublicNavItems = publicNavItems;
  const visibleOperationsNavItems = showOperations ? operationsNavItems : [];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <NavLink className="brand" to={config.routes.home} onClick={() => setMenuOpen(false)} aria-label="UPAY home">
          <span>
            <strong>UPAY</strong>
            <small>Education with dignity</small>
          </span>
        </NavLink>
        <div className="header-status" aria-label="Current account status">
          {isSignedIn ? (
            <div className="nav-group user-profile-group">
              <button
                type="button"
                className="nav-group-trigger user-profile-trigger"
                aria-haspopup="true"
              >
                <span>{activeUser.name}</span>
              </button>
              <div className="nav-group-menu compact user-profile-menu">
                {showSystem && (
                  <NavLink to={config.routes.admin} className="profile-menu-item" onClick={() => setMenuOpen(false)}>
                    <Settings size={14} />
                    Admin Settings
                  </NavLink>
                )}
                <button className="secondary-button header-signout" type="button" onClick={onSignOut}>
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <NavLink className="secondary-button login-nav-button" to={config.routes.login}>
              Sign in
            </NavLink>
          )}
        </div>
        <button
          className="menu-button icon-button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          type="button"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav id="primary-navigation" className={menuOpen ? 'nav open' : 'nav'} aria-label="Main navigation">
          {visiblePublicNavItems.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} end={to === config.routes.home}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {visibleOperationsNavItems.length > 0 && (
            <div className="nav-group" data-open={openGroup === 'operations'}>
              <button
                type="button"
                className="nav-group-trigger"
                aria-expanded={openGroup === 'operations'}
                aria-controls="operations-menu"
                onClick={() => setOpenGroup((current) => (current === 'operations' ? null : 'operations'))}
              >
                <GraduationCap size={16} />
                Operations
              </button>
              <div id="operations-menu" className="nav-group-menu">
                {visibleOperationsNavItems.map(([to, label, Icon]) => (
                  <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
                    <Icon size={16} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          )}
          <div className="nav-group" data-open={openGroup === 'account'}>
            <button
              type="button"
              className="nav-group-trigger"
              aria-expanded={openGroup === 'account'}
              aria-controls="account-menu"
              onClick={() => setOpenGroup((current) => (current === 'account' ? null : 'account'))}
            >
              <Users size={16} />
              {isSignedIn ? activeUser.name : 'Account'}
            </button>
            <div id="account-menu" className="nav-group-menu compact">
              {showSystem && (
                <NavLink key={config.routes.admin} to={config.routes.admin} onClick={() => { setMenuOpen(false); setOpenGroup(null); }}>
                  <Settings size={16} />
                  Admin
                </NavLink>
              )}
              {isSignedIn ? (
                <button
                  key="logout"
                  className="nav-action-link"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenGroup(null);
                    onSignOut();
                  }}
                  type="button"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <NavLink key={config.routes.login} to={config.routes.login} onClick={() => { setMenuOpen(false); setOpenGroup(null); }}>
                  <LogIn size={16} />
                  Login
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="container footer-grid">
          <div className="footer-brand-section">
            <strong className="footer-title">UPAY</strong>
            <p className="footer-desc">Restoring the promise of childhood by providing structured education, equal opportunities, and compassionate care to underserved communities.</p>
          </div>

          <div className="footer-links-section">
            <h4>Quick Links</h4>
            <div className="footer-links">
              <NavLink to={config.routes.home}>Home</NavLink>
              <NavLink to={config.routes.about}>Our Story</NavLink>
              <NavLink to={config.routes.programs}>Programs</NavLink>
              <NavLink to={config.routes.gallery}>Gallery</NavLink>
            </div>
          </div>

          <div className="footer-accent-section">
            <span className="footer-tagline-sexy">
              <span>empower</span>
              <span className="bullet">·</span>
              <span>educate</span>
              <span className="bullet">·</span>
              <span>elevate</span>
            </span>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <div className="container">
            <p>Designed with absolute dedication to child development and grassroots community support.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
