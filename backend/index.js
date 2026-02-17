import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import captchaRoute from './route/captchaRoute.js';
import { checkCookieConsent } from "./utils/auth.js";
import viewCounterRoute from "./route/viewCounterRoute.js";
import Uploadrouter from './route/upload/upload.js';
 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7642;

// CORS: strict whitelist only — never trust arbitrary origins (CWE-942)
const defaultOrigins = [
  "http://localhost:3000",
  "http://10.0.104.49:8192",
  "http://10.0.104.49:7642",
  "https://litfest.arunachal.gov.in",
  "https://www.litfest.arunachal.gov.in",
  "https://arunchalwebapp.gully2global.in",
  "https://arunachal-literature-festival.vercel.app"
];
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean).filter((o) => o !== "*")
  : defaultOrigins;
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
      connectSrc: ["'self'", ...allowedOrigins],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
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
 
// Middleware to prevent duplicate CORS headers and enforce whitelist (must be before cors middleware)
app.use((req, res, next) => {
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'access-control-allow-origin') {
      const requestOrigin = req.get('Origin');
      if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
        return; // Never set CORS origin for non-whitelisted origins
      }
      const existing = res.getHeader('Access-Control-Allow-Origin');
      if (existing) {
        if (typeof existing === 'string' && existing.includes(',')) {
          const firstOrigin = existing.split(',')[0].trim();
          return originalSetHeader(name, firstOrigin);
        }
        if (existing === value) {
          return;
        }
        return originalSetHeader(name, value);
      }
    }
    return originalSetHeader(name, value);
  };
  next();
});

// CORS configuration - whitelist only; never reflect or allow arbitrary origins
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, false);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    // Prevent duplicate headers by ensuring cors middleware handles everything
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Add Vary: Origin header to prevent cache poisoning attacks
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

// Final cleanup middleware to ensure no duplicate CORS headers before response is sent
app.use((req, res, next) => {
  const cleanupCorsHeaders = () => {
    const originHeader = res.getHeader('Access-Control-Allow-Origin');
    if (originHeader && typeof originHeader === 'string' && originHeader.includes(',')) {
      // If header contains comma (duplicate), take first value
      const firstOrigin = originHeader.split(',')[0].trim();
      res.setHeader('Access-Control-Allow-Origin', firstOrigin);
    }
  };
  
  // Intercept res.end to clean up headers before sending
  const originalEnd = res.end.bind(res);
  res.end = function(...args) {
    cleanupCorsHeaders();
    return originalEnd(...args);
  };
  
  next();
});
 
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
 
// Middleware to ensure proper content type for JSON responses and cleanup CORS headers
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    // Clean up duplicate CORS headers before sending
    const originHeader = res.getHeader('Access-Control-Allow-Origin');
    if (originHeader && typeof originHeader === 'string' && originHeader.includes(',')) {
      const firstOrigin = originHeader.split(',')[0].trim();
      res.setHeader('Access-Control-Allow-Origin', firstOrigin);
    }
    
    // Set content type if not already set
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

// HIGH PRIORITY FIX: Rate limiter for login endpoint
const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes window
  max: 5, // Limit each IP to 5 login requests per window
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again in 5 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count successful requests
  skipFailedRequests: false, // Count failed requests
});

 
app.get("/", (req, res) => {
  res.send("Welcome to Arunachal Literature Fest API");}
);
 
// Apply rate limiter only to login endpoint
app.use("/api/v1/onboarding/login", loginRateLimiter);

app.use("/api/v1", checkCookieConsent,viewCounterRoute)
app.use("/api/v1/captcha", captchaRoute)
app.use("/api/v1/onboarding",authRoute)
app.use("/api/v1/event",eventRoute)
app.use("/api/v1/speaker",speakerRoute)
app.use("/api/v1/registration",registerRoute)
app.use("/api/v1/archive",archiveRoute)
app.use("/api/v1/newsAndBlog",newsAndBlogRoute)
app.use("/api/v1/homePage",homePageRoute)
app.use("/api/v1/videoBlog",videoBlogRoute)
app.use("/api/v1/sendMail",contactRoute)
app.use("/api/v1/uploads",Uploadrouter)
 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});