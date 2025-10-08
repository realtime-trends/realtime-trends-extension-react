# Realtime Trends Data

This branch contains only real-time trend data in JSON format, automatically updated every 5 minutes by GitHub Actions.

## Structure

- `latest.json` - Most recent trend data (top 10 trends)
- `timestamps.json` - Available timestamp list  
- `data/{timestamp}.json` - Historical trend data

## Usage

Access via GitHub Pages CDN:
```
https://hoya.github.io/realtime-trends-extension-react/latest.json
https://hoya.github.io/realtime-trends-extension-react/timestamps.json
https://hoya.github.io/realtime-trends-extension-react/data/{timestamp}.json
```

## Auto-Update

Data is automatically crawled and updated every 5 minutes from:
- Zum portal trends
- Other Korean trend sources

Last update: Auto-managed by GitHub Actions