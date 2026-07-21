# SocialFlow AI — Production Deployment Guide

Architecture: **Vercel** (React/Vite frontend) + **Render** (FastAPI web service + APScheduler worker + PostgreSQL + Redis). Railway alternative noted where steps differ.

> **Critical invariant:** the web service and the scheduler worker MUST share the same `SECRET_KEY` and `DATABASE_URL`. Social tokens are encrypted at rest with a key derived from `SECRET_KEY` — if the worker has a different key, every scheduled publish fails with "Token decryption failed". The provided `render.yaml` wires this automatically.

---

## 1. Push to GitHub

The repo already points at `https://github.com/challau/social-scheduler.git`. The cleanup untracked `.venv`, `dist`, the local SQLite DB, uploads, and caches, so commit and push:

```bash
cd ~/Desktop/social-scheduler
git add -A
git commit -m "Prepare for production deployment (Vercel + Render)"
git push origin main
```

## 2. Deploy backend + worker + DB to Render

The repo contains `render.yaml` (Blueprint) defining: web service, scheduler worker, PostgreSQL, and Redis (key-value, used for Twitter PKCE verifiers).

1. Render Dashboard → **New → Blueprint** → connect `challau/social-scheduler` → Render reads `render.yaml`.
2. When prompted, fill the `sync: false` env vars (see §4). You can leave the OAuth client IDs empty at first — the app falls back to mock social accounts until they're set.
3. After the first deploy, note the backend URL (e.g. `https://socialflow-backend.onrender.com`) and set it as `BACKEND_URL` on **both** the web service and the worker.

Migrations run automatically before each deploy via `preDeployCommand: alembic upgrade head`. To run them manually instead: Render Shell tab → `alembic upgrade head` (from `backend/`).

**Railway alternative:** create two services from the repo, both with root directory `backend` (a `Procfile` is provided):
- Web: start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Worker: start command `python -m app.workers.run_worker`
- Add the PostgreSQL and Redis plugins; set the same env vars on both services (`postgres://` URLs are normalized automatically).

## 3. Deploy frontend to Vercel

```bash
cd client
npx vercel login
npx vercel --prod
```

When prompted: framework **Vite**, build command `npm run build`, output `dist`. `client/vercel.json` already contains the SPA fallback rewrite so client-side routes work on refresh.

Then set the env var (Dashboard → Project → Settings → Environment Variables, or CLI):

```bash
npx vercel env add VITE_API_URL production
# value: https://socialflow-backend.onrender.com   (no trailing slash)
```

Redeploy after adding it (`npx vercel --prod`) — Vite bakes env vars in at build time.

Finally, set `FRONTEND_URL` on the Render web service + worker to your Vercel URL (e.g. `https://social-scheduler.vercel.app`). This drives CORS and post-OAuth browser redirects.

## 4. Environment variables

Backend (Render web + worker — templates in `backend/.env.example`):

| Variable | Web | Worker | Notes |
|---|---|---|---|
| `SECRET_KEY` | ✅ | ✅ **same value** | `openssl rand -hex 32`; JWT + token encryption |
| `DATABASE_URL` | ✅ | ✅ | From Render Postgres (auto-wired in blueprint) |
| `REDIS_URL` | ✅ | — | Twitter PKCE verifiers |
| `BACKEND_URL` | ✅ | ✅ | Public backend URL; OAuth redirect URIs derive from it |
| `FRONTEND_URL` | ✅ | ✅ | Vercel URL; CORS + OAuth browser redirects |
| `RUN_SCHEDULER_IN_WEB` | `false` | — | Worker owns publishing; avoids double-posting |
| `FORCE_HTTPS` | `true` | — | |
| `MOCK_MODE` | `false` | `false` | |
| `OPENAI_API_KEY` | ✅ | — | Mock captions if empty |
| `CLOUDINARY_URL` | ✅ | — | Strongly recommended: Render disk is ephemeral, local uploads are lost on redeploy |
| `INSTAGRAM/LINKEDIN/TWITTER_CLIENT_ID` + `_SECRET` | ✅ | — | Mock accounts if empty |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | ✅ | — | Optional (billing) |
| `SMTP_USERNAME`, `SMTP_PASSWORD` | — | ✅ | Optional (email notifications; logged to console if empty) |

Frontend (Vercel): `VITE_API_URL` only.

## 5. Update OAuth redirect URIs in developer portals

Redirect URIs are `{BACKEND_URL}/oauth/{platform}/callback`:

- **Meta for Developers** (Instagram): App → Facebook Login → Settings → Valid OAuth Redirect URIs → add `https://socialflow-backend.onrender.com/oauth/instagram/callback`
- **LinkedIn Developer Portal**: App → Auth → Authorized redirect URLs → add `https://socialflow-backend.onrender.com/oauth/linkedin/callback`
- **X (Twitter) Developer Portal**: App → User authentication settings → Callback URI → add `https://socialflow-backend.onrender.com/oauth/twitter/callback`

Exact match required — scheme, host, and path.

## 6. End-to-end verification checklist

1. `curl https://socialflow-backend.onrender.com/` → `{"status":"healthy"}`
2. Open the Vercel URL → landing page loads; hard-refresh a nested route (e.g. `/dashboard`) → no 404 (SPA rewrite works).
3. **Signup** → account created, lands in dashboard (browser dev tools: API calls hit the Render URL, no CORS errors).
4. **Connect account** (Settings) → OAuth consent screen for the platform → redirected back to `{FRONTEND_URL}/settings?platform=...&success=true`.
5. **Upload + generate**: Create Post → upload an image → media URL is a Cloudinary URL (not localhost) → Generate Caption returns platform captions.
6. **Publish now** → post status becomes `posted`; check the actual social account.
7. **Scheduled post fires**: schedule a post 2–3 minutes out → within ~10s of the scheduled time the worker publishes it (Render worker logs show `[Scheduler] Found 1 pending scheduled posts`) → status `posted` without any browser open.
8. Render logs show no `Token decryption failed` errors (if they appear, web and worker `SECRET_KEY` differ).

## Local development

Unchanged: `.env` files (copy from `.env.example`), backend falls back to SQLite + localhost URLs, `RUN_SCHEDULER_IN_WEB` defaults to `true` so a single `uvicorn app.main:app --reload` process does everything.
