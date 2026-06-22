import React, { Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Layout } from './components/Layout.jsx';
import { config } from './config.js';
import { apiRequest } from './utils/api.js';
import './styles.css';

const CHUNK_RELOAD_KEY = 'upay.chunkReloaded';

function lazyRoute(importPage, exportName) {
  return lazy(() =>
    importPage()
      .then((module) => {
        window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        return { default: module[exportName] };
      })
      .catch((error) => {
        const isChunkError = /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk/i.test(
          error?.message || ''
        );

        if (isChunkError && window.sessionStorage.getItem(CHUNK_RELOAD_KEY) !== 'true') {
          window.sessionStorage.setItem(CHUNK_RELOAD_KEY, 'true');
          window.location.reload();
        }

        throw error;
      })
  );
}

const HomePage = lazyRoute(() => import('./pages/HomePage.jsx'), 'HomePage');
const AboutPage = lazyRoute(() => import('./pages/AboutPage.jsx'), 'AboutPage');
const ProgramsPage = lazyRoute(() => import('./pages/ProgramsPage.jsx'), 'ProgramsPage');
const StudentsPage = lazyRoute(() => import('./pages/StudentsPage.jsx'), 'StudentsPage');
const AttendancePage = lazyRoute(() => import('./pages/AttendancePage.jsx'), 'AttendancePage');
const VolunteersPage = lazyRoute(() => import('./pages/VolunteersPage.jsx'), 'VolunteersPage');
const ReportsPage = lazyRoute(() => import('./pages/ReportsPage.jsx'), 'ReportsPage');
const GalleryPage = lazyRoute(() => import('./pages/GalleryPage.jsx'), 'GalleryPage');
const AdminPage = lazyRoute(() => import('./pages/AdminPage.jsx'), 'AdminPage');
const LoginPage = lazyRoute(() => import('./pages/LoginPage.jsx'), 'LoginPage');

function RouteLoader() {
  return (
    <section className="section">
      <div className="container page-hero">
        <span className="eyebrow">Loading</span>
        <h2>Preparing the next section.</h2>
        <p>The page is being loaded with the claymorphism layout and current data.</p>
      </div>
    </section>
  );
}

function NoAccess({ role, message = 'You do not have access to this section.' }) {
  return (
    <section className="section">
      <div className="container page-hero">
        <span className="eyebrow">Access restricted</span>
        <h2>{message}</h2>
        <p>
          Current user role: <strong>{role || 'public visitor'}</strong>. Sign in with a permitted role or return to the public pages.
        </p>
        <div className="button-row">
          <NavigateBackButton />
        </div>
      </div>
    </section>
  );
}

function NavigateBackButton() {
  return (
    <a className="primary-button" href="/">
      Go home
    </a>
  );
}

function hasRoleAccess(role, allowedRoles) {
  if (!allowedRoles || !allowedRoles.length) return true;
  return Boolean(role && allowedRoles.includes(role));
}

function AccessRoute({ activeUser, allowedRoles, children }) {
  const location = useLocation();

  if (!activeUser) {
    return <Navigate to={config.routes.login} replace state={{ from: location.pathname }} />;
  }

  if (!hasRoleAccess(activeUser.role, allowedRoles)) {
    return <NoAccess role={activeUser.role} />;
  }

  return children;
}

function decodeAuthUser(encodedUser) {
  const normalized = encodedUser.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(window.atob(padded));
}

function readStoredSession() {
  try {
    const token = window.localStorage.getItem('upay.authToken');
    const storedUser = window.localStorage.getItem('upay.activeUser');
    if (token && storedUser) {
      return JSON.parse(storedUser);
    }
    if (!token && storedUser) {
      window.localStorage.removeItem('upay.activeUser');
    }
  } catch {
    window.localStorage.removeItem('upay.authToken');
    window.localStorage.removeItem('upay.activeUser');
  }
  return null;
}

function clearStoredSession() {
  window.localStorage.removeItem('upay.authToken');
  window.localStorage.removeItem('upay.activeUser');
}

