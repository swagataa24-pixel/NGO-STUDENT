import { BarChart3, BookOpen, Camera, ClipboardList } from 'lucide-react';

export function ProgramsPage() {
  const programs = [
    [BookOpen, 'Reach and Teach', 'Daily learning support for children who need a bridge back into school routines.'],
    [ClipboardList, 'Progress tracking', 'Reading, writing, behavior, confidence, and intervention notes are kept with each student.'],
    [Camera, 'Activity proof', 'Teachers can upload activity photos with center, date, and caption metadata.'],
    [BarChart3, 'Monthly review', 'Attendance, volunteers, progress notes, and photos combine into summary reports.']
  ];

  return (
    <section className="section tinted">
      <div className="container page-hero">
        <span className="eyebrow">Programs</span>
        <h2>Public story and internal operations work together.</h2>
        <p>Each program is represented as a practical workflow so field activity becomes structured evidence.</p>
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
