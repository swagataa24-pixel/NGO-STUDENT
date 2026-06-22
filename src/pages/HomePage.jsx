import { Link } from 'react-router-dom';

import { BarChart3, BookOpen, CalendarCheck, Camera, GraduationCap, Sparkles, Users } from 'lucide-react';
import { Metric } from '../components/Metric.jsx';

export function HomePage({ stats }) {
  const workflows = [
    [CalendarCheck, 'Daily attendance', 'Swipe through active students and update session totals instantly.', '/attendance'],
    [GraduationCap, 'Student records', 'Manage profiles, guardians, progress notes, and attendance risk.', '/students'],
    [Camera, 'Photo proof', 'Attach activity evidence with date, center, and report context.', '/gallery'],
    [BarChart3, 'Monthly reports', 'Download formal PDF reports with separate operational tables.', '/reports']
  ];

  return (
    <>
      <section className="section hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Reach and Teach since 2010</span>
            <h1>Every child deserves childhood, education, and a fair chance to grow.</h1>
            <p>
              UPAY brings the public story and internal operations into one thoughtful platform for attendance,
              progress, photo proof, volunteers, and monthly reporting.
            </p>
            <div className="button-row">
              <Link className="primary-button" to="/attendance">
                <CalendarCheck size={18} /> Start attendance
              </Link>
              <Link className="secondary-button" to="/about">
                <BookOpen size={18} /> Read the story
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-label="Children learning together">
            <img
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
              alt="Children studying in a classroom"
            />
            <div className="floating-panel">
              <Sparkles size={20} />
              <strong>{stats.average}%</strong>
              <span>average attendance</span>
            </div>
          </div>
        </div>
        <div className="container impact-strip">
          <Metric value={`${stats.students}+`} label="active students" />
          <Metric value={stats.centers} label="centers tracked" />
          <Metric value={stats.volunteers} label="volunteers" />
          <Metric value={stats.reports} label="monthly reports" />
        </div>
      </section>

      <section className="section compact-section">
        <div className="container section-heading">
          <span className="eyebrow">Operational flow</span>
          <h2>A calmer daily workspace for teachers and admins.</h2>
        </div>
        <div className="container workflow-grid">
          {workflows.map(([Icon, title, text, to]) => (
            <Link className="workflow-card" to={to} key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section tinted compact-section">
        <div className="container mission-band">
          <div>
            <span className="eyebrow">Why this matters</span>
            <h2>Every note, attendance mark, photo, and report connects back to one child.</h2>
          </div>
          <Link className="secondary-button" to="/volunteers">
            <Users size={18} /> View volunteers
          </Link>
        </div>
      </section>
    </>
  );
}
