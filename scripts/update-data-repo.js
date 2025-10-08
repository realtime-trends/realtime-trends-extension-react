#!/usr/bin/env node

// GitHub Data Repository Updater
// Crawls trends and updates GitHub data repository

const https = require('https');
const crypto = require('crypto');

// Constants from worker
const WEIGHTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
const ENGINE_BIAS = {
  nate: 0.7,
  zum: 1.0,
};
const SIMILARITY_WEIGHT = 0.7;
const INTERVAL_SECS = 300; // 5 minutes

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DATA_REPO = process.env.DATA_REPO || 'realtime-trends/realtime-trends-data';
const DATA_BRANCH = process.env.DATA_BRANCH || 'data';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

/**
 * Make HTTP request and return response as string
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Process keyword: remove symbols, normalize spaces
 */
function processKeyword(keyword, exceptKeywords = ['Yesbet88', 'sanopk']) {
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
 * Generate hash for keyword
 */
function getKeywordHash(keyword) {
  return crypto.createHash('sha256')
    .update(keyword.replace(/ /g, ''))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Parse HTML manually (simplified parser for specific needs)
 */
function parseHTML(html, selector) {
  const results = [];
  
  if (selector === 'span.issue-word-list__keyword') {
    // Extract Zum keywords
    const regex = /<span[^>]*class="[^"]*issue-word-list__keyword[^"]*"[^>]*>([^<]+)<\/span>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      results.push({ text: match[1].trim() });
    }
  }
  
  return results;
}

/**
 * Crawl trends from Zum portal
 */
async function getTrendsFromZum(exceptKeywords = []) {
  try {
    const html = await makeRequest('https://zum.com/');
    const keywordElements = parseHTML(html, 'span.issue-word-list__keyword');

    const trends = [];
    for (let i = 0; i < Math.min(keywordElements.length, WEIGHTS.length); i++) {
      const keywordText = keywordElements[i].text;
      const keyword = processKeyword(keywordText, exceptKeywords);

      if (keyword) {
        const score = WEIGHTS[i] * ENGINE_BIAS.zum;
        const hashed = getKeywordHash(keyword);
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
    const data = await makeRequest('https://www.nate.com/js/data/jsonLiveKeywordDataV1.js');
    const parsedData = JSON.parse(data);
    const trends = [];

    for (let i = 0; i < Math.min(parsedData.length, WEIGHTS.length); i++) {
      if (parsedData[i] && parsedData[i][1]) {
        const keyword = processKeyword(parsedData[i][1], exceptKeywords);
        if (keyword) {
          const score = WEIGHTS[i] * ENGINE_BIAS.nate;
          const hashed = getKeywordHash(keyword);
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
async function calculateTrends() {
  const exceptKeywords = ['Yesbet88', 'sanopk']; // Static for now

  const [zumTrends] = await Promise.all([
    getTrendsFromZum(exceptKeywords)
    // getTrendsFromNate(exceptKeywords) // Uncomment when needed
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
 * Get file from GitHub
 */
async function getGitHubFile(path) {
  try {
    const url = `https://api.github.com/repos/${DATA_REPO}/contents/${path}?ref=${DATA_BRANCH}`;
    const response = await makeRequest(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'realtime-trends-updater'
      }
    });
    
    const data = JSON.parse(response);
    return {
      content: JSON.parse(Buffer.from(data.content, 'base64').toString()),
      sha: data.sha
    };
  } catch (error) {
    if (error.message.includes('404')) {
      return { content: null, sha: null };
    }
    throw error;
  }
}

/**
 * Update file in GitHub
 */
async function updateGitHubFile(path, content, sha = null) {
  const url = `https://api.github.com/repos/${DATA_REPO}/contents/${path}`;
  
  const body = {
    message: `Update ${path} - ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch: DATA_BRANCH
  };
  
  if (sha) {
    body.sha = sha;
  }

  try {
    const response = await makeRequest(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'realtime-trends-updater',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    console.log(`Successfully updated ${path}`);
    return JSON.parse(response);
  } catch (error) {
    console.error(`Failed to update ${path}:`, error.message);
    throw error;
  }
}

/**
 * Set delta values by comparing with previous trends
 */
function setDelta(newTrends, oldTrends) {
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
 * Main execution function
 */
async function main() {
  try {
    console.log('Starting trends update process...');
    
    const currentTimestamp = Math.floor(Date.now() / 1000);
    
    // Get current trends
    console.log('Crawling trends from sources...');
    const newTrends = await calculateTrends();
    console.log(`Found ${newTrends.length} trends`);
    
    // Get previous trends for delta calculation
    console.log('Getting previous trends for delta calculation...');
    const { content: previousData } = await getGitHubFile('latest.json');
    const oldTrends = previousData ? previousData.trends || [] : [];
    
    // Calculate delta
    const trendsWithDelta = setDelta(newTrends, oldTrends);
    
    // Prepare data structures
    const latestData = {
      timestamp: currentTimestamp,
      trends: trendsWithDelta.slice(0, 10), // Top 10 trends
      updated: new Date().toISOString()
    };
    
    const timestampData = {
      keyword: trendsWithDelta[0]?.keyword || '',
      score: trendsWithDelta[0]?.score || 0,
      maxscore: trendsWithDelta[0]?.maxscore || 0,
      hashed: trendsWithDelta[0]?.hashed || '',
      delta: trendsWithDelta[0]?.delta || 999,
      rank: 1,
      engine: trendsWithDelta[0]?.engine || 'zum',
      created_at: new Date().toISOString()
    };
    
    // Update files
    console.log('Updating GitHub repository...');
    
    // Update latest.json
    const { sha: latestSha } = await getGitHubFile('latest.json');
    await updateGitHubFile('latest.json', latestData, latestSha);
    
    // Update timestamps.json
    const { content: timestampsContent, sha: timestampsSha } = await getGitHubFile('timestamps.json');
    let timestamps = timestampsContent ? timestampsContent.timestamps || [] : [];
    
    // Add new timestamp and keep only recent ones (last 24 hours = 288 entries for 5-min intervals)
    timestamps.unshift(currentTimestamp);
    timestamps = timestamps.slice(0, 288);
    
    await updateGitHubFile('timestamps.json', { timestamps }, timestampsSha);
    
    // Update specific timestamp file
    await updateGitHubFile(`data/${currentTimestamp}.json`, {
      timestamp: currentTimestamp,
      trends: trendsWithDelta,
      created_at: new Date().toISOString()
    });
    
    console.log('Trends update completed successfully!');
    console.log(`Top trend: ${trendsWithDelta[0]?.keyword || 'None'}`);
    
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the main function
main();