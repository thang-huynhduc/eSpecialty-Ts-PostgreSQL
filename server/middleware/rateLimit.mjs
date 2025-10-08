import NodeCache from "node-cache";

// Basic token bucket style rate limiter per key (IP or userId)
// Config via env: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, RATE_LIMIT_TRUST_PROXY

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000); // 1 minute
const maxRequests = Number(process.env.RATE_LIMIT_MAX || 100); // 100 reqs / window

// Use in-memory cache for counters; resets keys on expiration
const bucketCache = new NodeCache({ stdTTL: Math.ceil(windowMs / 1000), useClones: false, checkperiod: 10 });

function getClientKey(req) {
  // Prefer authenticated user id to avoid penalizing shared IPs for logged-in users
  if (req.user && req.user.id) return `u:${req.user.id}`;

  // Fallback to IP address
  // trust proxy should be set at app level for req.ip to respect X-Forwarded-For
  return `ip:${req.ip || req.connection?.remoteAddress || "unknown"}`;
}

export default function rateLimitMiddleware(req, res, next) {
  // Allow health or root checks to pass freely
  if (req.path === "/" || req.path === "/health" || req.method === "OPTIONS") return next();

  const key = getClientKey(req);
  const now = Date.now();

  let entry = bucketCache.get(key);
  if (!entry) {
    entry = { count: 0, start: now };
    bucketCache.set(key, entry, Math.ceil(windowMs / 1000));
  }
  entry.count += 1;

  const elapsed = now - entry.start;
  const remainingWindowMs = Math.max(0, windowMs - elapsed);
  const remaining = Math.max(0, maxRequests - entry.count);

  // Set standard rate limit headers
  res.setHeader("X-RateLimit-Limit", String(maxRequests));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil((now + remainingWindowMs) / 1000))); // epoch seconds

  if (entry.count > maxRequests) {
    res.setHeader("Retry-After", String(Math.ceil(remainingWindowMs / 1000)));
    return res.status(429).json({ success: false, message: "Too many requests, please try again later" });
  }

  return next();
}


