import { httpError } from './httpError.js';

export const allowedUserRoles = ['Admin', 'Teacher', 'Volunteer', 'Viewer'];

export function assertAllowedRole(role) {
  if (!allowedUserRoles.includes(role)) {
    throw httpError(400, `Role must be one of: ${allowedUserRoles.join(', ')}.`);
  }
}

export function parseMonthYear(query = {}) {
  const now = new Date();
  const month = Number(query.month || now.getMonth() + 1);
  const year = Number(query.year || now.getFullYear());

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw httpError(400, 'Month must be a number between 1 and 12.');
  }

  if (!Number.isInteger(year) || year < 2000) {
    throw httpError(400, 'Year must be a valid four-digit number.');
  }

  return { month, year };
}

export function asNonEmptyString(value, message) {
  if (typeof value !== 'string' || !value.trim()) {
    throw httpError(400, message);
  }

  return value.trim();
}
