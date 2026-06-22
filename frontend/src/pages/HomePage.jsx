import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarCheck, Camera, GraduationCap, Sparkles, Users } from 'lucide-react';
import { config } from '../config.js';
import './HomePage.css';

const marqueeWords = ['Education', 'Dignity', 'Care', 'Access', 'Mentorship', 'Trust'];

export function HomePage() {
  const workflows = [
    [CalendarCheck, 'Daily Attendance', 'Swiftly capture daily attendance and manage classroom sessions with one unified action.', config.routes.attendance],
    [GraduationCap, 'Student Directory', 'Maintain comprehensive student profiles, parent details, academic notes, and enrollment logs.', config.routes.students],
    [Camera, 'Photo Verification', 'Document center activities with secure image uploads to verify daily session compliance.', config.routes.gallery],
    [BarChart3, 'Audited Reports', 'Compile detailed monthly reports on classroom progress, volunteer hours, and support alerts.', config.routes.reports]
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
            <span className="eyebrow">Reach and Teach · Est. 2010</span>
            <h1>Restoring the promise of childhood.</h1>
            <p>UPAY brings structured learning, equal opportunity, and compassionate care to children in underserved communities, fostering a path toward dignity and success.</p>
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
          <span className="eyebrow">Operational Excellence</span>
          <h2>A unified workspace designed to empower educators, volunteers, and leaders.</h2>
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
            <span className="eyebrow">Our Collective Purpose</span>
            <h2>Every lesson taught, attendance recorded, and progress evaluated is a direct investment in a child’s future.</h2>
          </div>
        </div>
      </section>
    </>
  );
}
