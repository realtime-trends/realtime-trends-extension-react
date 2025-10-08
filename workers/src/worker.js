// Cloudflare Worker to trigger GitHub Actions for trend updates
// Runs every 5 minutes and triggers the external-trigger workflow
// Uses GitHub App for secure authentication

import { createJWT } from './crypto-utils.js';

export default {
  async scheduled(event, env, ctx) {
    try {
      console.log('Scheduled trigger started at:', new Date().toISOString());
      
      // Trigger GitHub Actions workflow via repository_dispatch
      const response = await triggerGitHubWorkflow(env);
      
      if (response.success) {
        console.log('Successfully triggered GitHub Actions workflow');
      } else {
        console.error('Failed to trigger GitHub Actions:', response.error);
      }
      
    } catch (error) {
      console.error('Error in scheduled handler:', error);
    }
  },

  async fetch(request, env, ctx) {
    // Handle HTTP requests for testing
    const url = new URL(request.url);
    
    if (url.pathname === '/trigger' && request.method === 'POST') {
      // Manual trigger endpoint
      try {
        const response = await triggerGitHubWorkflow(env);
        
        return new Response(JSON.stringify({
          success: response.success,
          message: response.success ? 'Workflow triggered successfully' : 'Failed to trigger workflow',
          error: response.error || null,
          timestamp: new Date().toISOString()
        }), {
          status: response.success ? 200 : 500,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Error triggering workflow',
          error: error.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url.pathname === '/status') {
      // Status endpoint
      return new Response(JSON.stringify({
        service: 'Realtime Trends Scheduler',
        status: 'active',
        timestamp: new Date().toISOString(),
        nextRun: getNextCronRun()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default response
    return new Response(JSON.stringify({
      service: 'Realtime Trends Scheduler',
      endpoints: {
        'POST /trigger': 'Manually trigger workflow',
        'GET /status': 'Get service status'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Get installation access token using GitHub App
 */
async function getInstallationToken(appId, privateKey, installationId) {
  try {
    // Create JWT for GitHub App authentication
    const jwt = await createJWT(appId, privateKey);
    
    // Get installation access token
    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'realtime-trends-scheduler'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get installation token: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.token;
    
  } catch (error) {
    throw new Error(`Installation token error: ${error.message}`);
  }
}

/**
 * Trigger GitHub Actions workflow via repository_dispatch using GitHub App
 */
async function triggerGitHubWorkflow(env) {
  try {
    const { DATA_REPO, DATA_BRANCH, APP_ID, PRIVATE_KEY, INSTALLATION_ID } = env;
    
    // Check if GitHub App credentials are available
    if (APP_ID && PRIVATE_KEY && INSTALLATION_ID) {
      console.log('Using GitHub App authentication');
      
      // Get short-lived installation token
      const token = await getInstallationToken(APP_ID, PRIVATE_KEY, INSTALLATION_ID);
      
      // Use token to trigger workflow
      const response = await fetch(`https://api.github.com/repos/${DATA_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'realtime-trends-scheduler',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          event_type: 'update-trends',
          client_payload: {
            timestamp: Math.floor(Date.now() / 1000),
            source: 'github-app',
            branch: DATA_BRANCH
          }
        })
      });
      
      if (response.ok) {
        return { success: true, method: 'github-app' };
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `GitHub API error: ${response.status} ${response.statusText} - ${errorText}` 
        };
      }
      
    } else {
      // Fallback to Personal Access Token
      console.log('Falling back to Personal Access Token');
      
      const { GITHUB_TOKEN } = env;
      
      if (!GITHUB_TOKEN) {
        throw new Error('Neither GitHub App credentials nor GITHUB_TOKEN are available');
      }
      
      const response = await fetch(`https://api.github.com/repos/${DATA_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'realtime-trends-scheduler',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: JSON.stringify({
          event_type: 'update-trends',
          client_payload: {
            timestamp: Math.floor(Date.now() / 1000),
            source: 'pat-fallback',
            branch: DATA_BRANCH
          }
        })
      });
      
      if (response.ok) {
        return { success: true, method: 'pat-fallback' };
      } else {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `GitHub API error: ${response.status} ${response.statusText} - ${errorText}` 
        };
      }
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Calculate next cron run time (every 5 minutes)
 */
function getNextCronRun() {
  const now = new Date();
  const next = new Date(now);
  
  // Round up to next 5-minute interval
  const minutes = now.getMinutes();
  const nextMinute = Math.ceil(minutes / 5) * 5;
  
  if (nextMinute === 60) {
    next.setHours(next.getHours() + 1);
    next.setMinutes(0);
  } else {
    next.setMinutes(nextMinute);
  }
  
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  return next.toISOString();
}