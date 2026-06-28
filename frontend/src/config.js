const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const authBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

export const config = {
  apiBaseUrl,
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL || authBaseUrl,
  appName: import.meta.env.VITE_APP_NAME || 'upayinfoPVT',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  cloudFolder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'upayinfopvt',
  defaultCenter: import.meta.env.VITE_DEFAULT_CENTER_ID || 'personal-workspace',
  routes: {
    home: import.meta.env.VITE_ROUTE_HOME || '/',
    about: import.meta.env.VITE_ROUTE_ABOUT || '/about',
    programs: import.meta.env.VITE_ROUTE_PROGRAMS || '/features',
    students: import.meta.env.VITE_ROUTE_STUDENTS || '/students',
    attendance: import.meta.env.VITE_ROUTE_ATTENDANCE || '/attendance',
    volunteers: import.meta.env.VITE_ROUTE_VOLUNTEERS || '/teachers',
    reports: import.meta.env.VITE_ROUTE_REPORTS || '/reports',
    gallery: import.meta.env.VITE_ROUTE_GALLERY || '/gallery',
    admin: import.meta.env.VITE_ROUTE_ADMIN || '/admin',
    login: import.meta.env.VITE_ROUTE_LOGIN || '/login',
    privacy: import.meta.env.VITE_ROUTE_PRIVACY || '/privacy',
    terms: import.meta.env.VITE_ROUTE_TERMS || '/terms'
  },
  apiRoutes: {
    students: import.meta.env.VITE_API_STUDENTS_PATH || '/students',
    classes: import.meta.env.VITE_API_CLASSES_PATH || '/classes',
    photos: import.meta.env.VITE_API_PHOTOS_PATH || '/photos',
    volunteers: import.meta.env.VITE_API_VOLUNTEERS_PATH || '/volunteers',
    users: import.meta.env.VITE_API_USERS_PATH || '/users',
    attendance: import.meta.env.VITE_API_ATTENDANCE_PATH || '/attendance',
    attendanceSession: import.meta.env.VITE_API_ATTENDANCE_SESSION_PATH || '/attendance/session',
    authGoogle: import.meta.env.VITE_API_AUTH_GOOGLE_PATH || '/auth/google',
    authExchange: import.meta.env.VITE_API_AUTH_EXCHANGE_PATH || '/auth/exchange',
    authMe: import.meta.env.VITE_API_AUTH_ME_PATH || '/auth/me'
  }
};
