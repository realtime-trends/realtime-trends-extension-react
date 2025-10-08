// Cloudflare Worker to trigger GitHub Actions for trend updates
// Runs every 5 minutes using Fine-grained Personal Access Token

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
          timestamp: new Date().toISOString(),
          method: response.method || 'fine-grained-token'
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
        auth_method: 'fine-grained-token',
        timestamp: new Date().toISOString(),
        nextRun: getNextCronRun()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default response
    return new Response(JSON.stringify({
      service: 'Realtime Trends Scheduler (Fine-grained Token)',
      endpoints: {
        'POST /trigger': 'Manually trigger workflow',
        'GET /status': 'Get service status'
      },
      setup: 'Set GITHUB_TOKEN secret with fine-grained token'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Trigger GitHub Actions workflow via repository_dispatch
 */
async function triggerGitHubWorkflow(env) {
  try {
    const { DATA_REPO, DATA_BRANCH, GITHUB_TOKEN } = env;
    
    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is required. Please set a Fine-grained Personal Access Token.');
    }
    
    console.log('Using Fine-grained Personal Access Token');
    
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
          source: 'fine-grained-token',
          branch: DATA_BRANCH
        }
      })
    });
    
    if (response.ok) {
      return { success: true, method: 'fine-grained-token' };
    } else {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `GitHub API error: ${response.status} ${response.statusText} - ${errorText}` 
      };
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