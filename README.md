# Kindred check-in demo

A deliberately demo-only MVP for the mental health check-in concept.

## Run locally

```bash
npm start
```

Open `http://localhost:10000`. The app uses a profile switcher instead of authentication and seeds three fictional users with fictional check-ins. New check-ins are stored in memory and reset whenever the service restarts or redeploys.

This is not production-ready: it has no authentication, persistent database, moderation workflow, or crisis-response capability. Do not enter real personal or health information.

## Deploy to Render

Create a new Blueprint from this repository. `render.yaml` provisions one Node web service. Render supplies the `PORT` environment variable automatically.
