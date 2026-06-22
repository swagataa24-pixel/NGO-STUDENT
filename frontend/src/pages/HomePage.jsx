import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarCheck, Camera, GraduationCap, Sparkles, Users } from 'lucide-react';
import { Metric } from '../components/Metric.jsx';
import { config } from '../config.js';

export function HomePage({ stats }) {
  const workflows = [
    [CalendarCheck, 'Daily attendance', 'Move through each class quickly and save present or absent marks with one clear action.', config.routes.attendance],
    [GraduationCap, 'Student records', 'Keep learner profiles, guardian details, notes, and attendance patterns in one place.', config.routes.students],
    [Camera, 'Photo proof', 'Attach activity evidence with center, date, and report context for future review.', config.routes.gallery],
    [BarChart3, 'Monthly reports', 'Generate clean PDF summaries for classes, volunteers, photos, and intervention alerts.', config.routes.reports]
  ];

  return (
    <>
      <section className="section hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Reach and Teach since 2010</span>
            <h1>Every child deserves childhood, education, and a fair chance to grow.</h1>
            <p>
              UPAY combines its public story and internal operations into one clear platform for attendance,
              progress tracking, photo proof, volunteers, and monthly reporting.
            </p>
            <div className="button-row">
              <Link className="primary-button" to={config.routes.attendance}>
                <CalendarCheck size={18} /> Start attendance
              </Link>
              <Link className="secondary-button" to={config.routes.about}>
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
          <h2>A calmer daily workspace for teachers, volunteers, and admins.</h2>
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
            <h2>Every note, attendance mark, photo, and report connects back to a child’s learning journey.</h2>
          </div>
          <Link className="secondary-button" to={config.routes.volunteers}>
            <Users size={18} /> View volunteers
          </Link>
        </div>
      </section>
    </>
  );
}
