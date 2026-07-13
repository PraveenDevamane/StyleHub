const crypto = require('crypto');
const https = require('https');
const { getDocument } = require('./firestoreRest');

let googlePublicKeys = {};
let cacheExpiry = 0;

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Fetch Google's public certificate keys for validation using Node https module
function fetchGooglePublicKeys() {
  const now = Date.now();
  if (now < cacheExpiry && Object.keys(googlePublicKeys).length > 0) {
    return Promise.resolve(googlePublicKeys);
  }

  return new Promise((resolve, reject) => {
    https.get(GOOGLE_CERTS_URL, (res) => {
      if (res.statusCode !== 200) {
        res.resume(); // consume response to free memory
        return reject(new Error(`Google certs returned HTTP ${res.statusCode}`));
      }

      // Parse cache-control header for TTL
      const cacheControl = res.headers['cache-control'] || '';
      let maxAge = 3600;
      const match = cacheControl.match(/max-age=(\d+)/);
      if (match) maxAge = parseInt(match[1], 10);

      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          googlePublicKeys = JSON.parse(body);
          cacheExpiry = now + (maxAge * 1000);
          resolve(googlePublicKeys);
        } catch (parseErr) {
          reject(new Error('Failed to parse Google certificates JSON'));
        }
      });
    }).on('error', (err) => {
      console.error('[AuthService] Network error fetching Google certs:', err.message);
      reject(new Error('Failed to fetch certificates from Google'));
    });
  });
}

// Convert base64url encoding to base64
function base64urlToBase64(str) {
  let main = str.replace(/-/g, '+').replace(/_/g, '/');
  while (main.length % 4) {
    main += '=';
  }
  return main;
}

// Manually verify Firebase JWT Token signatures without Service Account keys
async function verifyFirebaseIdToken(token) {
  if (!token) throw new Error('Token is missing');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token structure');

  const [headerStr, payloadStr, signatureStr] = parts;
  
  // Parse JWT parts
  const header = JSON.parse(Buffer.from(base64urlToBase64(headerStr), 'base64').toString('utf8'));
  const payload = JSON.parse(Buffer.from(base64urlToBase64(payloadStr), 'base64').toString('utf8'));

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '';
  if (!projectId) {
    throw new Error('Firebase Project ID is not configured on the server');
  }

  // 1. Verify standard claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Token has expired');
  }
  if (payload.aud !== projectId) {
    throw new Error('Invalid token audience');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Invalid token issuer');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Token subject (sub) is missing or invalid');
  }
  if (payload.iat > now) {
    throw new Error('Token issued-at time is in the future');
  }
  if (payload.auth_time > now) {
    throw new Error('Token auth_time is in the future');
  }

  // 2. Validate cryptographic signature
  const keys = await fetchGooglePublicKeys();
  const publicKeyPem = keys[header.kid];
  if (!publicKeyPem) {
    throw new Error('Public key not found for token signature verification');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerStr}.${payloadStr}`);
  
  const isVerified = verifier.verify(publicKeyPem, base64urlToBase64(signatureStr), 'base64');
  if (!isVerified) {
    throw new Error('Invalid token signature');
  }

  return payload;
}

// Express Authorization Middleware
async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await verifyFirebaseIdToken(token);
    
    // Check in Firestore if the UID is an admin
    const uid = decoded.user_id || decoded.uid;
    const adminDoc = await getDocument('admins', uid, token);

    if (!adminDoc) {
      console.warn(`[Auth Middleware] Non-admin access attempt blocked for UID: ${uid}`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.user = decoded;
    req.firebaseIdToken = token;
    next();
  } catch (err) {
    console.warn('[Auth Middleware] Security check failed:', err.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  verifyFirebaseIdToken,
  requireAdmin
};
