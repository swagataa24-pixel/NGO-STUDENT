import cors from 'cors';
import dns from 'node:dns';
import crypto from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import { envList, isProduction, primaryClientUrl, validateProductionEnvironment } from './config/env.js';
import { createOneTimeAuthCode } from './services/authService.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { attendanceRouter } from './routes/attendanceRoutes.js';
import { classRouter } from './routes/classRoutes.js';
import { photoRouter } from './routes/photoRoutes.js';
import { progressRouter } from './routes/progressRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { studentRouter } from './routes/studentRoutes.js';
import { passport } from './services/passportService.js';
import { userRouter } from './routes/userRoutes.js';
import { volunteerRouter } from './routes/volunteerRoutes.js';

function prepareKey(input) {
  if (!input) {
    throw new Error('Required environment variable missing');
  }
  const hash = crypto.createHash('sha512').update(input).digest('hex');
  return hash.slice(0, 64);
}

validateProductionEnvironment();
dns.setServers((process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map((server) => server.trim()));
mongoose.set('bufferCommands', false);

const app = express();
const port = process.env.PORT || 5000;
const frontendUrl = primaryClientUrl();
const allowedOrigins = envList('CLIENT_URL').length ? envList('CLIENT_URL') : ['http://localhost:5173'];
let mongoReady = false;
let mongoError = '';

const apiRoutes = {
  auth: process.env.API_ROUTE_AUTH || '/api/auth',
  users: process.env.API_ROUTE_USERS || '/api/users',
  classes: process.env.API_ROUTE_CLASSES || '/api/classes',
  students: process.env.API_ROUTE_STUDENTS || '/api/students',
  attendance: process.env.API_ROUTE_ATTENDANCE || '/api/attendance',
  progress: process.env.API_ROUTE_PROGRESS || '/api/progress',
  volunteers: process.env.API_ROUTE_VOLUNTEERS || '/api/volunteers',
  photos: process.env.API_ROUTE_PHOTOS || '/api/photos',
  reports: process.env.API_ROUTE_REPORTS || '/api/reports'
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' }
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin blocked by server configuration.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const sessionSecret = prepareKey(process.env.SESSION_SECRET);
const sessionOptions = {
  name: 'upayinfoPVT.oauth',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000
  }
};
if (process.env.MONGO_URI) {
  sessionOptions.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    ttl: 10 * 60,
    crypto: { secret: sessionSecret }
  });
}

app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

function frontendLoginUrl(params = {}) {
  const url = new URL(process.env.CLIENT_LOGIN_ROUTE || '/login', frontendUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function frontendLoginCodeUrl(code) {
  const url = new URL(process.env.CLIENT_LOGIN_ROUTE || '/login', frontendUrl);
  url.hash = new URLSearchParams({ code }).toString();
  return url.toString();
}

app.get('/', (_req, res) => {
  res.json({ app: 'upayinfoPVT API', message: 'API server is running.', frontend: frontendUrl, health: '/api/health' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: mongoReady,
    app: 'upayinfoPVT API',
    readiness: {
      mongo: mongoReady,
      ...(!isProduction && mongoError ? { mongoError } : {}),
      googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      securityConfig: Boolean(process.env.JWT_SECRET && process.env.SESSION_SECRET && process.env.FIELD_ENCRYPTION_KEY && process.env.HMAC_SECRET)
    }
  });
});

app.get(
  '/auth/google',
  authLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })
);

app.get(
  '/auth/google/callback',
  authLimiter,
  passport.authenticate('google', { failureRedirect: frontendLoginUrl({ error: 'google_auth_failed' }) }),
  async (req, res, next) => {
    try {
      const code = await createOneTimeAuthCode(req.user);
      const destination = frontendLoginCodeUrl(code);
      req.session.destroy((sessionError) => {
        if (sessionError) return next(sessionError);
        return res.redirect(destination);
      });
    } catch (error) {
      next(error);
    }
  }
);

function requireMongo(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ message: 'Service is temporarily unavailable.', mongoReady: false });
}

app.use(apiRoutes.auth, authLimiter, requireMongo, authRouter);
app.use(apiRoutes.users, requireMongo, userRouter);
app.use(apiRoutes.classes, requireMongo, classRouter);
app.use(apiRoutes.students, requireMongo, studentRouter);
app.use(apiRoutes.attendance, requireMongo, attendanceRouter);
app.use(apiRoutes.progress, requireMongo, progressRouter);
app.use(apiRoutes.volunteers, requireMongo, volunteerRouter);
app.use(apiRoutes.photos, requireMongo, photoRouter);
app.use(apiRoutes.reports, requireMongo, reportRouter);

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use(errorHandler);

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      mongoReady = true;
      console.log('MongoDB connected');
    } catch (error) {
      mongoError = error.message;
      console.error('MongoDB connection failed');
      if (isProduction) throw error;
    }
  } else {
    mongoError = 'MONGO_URI missing';
    console.warn('MONGO_URI missing; protected API routes are unavailable.');
  }

  app.listen(port, () => console.log(`upayinfoPVT API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
});
