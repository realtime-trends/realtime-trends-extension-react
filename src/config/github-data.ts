// GitHub Data Repository client for real-time trends
// Replaces Supabase with Cloudflare Pages CDN

const GITHUB_DATA_URL = 'https://realtime-trends-extension-react.pages.dev';

// Type definitions matching the original Supabase structure
export interface GitHubTrendEntry {
  keyword: string;
  score: number;
  maxscore: number;
  hashed: string;
  delta: number;
  rank?: number;
  engine: string;
  created_at?: string;
}

export interface GitHubLatestResponse {
  timestamp: number;
  trends: GitHubTrendEntry[];
  updated: string;
}

export interface GitHubTimestampsResponse {
  timestamps: number[];
}

/**
 * Fetch data from GitHub Pages with fallback handling
 */
async function fetchGitHubData<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${GITHUB_DATA_URL}/${path}`, {
      cache: 'no-cache', // Always get fresh data
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`GitHub data fetch failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    return null;
  }
}

/**
 * Get latest trends data (replaces getLatestTrends from Supabase)
 */
export async function getLatestTrends(): Promise<GitHubTrendEntry[]> {
  try {
    const data = await fetchGitHubData<GitHubLatestResponse>('latest.json');

    if (!data || !data.trends) {
      console.error('No trends data available from GitHub');
      return [];
    }

    // Convert to match original Supabase format
    return data.trends.map((trend, index) => ({
      id: index + 1, // Add id field for compatibility
      timestamp: data.timestamp,
      keyword: trend.keyword,
      score: trend.score,
      maxscore: trend.maxscore,
      hashed: trend.hashed,
      delta: trend.delta,
      rank: index + 1,
      engine: trend.engine,
      created_at: data.updated,
      ...trend
    }));
  } catch (error) {
    console.error('Error getting latest trends:', error);
    return [];
  }
}

/**
 * Get trends by specific timestamp (replaces getTrendsByTimestamp from Supabase)
 */
export async function getTrendsByTimestamp(timestamp: number): Promise<GitHubTrendEntry[]> {
  try {
    const data = await fetchGitHubData<{
      timestamp: number;
      trends: GitHubTrendEntry[];
      created_at: string;
    }>(`data/${timestamp}.json`);

    if (!data || !data.trends) {
      console.error(`No trends data available for timestamp ${timestamp}`);
      return [];
    }

    // Convert to match original Supabase format
    return data.trends.map((trend, index) => ({
      id: index + 1, // Add id field for compatibility
      timestamp: data.timestamp,
      keyword: trend.keyword,
      score: trend.score,
      maxscore: trend.maxscore,
      hashed: trend.hashed,
      delta: trend.delta,
      rank: index + 1,
      engine: trend.engine,
      created_at: data.created_at,
      ...trend
    }));
  } catch (error) {
    console.error(`Error getting trends for timestamp ${timestamp}:`, error);
    return [];
  }
}

/**
 * Get recent timestamps (replaces getRecentTimestamps from Supabase)
 */
export async function getRecentTimestamps(): Promise<number[]> {
  try {
    const data = await fetchGitHubData<GitHubTimestampsResponse>('timestamps.json');

    if (!data || !data.timestamps) {
      console.error('No timestamps data available from GitHub');
      return [];
    }

    // Return timestamps sorted in descending order (newest first)
    return data.timestamps.sort((a, b) => b - a);
  } catch (error) {
    console.error('Error getting recent timestamps:', error);
    return [];
  }
}