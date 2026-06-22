import { AlertCircle, Check } from 'lucide-react';
import './AdminPage.css';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Metric } from '../components/Metric.jsx';
import { config } from '../config.js';

export function AdminPage({ students, photos, activeUser }) {
  const readiness = [
    ['API base URL', Boolean(config.apiBaseUrl)],
    ['Google OAuth client', Boolean(config.googleClientId)],
    ['Cloudinary uploads', Boolean(config.cloudName && config.uploadPreset)],
    ['Default center', Boolean(config.defaultCenter)]
  ];

  return (
    <section className="section">
      <div className="container page-hero with-action">
        <span className="eyebrow">Console</span>
        <div>
          <h2>System infrastructure, integration status, and administrative logs.</h2>
          <p>Audit application status, environmental variables, database health, and role permissions.</p>
        </div>
      </div>
      <div className="container admin-grid">
        <div className="chart-card">
          <h3>Attendance trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { month: 'Feb', value: 44 },
              { month: 'Mar', value: 51 },
              { month: 'Apr', value: 58 },
              { month: 'May', value: 62 },
              { month: 'Jun', value: 67 }
            ]}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#97B3AE" fill="#D2E0D3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="readiness-card">
          <h3>Environment readiness</h3>
          {readiness.map(([label, ok]) => (
            <div className="readiness-row" key={label}>
              {ok ? <Check /> : <AlertCircle />}
              <span>{label}</span>
              <strong>{ok ? 'Ready' : 'Missing'}</strong>
            </div>
          ))}
          <p>Signed in as: {activeUser ? `${activeUser.name} (${activeUser.role})` : 'public visitor'}</p>
        </div>
        <Metric value={students.length} label="students in system" />
        <Metric value={photos.length} label="activity uploads" />
      </div>
    </section>
  );
}
