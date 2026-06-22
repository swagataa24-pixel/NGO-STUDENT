import { BarChart3, BookOpen, Camera, ClipboardList } from 'lucide-react';
import './ProgramsPage.css';

export function ProgramsPage() {
  const programs = [
    [BookOpen, 'Reach and Teach', 'Dignified academic support and elementary education for children transitioning back to formal schooling.'],
    [ClipboardList, 'Progress Tracking', 'Granular tracking of student literacy, cognitive development, behavior, and social integration milestones.'],
    [Camera, 'Activity Verification', 'Securing on-site program updates with verified photo uploads, center data, and date metadata.'],
    [BarChart3, 'Operational Review', 'Aggregating attendance rates, volunteer hours, and center logs into audited monthly review reports.']
  ];

  return (
    <section className="section tinted">
      <div className="container page-hero">
        <span className="eyebrow">Initiatives</span>
        <h2>Bridging community advocacy and structural operations.</h2>
        <p>Our core initiatives are structured to turn daily education and volunteer activities into transparent, auditable progress records.</p>
      </div>
      <div className="container card-grid four">
        {programs.map(([Icon, title, text]) => (
          <article className="soft-card" key={title}>
            <Icon className="card-icon" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
