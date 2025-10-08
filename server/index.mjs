import express from "express";
const app = express();
import "dotenv/config";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });
import { readdirSync } from "fs";
import instanceMongodb from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import morgan from "morgan";



const port = process.env.PORT;

const allowedOrigins = [
  // Add production URLs
  process.env.ADMIN_URL,
  process.env.CLIENT_URL,

  // Add localhost for development
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:4174",
  "http://localhost:8081", // iOS simulator
  "http://10.0.2.2:8081", // Android emulator
  "http://10.0.2.2:8000", // Android emulator direct access
].filter(Boolean); // Remove any undefined values

// CORS configuration using config system
console.log("Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("CORS request from origin:", origin);

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV === "development") {
        console.log("Development mode: allowing all origins");
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log("Origin allowed:", origin);
        callback(null, true);
      } else {
        console.log("Origin blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
  })
);
app.use(express.json());

// Trust proxy for correct IP detection behind Cloudflare/NGINX/Vercel
app.set("trust proxy", 1);

// Rate limiting
import createRateLimiters from "./middleware/rateLimit.mjs";
const parseIntOr = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : fallback;
};
const rateLimitWhitelist = (process.env.RATE_LIMIT_WHITELIST || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const limiterOptions = {
  global: {
    points: parseIntOr(process.env.RATE_LIMIT_GLOBAL_POINTS, 100),
    duration: parseIntOr(process.env.RATE_LIMIT_GLOBAL_DURATION, 15 * 60),
  },
  authLogin: {
    points: parseIntOr(process.env.RATE_LIMIT_AUTH_POINTS, 5),
    duration: parseIntOr(process.env.RATE_LIMIT_AUTH_DURATION, 5 * 60),
  },
  checkoutPayment: {
    points: parseIntOr(process.env.RATE_LIMIT_PAYMENT_POINTS, 30),
    duration: parseIntOr(process.env.RATE_LIMIT_PAYMENT_DURATION, 10 * 60),
  },
  whitelist: rateLimitWhitelist,
  logBlocked: String(process.env.RATE_LIMIT_LOG_BLOCKED || "true") !== "false",
};
const { globalMiddleware, authMiddleware, paymentMiddleware } = createRateLimiters(limiterOptions);

// Apply global limiter first
app.use(globalMiddleware);

// init db
instanceMongodb();
connectCloudinary();
// int morgan

app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesPath = path.resolve(__dirname, "./routes");
const routeFiles = readdirSync(routesPath);
// Tighten critical paths with specific middlewares
// Auth login endpoints
app.use(["/api/user/login", "/api/user/admin"], authMiddleware);
// Payment & checkout endpoints (webhooks are auto-bypassed inside middleware)
app.use(["/api/payment", "/api/checkout"], paymentMiddleware);
routeFiles.map(async (file) => {
  const routeModule = await import(`./routes/${file}`);
  app.use("/", routeModule.default);
});

app.get("/", (req, res) => {
  res.send("You should not be here");
});

app.listen(port, "0.0.0.0",() => {
  console.log(`Server is running on ${port}`);
});