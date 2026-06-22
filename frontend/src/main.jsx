import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Layout } from './components/Layout.jsx';
import { config } from './config.js';
import { apiRequest } from './utils/api.js';
import { percent } from './utils/attendance.js';
import './styles.css';

const HomePage = lazy(() => import('./pages/HomePage.jsx').then((module) => ({ default: module.HomePage })));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx').then((module) => ({ default: module.AboutPage })));
const ProgramsPage = lazy(() => import('./pages/ProgramsPage.jsx').then((module) => ({ default: module.ProgramsPage })));
const StudentsPage = lazy(() => import('./pages/StudentsPage.jsx').then((module) => ({ default: module.StudentsPage })));
const AttendancePage = lazy(() => import('./pages/AttendancePage.jsx').then((module) => ({ default: module.AttendancePage })));
const VolunteersPage = lazy(() => import('./pages/VolunteersPage.jsx').then((module) => ({ default: module.VolunteersPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx').then((module) => ({ default: module.ReportsPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage.jsx').then((module) => ({ default: module.GalleryPage })));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx').then((module) => ({ default: module.ContactPage })));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx').then((module) => ({ default: module.AdminPage })));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((module) => ({ default: module.LoginPage })));

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

function App() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [dataStatus, setDataStatus] = useState({ loading: true, error: '' });

  useEffect(() => {
    const storedUser = window.localStorage.getItem('upay.activeUser');
    if (storedUser) {
      try {
        setActiveUser(JSON.parse(storedUser));
      } catch {
        window.localStorage.removeItem('upay.activeUser');
      }
    }
  }, []);

  useEffect(() => {
    if (activeUser) {
      window.localStorage.setItem('upay.activeUser', JSON.stringify(activeUser));
    } else {
      window.localStorage.removeItem('upay.activeUser');
    }
  }, [activeUser]);

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

  const stats = useMemo(() => {
    const activeStudents = students.filter((student) => student.activeStatus !== false && student.active !== false);
    const average =
      activeStudents.reduce((sum, student) => sum + percent(student), 0) / Math.max(activeStudents.length, 1);

    return {
      students: activeStudents.length,
      centers: new Set(activeStudents.map((student) => student.centerId)).size,
      volunteers: volunteers.length,
      reports: 12,
      average: Math.round(average)
    };
  }, [students]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<Layout activeUser={activeUser} onSignOut={() => setActiveUser(null)} />}>
            <Route index element={<HomePage stats={stats} />} />
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
                  <AttendancePage students={students} setStudents={setStudents} classes={classes} />
                </AccessRoute>
              }
            />
            <Route
              path={config.routes.volunteers.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin', 'Teacher', 'Volunteer']}>
                  <VolunteersPage volunteers={volunteers} />
                </AccessRoute>
              }
            />
            <Route
              path={config.routes.reports.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin', 'Teacher']}>
                  <ReportsPage students={students} photos={photos} volunteers={volunteers} />
                </AccessRoute>
              }
            />
            <Route path={config.routes.gallery.replace(/^\//, '')} element={<GalleryPage photos={photos} setPhotos={setPhotos} />} />
            <Route path={config.routes.contact.replace(/^\//, '')} element={<ContactPage />} />
            <Route
              path={config.routes.admin.replace(/^\//, '')}
              element={
                <AccessRoute activeUser={activeUser} allowedRoles={['Admin']}>
                  <AdminPage students={students} photos={photos} activeUser={activeUser} />
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
