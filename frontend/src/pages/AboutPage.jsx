export function AboutPage() {
  return (
    <section className="section">
      <div className="container page-hero">
        <span className="eyebrow">About Us</span>
        <h2>A movement that began with one center, one village, and a determined promise.</h2>
        <p>
          UPAY started in Kumbhari near Mauda, about 40 km from Nagpur, when Varun Shrivastava and his friends
          began looking for a practical way to bring children back into learning.
        </p>
      </div>
      <div className="container story-grid">
        <div className="story-card">
          <span>12 May 2010</span>
          <h3>First Reach and Teach center</h3>
          <p>
            Early resistance gave way to community support when a local Anganwadi worker encouraged the effort.
            That first center became the foundation for UPAY&apos;s education work.
          </p>
        </div>
        <div className="story-card accent">
          <span>19 September 2011</span>
          <h3>Registered NGO</h3>
          <p>
            UPAY was formally registered under the Society Registration Act and grew into a volunteer-led
            network across North and South India.
          </p>
        </div>
        <div className="quote-card">
          <h3>Vision</h3>
          <p>A future where every child will have a dignified childhood and equal opportunity to live, learn, and grow.</p>
        </div>
        <div className="quote-card">
          <h3>Mission</h3>
          <p>To develop a sustainable ecosystem for the underprivileged community in India by enabling, educating, and empowering its children.</p>
        </div>
      </div>
    </section>
  );
}
