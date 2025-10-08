import { RateLimiterMemory } from "rate-limiter-flexible";

// Helpers
function getClientIp(req) {
  // Respect proxy headers if trust proxy is set at app level
  const ip = req.ip || (req.headers["x-forwarded-for"] || "").split(",")[0] || req.connection?.remoteAddress || "unknown";
  return ip;
}

function isWhitelisted(req, whitelist) {
  if (!Array.isArray(whitelist) || whitelist.length === 0) return false;
  const ip = getClientIp(req);
  return whitelist.includes(ip);
}

function isWebhookPath(req) {
  const url = req.originalUrl || req.url || "";
  // Free pass for webhook endpoints
  return (
    url.includes("/api/payment/stripe/webhook") ||
    url.includes("/api/payment/paypal/webhook") ||
    url.includes("/api/ghn/webhook")
  );
}

// Create a fixed window limiter factory
function createFixedWindowLimiter({ points, duration, keyPrefix }) {
  return new RateLimiterMemory({
    points, // requests
    duration, // per seconds
    keyPrefix,
    execEvenly: false,
    blockDuration: 0,
    insuranceLimiter: undefined,
  });
}

function buildMiddleware(limiter, { onBlocked }) {
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const clientKey = getClientIp(req);
      await limiter.consume(clientKey);
      next();
    } catch (rejRes) {
      if (onBlocked) {
        try { onBlocked(req, rejRes); } catch (_) { /* noop */ }
      }
      const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.setHeader("Retry-After", String(retrySecs));
      res.status(429).json({ message: "Too many requests, please try again later." });
    }
  };
}

export function createRateLimiters(options = {}) {
  const {
    global = { points: 100, duration: 15 * 60 },
    authLogin = { points: 5, duration: 5 * 60 },
    checkoutPayment = { points: 30, duration: 10 * 60 },
    whitelist = [],
    logBlocked = true,
  } = options;

  const globalLimiter = createFixedWindowLimiter({ ...global, keyPrefix: "rl:global" });
  const authLimiter = createFixedWindowLimiter({ ...authLogin, keyPrefix: "rl:auth" });
  const paymentLimiter = createFixedWindowLimiter({ ...checkoutPayment, keyPrefix: "rl:payment" });

  const onBlocked = (req, rejRes) => {
    if (!logBlocked) return;
    const ip = getClientIp(req);
    const path = req.originalUrl || req.url;
    // Avoid logging full IP if masking desired (simple mask)
    const maskedIp = ip.replace(/(\d+\.\d+\.)(\d+\.)(\d+)/, "$1***.$3");
    // eslint-disable-next-line no-console
    console.warn(`[rate-limit] blocked ip=${maskedIp} path=${path} waitMs=${rejRes?.msBeforeNext ?? 0}`);
  };

  // Base wrapper that skips for webhooks and whitelist
  function wrap(limiter) {
    const mw = buildMiddleware(limiter, { onBlocked });
    return function (req, res, next) {
      if (isWebhookPath(req)) return next();
      if (isWhitelisted(req, whitelist)) return next();
      return mw(req, res, next);
    };
  }

  return {
    globalMiddleware: wrap(globalLimiter),
    authMiddleware: wrap(authLimiter),
    paymentMiddleware: wrap(paymentLimiter),
  };
}

export default createRateLimiters;


