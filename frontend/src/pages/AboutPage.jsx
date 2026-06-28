import { config } from '../config.js';
import './AboutPage.css';

export function AboutPage() {
  return (
    <section className="section about-section">
      <div className="about-marquee" aria-hidden="true">
        <span>Mark</span>
        <span>Manage</span>
        <span>Review</span>
      </div>
      <div className="container about-hero">
        <div>
          <span className="eyebrow">About the workspace</span>
          <h2>A personal tool shaped around a teacher's day.</h2>
          <p>{config.appName} keeps attendance, classes, student records, progress notes, activity photos, and reports in one private workspace. It is designed for personal classroom administration rather than public registration or organizational use.</p>
        </div>
        <div className="about-orb" aria-hidden="true"><span /><span /></div>
      </div>
      <div className="container about-story-grid">
        <div className="about-timeline-card">
          <span>Before class</span>
          <h3>Prepare</h3>
          <p>Create classes, organize student lists, and keep the information needed for the next session ready.</p>
        </div>
        <div className="about-timeline-card accent">
          <span>During class</span>
          <h3>Record</h3>
          <p>Open the correct class, mark attendance, and attach an optional class photo without switching between registers.</p>
        </div>
        <div className="about-vision-card">
          <h3>After class</h3>
          <p>Add progress notes, review attendance patterns, and follow up with students who need attention.</p>
        </div>
        <div className="about-vision-card dark">
          <h3>At month end</h3>
          <p>Generate a clean summary or PDF from the information already recorded during normal teaching work.</p>
        </div>
      </div>
    </section>
  );
}
