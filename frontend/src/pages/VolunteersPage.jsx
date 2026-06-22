import { Users } from 'lucide-react';
import './VolunteersPage.css';
import { EmptyState } from '../components/EmptyState.jsx';

export function VolunteersPage({ volunteers = [] }) {
  return (
    <section className="section">
      <div className="container page-hero">
        <span className="eyebrow">Collaborators</span>
        <h2>Volunteer profiles, assigned centers, and operational contributions.</h2>
      </div>
      <div className="container card-grid three">
        {volunteers.map((volunteer) => (
          <article className="soft-card" key={volunteer._id || volunteer.id || volunteer.name}>
            <Users className="card-icon" />
            <h3>{volunteer.name}</h3>
            <p>{volunteer.role} at {volunteer.center || volunteer.assignedCenter}</p>
            <div className="mini-stats">
              <span>{volunteer.availability}</span>
              <strong>{volunteer.hours || volunteer.activityLogs?.reduce((sum, item) => sum + (item.hours || 0), 0) || 0}h</strong>
            </div>
          </article>
        ))}
        {!volunteers.length && <EmptyState title="No volunteers found" text="Add volunteers through the API to show them here." />}
      </div>
    </section>
  );
}
