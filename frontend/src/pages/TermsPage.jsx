import { config } from '../config.js';

export function TermsPage() {
  return (
    <section className="section">
      <div className="container page-hero legal-page">
        <span className="eyebrow">Personal-use terms</span>
        <h1>{config.appName} workspace terms</h1>
        <p>This tool is for personal classroom administration by approved users. Signing in does not automatically grant access to student or attendance records.</p>

        <h2>Permitted use</h2>
        <p>Use the workspace to manage assigned classes, take attendance, maintain relevant student notes, store appropriate activity records, and prepare teaching reports.</p>

        <h2>Responsible data handling</h2>
        <p>Student photographs, guardian details, attendance, and progress information can be sensitive. Collect the minimum needed, use it only for legitimate teaching work, and follow the rules that apply to your classroom or institution.</p>

        <h2>Account security</h2>
        <p>Do not share accounts. Sign out on shared devices and report unexpected access to the workspace owner. Accounts may be blocked or removed to protect stored information.</p>

        <h2>No institutional representation</h2>
        <p>{config.appName} is an independent personal tool. It does not claim to represent a school, government body, school board, or public education authority.</p>
      </div>
    </section>
  );
}
