import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/mongoConnect.js';
import cookieParser from 'cookie-parser';
import authRoute from './route/authRoute.js';
import eventRoute from './route/eventRoute.js';
import speakerRoute from './route/speaskerRoute.js';
import registerRoute from './route/resgistrationRoute.js';
import archiveRoute from './route/archiveRoute.js';
import newsAndBlogRoute from './route/newsAndBlogRoute.js';
import homePageRoute from './route/home/homePageRoute.js';
import videoBlogRoute from './route/videoBlogRoute.js';
import contactRoute from './route/contactRoute.js';
import { checkCookieConsent } from "./utils/auth.js";
import viewCounterRoute from "./route/viewCounterRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.21:3000",
  process.env.FRONTEND_URL || "https://arunachalwebapp.vercel.app",
  "https://arunchalwebapp.gully2global.in",
];

dotenv.config();
await connectDB();

// Basic hardening
app.disable('x-powered-by');

// Use Helmet for basic security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));

// Lightweight in-memory rate limiter (no external deps)
const createRateLimiter = ({ windowMs, maxRequests }) => {
  const ipToTimestamps = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const windowStart = now - windowMs;

    const timestamps = ipToTimestamps.get(ip) || [];
    const recent = timestamps.filter(t => t > windowStart);

    if (recent.length >= maxRequests) {
      const retryAfterSeconds = Math.ceil((recent[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('RateLimit-Limit', String(maxRequests));
      res.setHeader('RateLimit-Remaining', '0');
      res.setHeader('RateLimit-Reset', String(retryAfterSeconds));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    recent.push(now);
    ipToTimestamps.set(ip, recent);

    // Helpful headers for clients
    res.setHeader('RateLimit-Limit', String(maxRequests));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, maxRequests - recent.length)));
    next();
  };
};

// Apply rate limiter globally (safe defaults; override via env)
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100);
app.use(createRateLimiter({ windowMs: RATE_LIMIT_WINDOW_MS, maxRequests: RATE_LIMIT_MAX_REQUESTS }));

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  })
);

// Additional security headers middleware (complementary to Helmet)
app.use((req, res, next) => {
  // Set proper Content-Type with charset for all responses
  if (res.getHeader('Content-Type') && !res.getHeader('Content-Type').includes('charset')) {
    const currentType = res.getHeader('Content-Type');
    if (currentType.includes('text/html') || currentType.includes('text/plain')) {
      res.setHeader('Content-Type', `${currentType}; charset=UTF-8`);
    }
  }
  
  // Additional security headers not covered by Helmet
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), web-share=(), xr-spatial-tracking=()');
  
  // Ensure X-XSS-Protection is set (Helmet sets this but we ensure it's correct)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Middleware to ensure proper content type for JSON responses
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    if (typeof data === 'object' && !res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    } else if (typeof data === 'string' && !res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    }
    return originalSend.call(this, data);
  };
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.SECRET_KEY));

app.get("/", (req, res) => {
  res.send("Welcome to Arunachal Literature Fest API");}
);

app.use("/api/v1", checkCookieConsent,viewCounterRoute)
app.use("/api/v1/onboarding",authRoute)
app.use("/api/v1/event",eventRoute)
app.use("/api/v1/speaker",speakerRoute)
app.use("/api/v1/registration",registerRoute)
app.use("/api/v1/archive",archiveRoute)
app.use("/api/v1/newsAndBlog",newsAndBlogRoute)
app.use("/api/v1/homePage",homePageRoute)
app.use("/api/v1/videoBlog",videoBlogRoute)
app.use("/api/v1/sendMail",contactRoute)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
