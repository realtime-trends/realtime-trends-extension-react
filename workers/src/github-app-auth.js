// GitHub App authentication (more secure than PAT)
// Requires: APP_ID, PRIVATE_KEY, INSTALLATION_ID

/**
 * Generate JWT for GitHub App authentication
 */
async function generateJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iat: now - 60, // Issued 60 seconds in the past
    exp: now + 600, // Expires in 10 minutes
    iss: appId
  };
  
  // In production, use proper JWT library
  // For now, we'll use GitHub API directly
  return await signJWT(payload, privateKey);
}

/**
 * Get installation access token
 */
async function getInstallationToken(appId, privateKey, installationId) {
  const jwt = await generateJWT(appId, privateKey);
  
  const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get installation token: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.token;
}

/**
 * Trigger GitHub Actions with GitHub App token
 */
export async function triggerWithGitHubApp(env) {
  const { APP_ID, PRIVATE_KEY, INSTALLATION_ID, DATA_REPO } = env;
  
  try {
    // Get short-lived access token
    const token = await getInstallationToken(APP_ID, PRIVATE_KEY, INSTALLATION_ID);
    
    // Use token to trigger workflow
    const response = await fetch(`https://api.github.com/repos/${DATA_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        event_type: 'update-trends',
        client_payload: {
          timestamp: Math.floor(Date.now() / 1000),
          source: 'github-app'
        }
      })
    });
    
    return { success: response.ok };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Simple JWT signing (in production, use crypto.subtle or library)
async function signJWT(payload, privateKey) {
  // This is a simplified implementation
  // In production, use proper JWT signing with crypto.subtle
  const header = { alg: 'RS256', typ: 'JWT' };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  // For now, return a placeholder
  // In production, implement proper RS256 signing
  return `${encodedHeader}.${encodedPayload}.signature`;
}