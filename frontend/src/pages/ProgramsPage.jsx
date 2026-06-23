import { ArrowUpRight, BarChart3, BookOpen, Camera, ClipboardList } from 'lucide-react';
import './ProgramsPage.css';

export function ProgramsPage() {
  const programs = [
    [BookOpen, 'Reach and Teach', 'Dignified academic support and elementary education for children transitioning back to formal schooling.'],
    [ClipboardList, 'Progress Tracking', 'Granular tracking of student literacy, cognitive development, behavior, and social integration milestones.'],
    [Camera, 'Activity Verification', 'Securing on-site program updates with verified photo uploads, center data, and date metadata.'],
    [BarChart3, 'Operational Review', 'Aggregating attendance rates, volunteer hours, and center logs into audited monthly review reports.']
  ];

  return (
    <section className="section tinted programs-section">
      <div className="container programs-showcase">
        <div className="programs-copy">
          <span className="eyebrow">Initiatives</span>
          <h2>Where teaching, proof, and progress move together.</h2>
          <p>
            UPAY's core programs connect daily classroom support with clean records,
            verified activity proof, and monthly operational clarity.
          </p>
          <div className="programs-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="programs-flow" aria-label="Program initiatives">
          {programs.map(([Icon, title, text], index) => (
            <article className="program-flow-item" key={title} style={{ '--item-index': index }}>
              <div className="program-flow-icon">
                <Icon size={22} />
              </div>
              <div>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowUpRight className="program-flow-arrow" size={18} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
