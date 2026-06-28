import { ArrowUpRight, BarChart3, Camera, ClipboardList, GraduationCap } from 'lucide-react';
import { config } from '../config.js';
import './ProgramsPage.css';

export function ProgramsPage() {
  const features = [
    [ClipboardList, 'Fast attendance', 'Create dated sessions, mark present or absent, prevent duplicate entries, and retain a useful attendance history.'],
    [GraduationCap, 'Class and student management', 'Group students into classes, maintain essential details, and keep teacher access scoped to assigned classes.'],
    [Camera, 'Class activity records', 'Upload validated class photos and connect them with the relevant class, activity, and session date.'],
    [BarChart3, 'Progress and reporting', 'Review attendance totals, add progress notes, identify patterns, and export monthly or yearly PDF summaries.']
  ];

  return (
    <section className="section tinted programs-section">
      <div className="container programs-showcase">
        <div className="programs-copy">
          <span className="eyebrow">Features</span>
          <h2>From the attendance register to the monthly summary.</h2>
          <p>{config.appName} connects the routine pieces of classroom administration so information is entered once and remains useful.</p>
          <div className="programs-orbit" aria-hidden="true"><span /><span /><span /></div>
        </div>
        <div className="programs-flow" aria-label="Workspace features">
          {features.map(([Icon, title, text], index) => (
            <article className="program-flow-item" key={title} style={{ '--item-index': index }}>
              <div className="program-flow-icon"><Icon size={22} /></div>
              <div><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></div>
              <ArrowUpRight className="program-flow-arrow" size={18} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
