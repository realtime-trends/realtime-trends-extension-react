#!/usr/bin/env node

// Test script to verify crawler functionality without GitHub API
const https = require('https');
const crypto = require('crypto');

// Constants from worker
const WEIGHTS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
const ENGINE_BIAS = {
  nate: 0.7,
  zum: 1.0,
};
const SIMILARITY_WEIGHT = 0.7;

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
    console.log('Crawling Zum...');
    const html = await makeRequest('https://zum.com/');
    const keywordElements = parseHTML(html, 'span.issue-word-list__keyword');

    console.log(`Found ${keywordElements.length} keywords from Zum`);

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
 * Calculate combined trends from all engines
 */
async function calculateTrends() {
  const exceptKeywords = ['Yesbet88', 'sanopk']; // Static for now

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
 * Main test function
 */
async function main() {
  try {
    console.log('Testing trends crawler...');
    
    const trends = await calculateTrends();
    
    console.log(`\nFound ${trends.length} total trends:`);
    trends.slice(0, 10).forEach((trend, index) => {
      console.log(`${index + 1}. ${trend.keyword} (${trend.score.toFixed(1)} pts, ${trend.engine})`);
    });
    
    console.log('\nCrawler test completed successfully!');
    
  } catch (error) {
    console.error('Error in test:', error);
    process.exit(1);
  }
}

// Run the test function
main();