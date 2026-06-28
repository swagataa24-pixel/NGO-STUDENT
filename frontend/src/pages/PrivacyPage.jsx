import { config } from '../config.js';

export function PrivacyPage() {
  return (
    <section className="section">
      <div className="container page-hero legal-page">
        <span className="eyebrow">Privacy notice</span>
        <h1>How this personal workspace handles information</h1>
        <p>{config.appName} is a private classroom-management tool. It is not a public signup directory or institution-operated service.</p>

        <h2>Account information</h2>
        <p>Google provides a verified name, email address, profile image, and account identifier during sign-in. The workspace never receives or stores your Google password. The workspace owner controls access roles.</p>

        <h2>Classroom information</h2>
        <p>Approved users may work with class lists, student and guardian details, attendance, progress notes, teacher records, reports, and optional activity photos. Only information genuinely needed for personal teaching work should be entered.</p>

        <h2>Storage and protection</h2>
        <p>Application records are stored in the configured private database and approved image storage. Access is role-restricted, sensitive identity fields are encrypted where implemented, and sign-in callback codes are short-lived and single-use.</p>

        <h2>Your responsibility</h2>
        <p>Do not enter classroom information without permission. Remove records that are no longer needed, avoid unnecessary exports, and keep your Google account secure. {config.supportEmail && <>Questions can be sent to <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>.</>}</p>
      </div>
    </section>
  );
}
