import { statusFor } from '../utils/attendance.js';
import './StatusBadge.css';

export function StatusBadge({ value }) {
  return <span className={`status-badge ${statusFor(value)}`}>{value}%</span>;
}
