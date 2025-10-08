// Crypto utilities for GitHub App JWT signing

/**
 * Import RSA private key for JWT signing
 */
async function importPrivateKey(pemKey) {
  // Remove PEM headers and decode base64
  const pemHeader = "-----BEGIN RSA PRIVATE KEY-----";
  const pemFooter = "-----END RSA PRIVATE KEY-----";
  const pemContents = pemKey
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  // Convert base64 to ArrayBuffer
  const binaryDer = str2ab(atob(pemContents));
  
  // Import the key
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

/**
 * Convert string to ArrayBuffer
 */
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/**
 * Base64 URL encode
 */
function base64urlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Create and sign JWT for GitHub App
 */
export async function createJWT(appId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  
  // JWT Header
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  
  // JWT Payload
  const payload = {
    iat: now - 60, // Issued 60 seconds ago
    exp: now + 600, // Expires in 10 minutes
    iss: appId
  };
  
  // Encode header and payload
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  
  // Create signature
  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Import private key and sign
  const privateKey = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    dataBuffer
  );
  
  // Encode signature
  const encodedSignature = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  
  return `${data}.${encodedSignature}`;
}