import cors from 'cors';
import dns from 'node:dns';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { attendanceRouter } from './routes/attendanceRoutes.js';
import { classRouter } from './routes/classRoutes.js';
import { photoRouter } from './routes/photoRoutes.js';
import { progressRouter } from './routes/progressRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { studentRouter } from './routes/studentRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { volunteerRouter } from './routes/volunteerRoutes.js';

dotenv.config();
dns.setServers((process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1').split(',').map((server) => server.trim()));
mongoose.set('bufferCommands', false);

const app = express();
const port = process.env.PORT || 5000;
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

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin blocked by server configuration.'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    app: 'UPAY NGO API',
    message: 'API server is running. Open the frontend at http://localhost:5173 or check API health at /api/health.',
    frontend: process.env.CLIENT_URL || 'http://localhost:5173',
    health: '/api/health'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'UPAY NGO API',
    readiness: {
      mongo: mongoReady,
      mongoError,
      googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
      jwt: Boolean(process.env.JWT_SECRET)
    }
  });
});

function requireMongo(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message: 'MongoDB is not connected. Check MONGO_URI, Atlas network access, database user credentials, and DNS/network connectivity.',
    mongoReady: false,
    mongoError
  });
}

app.use(apiRoutes.auth, authRouter);
app.use(apiRoutes.users, userRouter);
app.use(apiRoutes.classes, requireMongo, classRouter);
app.use(apiRoutes.students, requireMongo, studentRouter);
app.use(apiRoutes.attendance, requireMongo, attendanceRouter);
app.use(apiRoutes.progress, requireMongo, progressRouter);
app.use(apiRoutes.volunteers, requireMongo, volunteerRouter);
app.use(apiRoutes.photos, requireMongo, photoRouter);
app.use(apiRoutes.reports, requireMongo, reportRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorHandler);

async function start() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      mongoReady = true;
      console.log('MongoDB connected');
    } catch (error) {
      mongoReady = false;
      mongoError = error.message;
      console.log(`MongoDB connection failed: ${error.message}`);
    }
  } else {
    mongoError = 'MONGO_URI missing';
    console.log('MONGO_URI missing; API is running with route skeletons only.');
  }
  app.listen(port, () => console.log(`UPAY API listening on http://localhost:${port}`));
}

start().catch((error) => {
  console.error(error);
  app.listen(port, () => console.log(`UPAY API listening on http://localhost:${port}`));
});
