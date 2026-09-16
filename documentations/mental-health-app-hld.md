# High-Level Design: Mental Health Check-In & Support App

## 1. Overview

A social platform centered on daily mental health check-ins, mood tracking, peer support, and curated inspiring content — built with safety and privacy as first-class design constraints, not afterthoughts.

**Core user loop:** check in daily → see personal trends → read relevant stories/tools → optionally connect with a small support group.

---

## 2. Architecture (see diagram above)

- **Client apps** (web + mobile) — the check-in flow, feed, groups, profile
- **Backend API** — single entry point, routes to internal services
- **PostgreSQL** — primary data store (users, check-ins, posts, groups)
- **External services** — crisis resource lookup, push notifications, content moderation

Internally, the Backend API is organized into logical modules (not necessarily separate deployed services at launch — a modular monolith is the right starting point):

| Module | Responsibility |
|---|---|
| Auth | Signup/login, sessions, pseudonymous identity |
| Check-ins | Daily mood entry, streaks, trend calculation |
| Community | Groups, threads, peer posts, follows |
| Content | Curated stories, coping tools, tagging |
| Safety | Moderation queue, crisis-language detection, reporting |
| Notifications | Reminders, digest emails, push |

Starting as a modular monolith (one deployable backend, cleanly separated modules) is the right call for v1 — it's much simpler to build and deploy than microservices, and you can split modules out later only if one becomes a real bottleneck.

---

## 3. Data model (core entities)

```
User
 - id, pseudonym, email (optional), created_at, privacy_settings

CheckIn
 - id, user_id, mood_score (1-5), note, tags[], created_at

Story
 - id, title, body, theme_tags[], reviewed_by (expert/peer), published_at

Group
 - id, name, theme, is_private

GroupMembership
 - user_id, group_id, joined_at

Post
 - id, author_id, group_id (nullable), body, visibility, created_at

Comment
 - id, post_id, author_id, body, created_at

Report
 - id, target_type, target_id, reason, status, created_at
```

Keep `mood_score` and check-in notes in a separate, more tightly access-controlled table from social posts — this data is the most sensitive in the app and shouldn't share a permission model with public/group content.

---

## 4. Tech stack (aligned with a fast, managed deploy)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) | SSR for fast loads, deploys cleanly to Vercel or Render |
| Backend | Node.js (NestJS) or Django | Both pair well with Postgres and have mature auth libraries |
| Database | PostgreSQL (managed) | Relational fits this data well; Railway/Render provision it for you |
| Auth | Auth provider (e.g. Clerk, Auth0) or built-in with bcrypt + sessions | Don't roll your own crypto |
| Moderation | Third-party content moderation API + human review queue | Automated flagging isn't enough alone for this category |
| Notifications | Provider API (e.g. Resend for email, OneSignal for push) | Managed, no infra to run |

---

## 5. Deployment plan (Railway or Render)

Both platforms give you managed hosting: git-push deploys, a managed Postgres instance, SSL, and automatic restarts — no servers to patch yourself.

1. **Repo setup** — one repo (or a monorepo with `/frontend` and `/backend`), pushed to GitHub.
2. **Provision Postgres** — create a managed Postgres instance in Railway/Render; it gives you a connection string as an environment variable automatically.
3. **Backend service** — connect the repo, point it at `/backend`, set the start command (e.g. `npm run start`), and add environment variables (DB connection string, auth secrets, moderation API key).
4. **Frontend service** — connect the same repo (or deploy separately to Vercel if you want its edge network specifically for Next.js).
5. **Environment variables & secrets** — store API keys (auth provider, moderation, notifications) in the platform's secrets manager, never in the repo.
6. **Auto-deploy** — enable "deploy on push to main"; every merge ships automatically.
7. **Backups** — enable the platform's automatic Postgres backups (both Railway and Render offer this) — non-negotiable given the sensitivity of the data.
8. **Custom domain + SSL** — both platforms issue and renew SSL certificates automatically once you point your domain's DNS at them.

Claude Code can generate the exact config files (`render.yaml` or `railway.json`), the Dockerfile if needed, and the CI setup — you mainly need to create the accounts and connect the repo once.

---

## 6. Security & privacy (especially important for this category)

- Encrypt sensitive fields (mood notes, check-in history) at rest.
- Default new accounts to pseudonymous, not real-name.
- Rate-limit and log access to check-in data separately from general app logs.
- Clear, upfront data policy: what's shared with peers vs. kept private vs. used in aggregate (e.g. for personal trend charts only).
- Crisis-resource surfacing logic should run server-side on check-in submission, not rely on client-side detection alone.
- Have a documented moderation escalation path before launch, not after an incident.

---

## 7. Suggested build order

1. Auth + check-in flow + personal mood trend chart (the core habit loop)
2. Curated story feed, tagged by theme
3. Small private groups + peer posts
4. Safety layer: moderation queue, crisis resource surfacing, reporting
5. Notifications and reminders
6. Public/broader community features, if you decide to add them later

Each phase is deployable and usable on its own — you don't need the full feature set to have something real to test with users.
