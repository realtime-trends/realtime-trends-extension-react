# Realtime Trends Worker

Cloudflare Worker that triggers GitHub Actions every 5 minutes.

## Setup

1. **Create Fine-grained Token**:
   - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Repository: `realtime-trends/realtime-trends-extension-react`
   - Permissions: Actions (Write), Contents (Read)

2. **Deploy**:
   ```bash
   wrangler secret put GITHUB_TOKEN  # paste token
   wrangler deploy
   ```

3. **Test**:
   ```bash
   curl -X POST https://your-worker.workers.dev/trigger
   ```

Done! Worker runs every 5 minutes automatically.