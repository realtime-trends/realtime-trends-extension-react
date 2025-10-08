# Realtime Trends Scheduler - Cloudflare Worker

This Cloudflare Worker replaces unreliable GitHub Actions scheduled triggers by running every 5 minutes and triggering the GitHub Actions workflow via `repository_dispatch`.

## Setup

### 1. Install Dependencies
```bash
cd cloudflare-worker
npm install -g wrangler
npm install
```

### 2. Configure Secrets
```bash
# Set GitHub token (needs repo permissions)
wrangler secret put GITHUB_TOKEN
```

### 3. Deploy
```bash
wrangler deploy
```

## Configuration

### Environment Variables (wrangler.toml)
- `DATA_REPO`: GitHub repository name
- `DATA_BRANCH`: Target branch for data updates

### Secrets (via Wrangler)
- `GITHUB_TOKEN`: GitHub Personal Access Token with `repo` permissions

## Usage

### Automatic Scheduling
- Runs every 5 minutes via Cloudflare cron triggers
- Triggers `external-trigger` GitHub Actions workflow
- More reliable than GitHub Actions scheduled triggers

### Manual Testing
```bash
# Test locally
wrangler dev

# Manual trigger via HTTP
curl -X POST https://realtime-trends-scheduler.your-subdomain.workers.dev/trigger

# Check status
curl https://realtime-trends-scheduler.your-subdomain.workers.dev/status
```

## Endpoints

- `POST /trigger` - Manually trigger GitHub Actions workflow
- `GET /status` - Get scheduler status and next run time
- `GET /` - Service information

## Advantages over GitHub Actions Schedule

1. **Reliability**: Cloudflare Workers cron is more reliable
2. **Performance**: Faster execution and triggering
3. **Monitoring**: Better logging and error handling
4. **Control**: Manual trigger endpoint for testing

## Monitoring

```bash
# View real-time logs
wrangler tail

# Check deployment status
wrangler deployments list
```