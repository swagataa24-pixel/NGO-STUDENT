# UPAY NGO Deployment Guide

## Deployment Model

The project is deployed as two separate apps:

1. Backend API on Render or a similar Node host.
2. Frontend static build on Vercel or a similar static host.

## Backend Deployment

Use the root `render.yaml` file, which points Render to `backend`.

### Required Backend Env Vars

- `MONGO_URI`
- `CLIENT_URL`
- `JWT_SECRET`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAILS`

### Backend Build/Start Flow

```bash
cd backend
npm install
npm run start
```

## Frontend Deployment

Use the root `vercel.json` file, which builds from `frontend`.

### Required Frontend Env Vars

- `VITE_API_BASE_URL`
- `VITE_APP_NAME`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_CLOUDINARY_FOLDER`
- `VITE_DEFAULT_CENTER_ID`

### Frontend Build Flow

```bash
cd frontend
npm install
npm run build
```

## Production Notes

- Keep frontend and backend env vars separate.
- Set the frontend API URL to the deployed backend endpoint.
- Do not expose backend secrets to the browser.
- Keep MongoDB Atlas IP access restricted to the deployed server network.
