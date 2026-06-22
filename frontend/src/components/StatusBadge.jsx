import { statusFor } from '../utils/attendance.js';

export function StatusBadge({ value }) {
  return <span className={`status-badge ${statusFor(value)}`}>{value}%</span>;
}