function App() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeUser, setActiveUser] = useState(readStoredSession);
  const [dataStatus, setDataStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const encodedUser = params.get('user');

    if (token && encodedUser) {
      try {
        const user = decodeAuthUser(encodedUser);
        window.localStorage.setItem('upay.authToken', token);
        window.localStorage.setItem('upay.activeUser', JSON.stringify(user));
        setActiveUser(user);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {
        clearStoredSession();
        setActiveUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (activeUser) {
      window.localStorage.setItem('upay.activeUser', JSON.stringify(activeUser));
    }
  }, [activeUser]);

  const handleSignOut = () => {
    clearStoredSession();
    setActiveUser(null);
  };

  const refreshData = async () => {
    setDataStatus({ loading: true, error: '' });
    try {
      const [studentData, classData, photoData, volunteerData] = await Promise.all([
        apiRequest(config.apiRoutes.students),
        apiRequest(config.apiRoutes.classes),
        apiRequest(config.apiRoutes.photos).catch(() => []),
        apiRequest(config.apiRoutes.volunteers).catch(() => [])
      ]);
      setStudents(studentData);
      setClasses(classData);
      setPhotos(photoData);
      setVolunteers(volunteerData);
      setDataStatus({ loading: false, error: '' });
    } catch (error) {
      setStudents([]);
      setClasses([]);
      setPhotos([]);
      setVolunteers([]);
      setDataStatus({ loading: false, error: `${error.message} Start the API server and configure MongoDB.` });
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<Layout activeUser={activeUser} onSignOut={handleSignOut} />}>
            <Route index element={<HomePage />} />
            <Route path={config.routes.about.replace(/^\//, '')} element={<AboutPage />} />
            <Route path={config.routes.programs.replace(/^\//, '')} element={<ProgramsPage />} />
            <Route
              path={config.routes.students.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin', 'Teacher']}>
                  <StudentsPage
                    students={students}
                    setStudents={setStudents}
                    classes={classes}
                    setClasses={setClasses}
                    volunteers={volunteers}
                    dataStatus={dataStatus}
                    refreshData={refreshData}
                  />
                </AccessRoute>
              }
            />
            <Route
              path={`${config.routes.students.replace(/^\//, '')}/:classId`}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin', 'Teacher']}>
                  <StudentsPage
                    students={students}
                    setStudents={setStudents}
                    classes={classes}
                    setClasses={setClasses}
                    volunteers={volunteers}
                    dataStatus={dataStatus}
                    refreshData={refreshData}
                  />
                </AccessRoute>
              }
            />
            <Route
              path={config.routes.attendance.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin', 'Teacher']}>
                  <AttendancePage students={students} setStudents={setStudents} classes={classes} setPhotos={setPhotos} />
                </AccessRoute>
              }
            />
            <Route
              path={config.routes.volunteers.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin']}>
                  <VolunteersPage
                    volunteers={volunteers}
                    setVolunteers={setVolunteers}
                    students={students}
                    classes={classes}
                    dataStatus={dataStatus}
                    refreshData={refreshData}
                  />
                </AccessRoute>
              }
            />
            <Route
              path={config.routes.reports.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin', 'Teacher']}>
                  <ReportsPage students={students} photos={photos} volunteers={volunteers} classes={classes} />
                </AccessRoute>
              }
            />
            <Route path={config.routes.gallery.replace(/^\//, '')} element={<GalleryPage photos={photos} setPhotos={setPhotos} />} />
            <Route
              path={config.routes.admin.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin']}>
                  <AdminPage
                    students={students}
                    classes={classes}
                    volunteers={volunteers}
                    photos={photos}
                    activeUser={activeUser}
                    dataStatus={dataStatus}
                    refreshData={refreshData}
                  />
                </AccessRoute>
              }
            />
            <Route path={config.routes.login.replace(/^\//, '')} element={<LoginPage activeUser={activeUser} setActiveUser={setActiveUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
