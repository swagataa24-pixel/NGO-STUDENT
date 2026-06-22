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
          <span className="eyebrow">About UPAY</span>
          <h2>A promise that kept moving.</h2>
          <p>From Kumbhari near Nagpur to a volunteer-led education movement, UPAY exists to make learning feel reachable, dignified, and alive.</p>
        </div>
        <div className="about-orb" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>
      <div className="container about-story-grid">
        <div className="about-timeline-card">
          <span>12 May 2010</span>
          <h3>First learning center</h3>
          <p>Community resistance turned into support, and a small center became the start of something much larger.</p>
        </div>
        <div className="about-timeline-card accent">
          <span>19 September 2011</span>
          <h3>Registered NGO</h3>
          <p>The work grew into a formal volunteer network reaching children through education and care.</p>
        </div>
        <div className="about-vision-card">
          <h3>Vision</h3>
          <p>Every child deserves dignity, childhood, and a fair chance to grow.</p>
        </div>
        <div className="about-vision-card dark">
          <h3>Mission</h3>
          <p>Enable, educate, and empower children through a sustainable support ecosystem.</p>
        </div>
      </div>
    </section>
  );
}
