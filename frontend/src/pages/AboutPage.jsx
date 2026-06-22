import './AboutPage.css';

export function AboutPage() {
  return (
    <section className="section about-section">
      <div className="about-marquee" aria-hidden="true">
        <span>Reach and Teach</span>
        <span>Reach and Teach</span>
        <span>Reach and Teach</span>
      </div>
      <div className="container about-hero">
        <div>
          <span className="eyebrow">Our Narrative</span>
          <h2>A conviction that moved communities.</h2>
          <p>What began as a localized effort in Kumbhari has evolved into a volunteer-driven national movement. UPAY is dedicated to delivering dignified, accessible, and life-changing education to underprivileged children.</p>
        </div>
        <div className="about-orb" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
      <div className="container about-story-grid">
        <div className="about-timeline-card">
          <span>12 May 2010</span>
          <h3>Inception</h3>
          <p>Overcoming structural challenges, our first center was established, laying the foundation for a sustainable grassroots movement.</p>
        </div>
        <div className="about-timeline-card accent">
          <span>19 September 2011</span>
          <h3>NGO Integration</h3>
          <p>Expanding volunteer participation enabled formal NGO registration, scaling our reach to support children through structural care.</p>
        </div>
        <div className="about-vision-card">
          <h3>Our Vision</h3>
          <p>Every child deserves an environment of dignity, an uninterrupted childhood, and an equal opportunity to thrive.</p>
        </div>
        <div className="about-vision-card dark">
          <h3>Our Mission</h3>
          <p>To educate and empower children in vulnerable regions by establishing resilient, community-led support ecosystems.</p>
        </div>
      </div>
    </section>
  );
}
