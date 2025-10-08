// Cloudflare Workers script for real-time trend crawling
import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';

// Constants
const WEIGHTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
const ENGINE_BIAS = {
  nate: 0.7,
  zum: 1.0,
};
const SIMILARITY_WEIGHT = 0.7;
const INTERVAL_SECS = 600; // 10 minutes

// Exception keywords will be loaded from Supabase
let EXCEPT_KEYWORDS = [];

// Supabase client will be initialized in handler functions with env variables

/**
 * Load exception keywords from Supabase
 */
async function loadExceptionKeywords(supabase) {
  try {
    const { data, error } = await supabase
      .from('exception_keywords')
      .select('keyword');

    if (error) {
      console.error('Error loading exception keywords:', error);
      return ['Yesbet88', 'sanopk']; // fallback to default
    }

    return data.map(item => item.keyword);
  } catch (error) {
    console.error('Error loading exception keywords:', error);
    return ['Yesbet88', 'sanopk']; // fallback to default
  }
}

/**
 * Process keyword: remove symbols, normalize spaces, filter exceptions
 */
function processKeyword(keyword, exceptKeywords = []) {
  // Remove symbols and normalize spaces
  keyword = keyword.replace(/[!@#$%^&*\(\)\[\]\{\};:,./<>?\|`]/g, ' ');
  keyword = keyword.replace(/ +/g, ' ').trim();

  // Check against exception keywords
  for (const exceptKeyword of exceptKeywords) {
    if (keyword.toLowerCase().includes(exceptKeyword.toLowerCase())) {
      return null;
    }
  }

  return keyword;
}

/**
 * Generate hash for keyword (simplified version of Python's hashlib.sha256)
 */
async function getKeywordHash(keyword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(keyword.replace(/ /g, ''));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * Crawl trends from Zum portal using node-html-parser
 */
async function getTrendsFromZum(exceptKeywords = []) {
  try {
    const response = await fetch('https://zum.com/');
    if (!response.ok) return [];

    const html = await response.text();
    const root = parse(html);

    // Select all spans with issue-word-list__keyword class
    const keywordElements = root.querySelectorAll('span.issue-word-list__keyword');

    const trends = [];
    for (let i = 0; i < Math.min(keywordElements.length, WEIGHTS.length); i++) {
      const keywordText = keywordElements[i].text.trim();
      const keyword = processKeyword(keywordText, exceptKeywords);

      if (keyword) {
        const score = WEIGHTS[i] * ENGINE_BIAS.zum;
        const hashed = await getKeywordHash(keyword);
        trends.push({
          keyword,
          score,
          maxscore: score,
          hashed,
          delta: 999,
          engine: 'zum'
        });
      }
    }

    return trends;
  } catch (error) {
    console.error('Error crawling Zum:', error);
    return [];
  }
}

/**
 * Crawl trends from Nate portal
 */
async function getTrendsFromNate(exceptKeywords = []) {
  try {
    const response = await fetch('https://www.nate.com/js/data/jsonLiveKeywordDataV1.js');
    if (!response.ok) return [];

    const data = await response.json();
    const trends = [];

    for (let i = 0; i < Math.min(data.length, WEIGHTS.length); i++) {
      if (data[i] && data[i][1]) {
        const keyword = processKeyword(data[i][1], exceptKeywords);
        if (keyword) {
          const score = WEIGHTS[i] * ENGINE_BIAS.nate;
          const hashed = await getKeywordHash(keyword);
          trends.push({
            keyword,
            score,
            maxscore: score,
            hashed,
            delta: 999,
            engine: 'nate'
          });
        }
      }
    }

    return trends;
  } catch (error) {
    console.error('Error crawling Nate:', error);
    return [];
  }
}

/**
 * Calculate combined trends from all engines
 */
async function calculateTrends(supabase) {
  // Load exception keywords from Supabase
  const exceptKeywords = await loadExceptionKeywords(supabase);

  // const [zumTrends, nateTrends] = await Promise.all([
  //   getTrendsFromZum(exceptKeywords),
  //   getTrendsFromNate(exceptKeywords)
  // ]);

  // const allTrends = [...zumTrends, ...nateTrends];

  const [zumTrends] = await Promise.all([
    getTrendsFromZum(exceptKeywords)
  ]);

  const allTrends = [...zumTrends];
  const trendsMap = new Map();

  // Combine trends with same hash
  for (const trend of allTrends) {
    if (trendsMap.has(trend.hashed)) {
      const existing = trendsMap.get(trend.hashed);
      existing.score += trend.score;
      existing.maxscore = Math.max(existing.maxscore, trend.maxscore);
    } else {
      trendsMap.set(trend.hashed, { ...trend });
    }
  }

  // Handle similarity (keyword containment)
  const trends = Array.from(trendsMap.values());
  const toRemove = new Set();

  for (let i = 0; i < trends.length; i++) {
    for (let j = 0; j < trends.length; j++) {
      if (i !== j && !toRemove.has(trends[i].hashed)) {
        if (trends[j].keyword.includes(trends[i].keyword)) {
          trends[j].score += trends[i].score * SIMILARITY_WEIGHT;
          trends[j].maxscore = Math.max(trends[j].maxscore, trends[i].maxscore);
          toRemove.add(trends[i].hashed);
        }
      }
    }
  }

  // Filter out removed trends and sort by score
  return trends
    .filter(trend => !toRemove.has(trend.hashed))
    .sort((a, b) => b.score - a.score);
}

/**
 * Set delta values by comparing with previous trends
 */
async function setDelta(newTrends, oldTrends) {
  const oldTrendsMap = new Map();
  oldTrends.forEach((trend, index) => {
    oldTrendsMap.set(trend.hashed, index);
  });

  return newTrends.map((trend, newIndex) => {
    const oldIndex = oldTrendsMap.get(trend.hashed);
    if (oldIndex !== undefined) {
      trend.delta = oldIndex - newIndex;
    }
    return trend;
  });
}

/**
 * Save trends to Supabase
 */
async function saveTrendsToSupabase(timestamp, trends, supabase) {
  try {
    // Save trends data to trends table (JSONB format)
    const { error: trendsError } = await supabase
      .from('trends')
      .insert({
        timestamp,
        data: trends,
        created_at: new Date().toISOString()
      });

    if (trendsError) throw trendsError;

    // Save individual trend entries to trend_entries table
    const trendEntries = trends.map((trend, index) => ({
      timestamp,
      keyword: trend.keyword,
      score: trend.score,
      maxscore: trend.maxscore,
      hashed: trend.hashed,
      delta: trend.delta,
      rank: index + 1,
      engine: trend.engine,
      created_at: new Date().toISOString()
    }));

    const { error: entriesError } = await supabase
      .from('trend_entries')
      .insert(trendEntries);
    
    if (entriesError) throw entriesError;

    // Clean up old data (keep only last 2 entries)
    const { data: oldEntries } = await supabase
      .from('trends')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (oldEntries && oldEntries.length > 2) {
      const timestampsToDelete = oldEntries
        .slice(2)
        .map(entry => entry.timestamp);

      // Delete from both tables
      await Promise.all([
        supabase.from('trends').delete().in('timestamp', timestampsToDelete),
        supabase.from('trend_entries').delete().in('timestamp', timestampsToDelete)
      ]);
    }

    return true;
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return false;
  }
}

/**
 * Get previous trends from Supabase
 */
async function getPreviousTrends(currentTimestamp, supabase) {
  try {
    const { data, error } = await supabase
      .from('trends')
      .select('data')
      .lt('timestamp', currentTimestamp - INTERVAL_SECS)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data && data.length > 0 ? data[0].data : [];
  } catch (error) {
    console.error('Error getting previous trends:', error);
    return [];
  }
}

/**
 * Main handler function
 */
export default {
  async scheduled(event, env, ctx) {
    try {
      // Initialize Supabase with service role key for full access
      const supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
      );

      const currentTimestamp = Math.floor(Date.now() / 1000);

      // Get current trends
      const newTrends = await calculateTrends(supabase);

      // Get previous trends for delta calculation
      const oldTrends = await getPreviousTrends(currentTimestamp, supabase);

      // Calculate delta
      const trendsWithDelta = await setDelta(newTrends, oldTrends);

      // Save to Supabase
      const success = await saveTrendsToSupabase(currentTimestamp, trendsWithDelta, supabase);

      if (success) {
        console.log(`Successfully processed ${trendsWithDelta.length} trends at ${new Date().toISOString()}`);
      } else {
        console.error('Failed to save trends to Supabase');
      }

    } catch (error) {
      console.error('Error in scheduled handler:', error);
    }
  },

  async fetch(request, env, ctx) {
    // Handle HTTP requests (for testing or manual trigger)
    if (request.method === 'POST' && new URL(request.url).pathname === '/trigger') {
      // Manually trigger the crawling process
      await this.scheduled(null, env, ctx);
      return new Response('Crawling triggered successfully', { status: 200 });
    }

    return new Response('Trend Crawler Worker', { status: 200 });
  }
};