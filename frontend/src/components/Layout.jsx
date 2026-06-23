import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
  Home,
  Image,
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

const adminOperationsNavItems = [[config.routes.volunteers, 'Manage Volunteers', Users]];

const roleRank = { Viewer: 0, Teacher: 1, Admin: 2 };

function canSee(role, minimumRole) {
  return roleRank[role || 'Viewer'] >= roleRank[minimumRole];
}

export function Layout({ activeUser, onSignOut }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const role = activeUser?.role || 'Viewer';
  const isSignedIn = Boolean(activeUser);
  const showSystem = canSee(role, 'Admin');

  const visiblePublicNavItems = publicNavItems;
  const visibleOperationsNavItems = showSystem ? [...operationsNavItems, ...adminOperationsNavItems] : operationsNavItems;

  useEffect(() => {
    if (!profileOpen) return undefined;

    const closeProfileMenu = (event) => {
      if (!event.target.closest('.user-profile-group')) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('click', closeProfileMenu);
    return () => document.removeEventListener('click', closeProfileMenu);
  }, [profileOpen]);

  const handleSignOut = () => {
    setProfileOpen(false);
    setMenuOpen(false);
    onSignOut();
    navigate(config.routes.home, { replace: true });
  };

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
            <div className="nav-group user-profile-group" data-open={profileOpen}>
              <button
                type="button"
                className="nav-group-trigger user-profile-trigger"
                aria-haspopup="true"
                aria-expanded={profileOpen}
                aria-controls="user-profile-menu"
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span>{activeUser.name}</span>
              </button>
              <div id="user-profile-menu" className="nav-group-menu compact user-profile-menu">
                {showSystem && (
                  <NavLink
                    to={config.routes.admin}
                    className="profile-menu-item"
                    onClick={() => {
                      setProfileOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <Settings size={14} />
                    Admin Panel
                  </NavLink>
                )}
                <button className="profile-menu-item profile-signout" type="button" onClick={handleSignOut}>
                  <LogOut size={14} />
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
        </nav>
      </header>
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="footer-orb footer-orb-1"></div>
        <div className="footer-orb footer-orb-2"></div>
        <div className="footer-orb footer-orb-3"></div>
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
