# upayinfoPVT

`upayinfoPVT` is a private, personal classroom-management workspace focused on helping teachers take attendance and keep daily teaching records organized.

The repository contains:

- `frontend`: React + Vite interface
- `backend`: Express + MongoDB API

Core features include Google sign-in, approval-based roles, classes, student records, attendance sessions, progress notes, teacher profiles, activity photos, dashboards, and PDF reports.

## Local development

```powershell
cd backend
npm ci
npm run dev
```

```powershell
cd frontend
npm ci
npm run dev
```

The frontend defaults to `http://localhost:5173`; the backend defaults to `http://localhost:5000`.

## Security notes

- Google OAuth is the only login method.
- New accounts are Viewers until the workspace owner approves Teacher access.
- Production startup fails when required secrets or OAuth configuration are missing or weak.
- Never commit `.env` files or share tokens, database URIs, encryption keys, or OAuth secrets.
- Review [replace.md](./replace.md) and [SECURITY_DEPLOYMENT.md](./SECURITY_DEPLOYMENT.md) before deployment.
