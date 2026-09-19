# Kindred check-in demo

A deliberately demo-only MVP for the mental health check-in concept.

## Run locally

```bash
npm start
```

Open `http://localhost:10000`. The app uses a profile switcher instead of authentication and seeds four fictional users with a rolling demo week of check-ins. The demo includes a guided 3-step mood check-in, theme tags, mood-aware support prompts, weekly reflection metrics, an interactive trend chart, and recent check-in details. New check-ins are stored in memory and reset whenever the service restarts or redeploys.

This is not production-ready: it has no authentication, persistent database, moderation workflow, or crisis-response capability. Do not enter real personal or health information.

## Deploy to Render

Create a new Blueprint from this repository. `render.yaml` provisions one Node web service. Render supplies the `PORT` environment variable automatically.

## Docs

- [High-level design](documentations/mental-health-app-hld.md)
- [Google login plan](documentations/google-login-plan.md) — proposal for recognizing a real user via Google (or Clerk/Auth0). Not implemented yet.
