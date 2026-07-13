const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const productsRouter = require('./routes/products');
const categoriesRouter = require('./routes/categories');
const uploadRouter = require('./routes/upload');
const imagesRouter = require('./routes/images');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, '');
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const normalizedAllowedOrigins = allowedOrigins
  .map(normalizeOrigin)
  .filter((origin) => {
    if (!isProduction || origin.startsWith('https://')) return true;
    console.warn(`[Security] Ignoring non-HTTPS production CORS origin: ${origin}`);
    return false;
  });
const devOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
]);

if (isProduction && normalizedAllowedOrigins.length === 0) {
  console.warn('[Security] NODE_ENV=production but ALLOWED_ORIGINS is not configured. Browser CORS requests will be denied.');
}

app.set('trust proxy', 1);

function isHttpsRequest(req) {
  return req.secure || req.headers['x-forwarded-proto'] === 'https';
}

function getRequestPathForLog(req) {
  const sensitiveParams = new Set(['token', 'id_token', 'access_token', 'auth', 'authorization', 'key']);
  const url = new URL(req.originalUrl || req.url, 'http://localhost');

  for (const param of [...url.searchParams.keys()]) {
    if (sensitiveParams.has(param.toLowerCase())) {
      url.searchParams.set(param, '[redacted]');
    }
  }

  return `${url.pathname}${url.search}`;
}

app.use((req, res, next) => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data: blob:",
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firebasestorage.googleapis.com https://script.google.com https://*.google.com https://dc.services.visualstudio.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  if (isProduction) {
    cspDirectives.push('upgrade-insecure-requests');
  }

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
});

app.use((req, res, next) => {
  if (!isProduction || isHttpsRequest(req)) return next();

  if (['GET', 'HEAD'].includes(req.method)) {
    const host = req.headers.host;
    if (host) return res.redirect(308, `https://${host}${req.originalUrl}`);
  }

  return res.status(403).json({ error: 'HTTPS is required' });
});

app.use((req, res, next) => {
  if (req.headers.authorization || !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
});

// Middlewares — restrict CORS to allowed origins only
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (normalizedAllowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
    if (!isProduction && devOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

// Global rate limiter: 100 requests per minute per IP
app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
}));

// Stricter rate limiter for write operations: 20 per minute per IP
const writeLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Write rate limit exceeded, please slow down' }
});
app.use('/api/products', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) return writeLimit(req, res, next);
  next();
});
app.use('/api/upload', writeLimit);

// Keep normal API payloads small; only image upload accepts a larger base64 body.
app.use('/api/upload', express.json({ limit: '12mb' }));
app.use('/api/upload', express.urlencoded({ limit: '12mb', extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${getRequestPathForLog(req)}`);
  next();
});

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/images', imagesRouter);

const path = require('path');

// Serve static assets in production (Vite build folder)
app.use(express.static(path.join(__dirname, '../client/dist')));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`StyleHub API Server running at http://localhost:${PORT}`);
});
