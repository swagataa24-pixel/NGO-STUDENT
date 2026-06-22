import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarCheck, Camera, GraduationCap, Sparkles, Users } from 'lucide-react';
import { config } from '../config.js';

const marqueeWords = ['Education', 'Dignity', 'Care', 'Access', 'Mentorship', 'Trust'];

export function HomePage() {
  const workflows = [
    [CalendarCheck, 'Daily attendance', 'Move through each class quickly and save present or absent marks with one clear action.', config.routes.attendance],
    [GraduationCap, 'Student records', 'Keep learner profiles, guardian details, notes, and attendance patterns in one place.', config.routes.students],
    [Camera, 'Photo proof', 'Attach activity evidence with center, date, and report context for future review.', config.routes.gallery],
    [BarChart3, 'Monthly reports', 'Generate clean PDF summaries for classes, volunteers, photos, and intervention alerts.', config.routes.reports]
  ];

  return (
    <>
      <section className="section hero-section">
        <div className="hero-marquee" aria-hidden="true">
          <div>
            {[...marqueeWords, ...marqueeWords].map((word, index) => (
              <span key={`${word}-${index}`}>{word}</span>
            ))}
          </div>
        </div>
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Reach and Teach since 2010</span>
            <h1>Childhood should feel possible.</h1>
            <p>UPAY brings learning, care, and opportunity closer to children who deserve a fair start.</p>
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
            <div className="hero-visual-glow" aria-hidden="true" />
            <div className="hero-kinetic-text" aria-hidden="true">
              <span>learn</span>
              <span>grow</span>
              <span>belong</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
              alt="Children studying in a classroom"
            />
            <div className="floating-panel">
              <Sparkles size={20} />
              <strong>Every day counts</strong>
              <span>learning with care</span>
            </div>
          </div>
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
