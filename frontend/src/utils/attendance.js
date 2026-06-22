export function percent(student) {
  const attended = student.attended ?? student.attendanceStats?.attended ?? 0;
  const conducted = student.conducted ?? student.attendanceStats?.conducted ?? 0;
  return Math.round((attended / Math.max(conducted, 1)) * 100);
}

export function statusFor(value) {
  if (value > 50) return 'good';
  if (value >= 40) return 'watch';
  return 'risk';
}
