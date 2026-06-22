import { Home, Mail, Phone } from 'lucide-react';

export function ContactPage() {
  return (
    <section className="section tinted">
      <div className="container contact-grid">
        <div className="page-hero">
          <span className="eyebrow">Contact</span>
          <h2>Coordinate centers, volunteers, donors, and partners.</h2>
          <p>Use the contact paths below for program support, volunteering, uploads, and monthly reports.</p>
        </div>
        <div className="contact-cards">
          <article className="soft-card"><Phone className="card-icon" /><h3>Phone</h3><p>+91 98765 43210</p></article>
          <article className="soft-card"><Mail className="card-icon" /><h3>Email</h3><p>coordination@upayngo.org</p></article>
          <article className="soft-card"><Home className="card-icon" /><h3>Centers</h3><p>Nagpur, Kumbhari, Mauda, and partner learning locations.</p></article>
        </div>
      </div>
    </section>
  );
}
