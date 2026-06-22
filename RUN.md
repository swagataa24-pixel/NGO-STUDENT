# How to Run the UPAY NGO App

The project is split into two apps:

- `frontend/` - React + Vite
- `backend/` - Node.js + Express + MongoDB

Each app has its own `.env` file.

## 1. Install Dependencies

From the project root:

```bash
npm install
```

This installs workspace dependencies for both `frontend` and `backend`.

## 2. Configure Frontend Env

Create:

```text
frontend/.env
```

Use:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=UPAY NGO
VITE_GOOGLE_CLIENT_ID=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_CLOUDINARY_FOLDER=upay-ngo
VITE_DEFAULT_CENTER_ID=nagpur-kumbhari
```

## 3. Configure Backend Env

Create:

```text
backend/.env
```

Use:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/upay_ngo?retryWrites=true&w=majority&appName=Cluster0
DNS_SERVERS=8.8.8.8,1.1.1.1

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

JWT_SECRET=replace-this-in-production
SESSION_SECRET=replace-this-in-production
ADMIN_EMAILS=
```

## 4. Run Backend

From the project root:

```bash
npm run backend
```

Or from `backend/`:

```bash
npm run dev
```

Check:

```text
http://localhost:5000/api/health
```

You want:

```json
"mongo": true
```

## 5. Run Frontend

From the project root:

```bash
npm run frontend
```

Or from `frontend/`:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## 6. Run Both Together

From the project root:

```bash
npm run dev
```

## 7. MongoDB Atlas Checklist

- Use a database user from **Database Access**, not your Atlas login.
- Give the user `readWrite` permission.
- Add your IP in **Network Access**.
- Add a database name in the URI, for example `/upay_ngo`.
- If password has special characters, URL encode them.

Examples:

- `@` becomes `%40`
- `#` becomes `%23`
- `%` becomes `%25`
- `/` becomes `%2F`
- `:` becomes `%3A`

## 8. Troubleshooting

### `bad auth : authentication failed`

MongoDB is reachable, but username/password is wrong.

Reset the database user password in Atlas and update `backend/.env`.

### `querySrv ECONNREFUSED`

Node DNS could not resolve MongoDB SRV records.

Keep this in `backend/.env`:

```env
DNS_SERVERS=8.8.8.8,1.1.1.1
```

### `Cannot GET`

You probably opened the backend URL.

Use:

```text
http://localhost:5173
```

The backend API is:

```text
http://localhost:5000
```

## 9. Build Frontend

```bash
npm run build
```

The frontend build output goes to:

```text
frontend/dist
```

## 10. Security Notes

- Do not commit `.env` files.
- Rotate any secret that was shared or exposed.
- Restrict MongoDB Atlas Network Access before production.
- Use strong `JWT_SECRET` and `SESSION_SECRET`.

## 11. Deployment Shortcuts

### Backend

```bash
npm install
npm run start --workspace backend
```

### Frontend

```bash
npm install
npm run build --workspace frontend
```

### Monorepo scripts

- `npm run dev` starts both frontend and backend locally.
- `npm run frontend` starts only the frontend dev server.
- `npm run backend` starts only the backend dev server.
- `npm run start` starts the backend in production mode.

