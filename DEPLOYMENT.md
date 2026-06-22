# UPAY NGO Deployment Guide

## Deployment Model

The project is deployed as two parts:

1. Backend API on Render or a similar Node host.
2. Frontend static build on Vercel or a similar static host.

## Backend Deployment

Use the root [render.yaml](render.yaml) file.

### Required backend env vars

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

### Backend build/start flow

```bash
npm install
npm run start --workspace backend
```

## Frontend Deployment

Use the root [vercel.json](vercel.json) file or set the same values in Vercel project settings.

### Required frontend env vars

- `VITE_API_BASE_URL`
- `VITE_APP_NAME`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_CLOUDINARY_FOLDER`
- `VITE_DEFAULT_CENTER_ID`

### Frontend build flow

```bash
npm install
npm run build --workspace frontend
```

## Production Notes

- Keep frontend and backend env vars separate.
- Set the frontend API URL to the deployed backend endpoint.
- Do not expose backend secrets to the browser.
- Keep MongoDB Atlas IP access restricted to the deployed server network.
