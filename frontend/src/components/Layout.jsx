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
  Menu,
  Settings,
  Users,
  X
} from 'lucide-react';
import { config } from '../config.js';

const publicNavItems = [
  [config.routes.home, 'Home', Home],
  [config.routes.about, 'About', BookOpen],
  [config.routes.programs, 'Programs', HeartHandshake]
];

const operationsNavItems = [
  [config.routes.students, 'Students', GraduationCap],
  [config.routes.attendance, 'Attendance', CalendarCheck],
  [config.routes.volunteers, 'Volunteers', Users],
  [config.routes.reports, 'Reports', BarChart3],
  [config.routes.gallery, 'Gallery', Image]
];

const systemNavItems = [
  [config.routes.admin, 'Admin', Settings],
  [config.routes.login, 'Login', LogIn]
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
  const visibleSystemNavItems = showSystem ? systemNavItems : [[config.routes.login, 'Login', LogIn]];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <NavLink className="brand" to={config.routes.home} onClick={() => setMenuOpen(false)} aria-label="UPAY home">
          <span className="brand-mark">U</span>
          <span>
            <strong>UPAY</strong>
            <small>Education with dignity</small>
          </span>
        </NavLink>
        <div className="header-status" aria-label="Current account status">
          <span className="eyebrow">{isSignedIn ? role : 'Public visitor'}</span>
          {isSignedIn && (
            <button className="secondary-button header-signout" type="button" onClick={onSignOut}>
              Sign out
            </button>
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
          <div className="nav-group" data-open={openGroup === 'system'}>
            <button
              type="button"
              className="nav-group-trigger"
              aria-expanded={openGroup === 'system'}
              aria-controls="system-menu"
              onClick={() => setOpenGroup((current) => (current === 'system' ? null : 'system'))}
            >
              <Settings size={16} />
              System
            </button>
            <div id="system-menu" className="nav-group-menu compact">
              {visibleSystemNavItems.map(([to, label, Icon]) => (
                <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>
      <main className="page-shell" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
