import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarCheck, Camera, GraduationCap, Sparkles } from 'lucide-react';
import { config } from '../config.js';
import './HomePage.css';

const marqueeWords = ['Attendance', 'Classes', 'Students', 'Notes', 'Reports', 'Photos'];

export function HomePage() {
  const workflows = [
    [CalendarCheck, 'Take Attendance', 'Create a class session, mark each student present or absent, and keep totals synchronized.', config.routes.attendance],
    [GraduationCap, 'Manage Students', 'Organize students by class and maintain the details a teacher needs during everyday work.', config.routes.students],
    [Camera, 'Attach Class Photos', 'Keep optional classroom evidence and activity photos connected to the correct date and class.', config.routes.gallery],
    [BarChart3, 'Review Reports', 'Turn attendance history, progress notes, and class activity into clear monthly summaries.', config.routes.reports]
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
            <span className="eyebrow">Private teacher workspace</span>
            <h1>Attendance that stays organized.</h1>
            <p>{config.appName} is a personal classroom-management tool for teachers who want one reliable place to take attendance, manage classes, review students, and prepare reports.</p>
            <div className="button-row">
              <Link className="primary-button" to={config.routes.attendance}>
                <CalendarCheck size={18} /> Start attendance
              </Link>
              <Link className="secondary-button" to={config.routes.programs}>
                <BookOpen size={18} /> Explore features
              </Link>
            </div>
          </div>
          <div className="hero-visual" aria-label="Teacher managing a classroom">
            <div className="hero-visual-glow" aria-hidden="true" />
            <div className="hero-kinetic-text" aria-hidden="true">
              <span>mark</span>
              <span>manage</span>
              <span>review</span>
            </div>
            <img
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80"
              alt="Teacher working with students in a classroom"
            />
            <div className="floating-panel">
              <Sparkles size={20} />
              <strong>Every class, recorded</strong>
              <span>simple daily workflow</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section compact-section">
        <div className="container section-heading">
          <span className="eyebrow">Focused workflow</span>
          <h2>The practical tools a teacher needs before, during, and after class.</h2>
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
            <span className="eyebrow">Built for personal use</span>
            <h2>Spend less time rebuilding registers and more time understanding what happened in each class.</h2>
          </div>
        </div>
      </section>
    </>
  );
}
