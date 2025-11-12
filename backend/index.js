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
import Uploadrouter from './route/upload/upload.js';
 
const app = express();
const PORT = process.env.PORT || 7642;
const allowedOrigins = [
  "http://10.0.104.49:8192",
  "http://10.0.104.49:7642",
  "https://litfest.arunachal.gov.in",
  "https://www.litfest.arunachal.gov.in"
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
 
// Middleware to prevent duplicate CORS headers (must be before cors middleware)
app.use((req, res, next) => {
  // Intercept res.setHeader to prevent duplicate Access-Control-Allow-Origin
  const originalSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (name.toLowerCase() === 'access-control-allow-origin') {
      // Check if header already exists
      const existing = res.getHeader('Access-Control-Allow-Origin');
      if (existing) {
        // If it exists and is a string with comma (duplicate), take first value
        if (typeof existing === 'string' && existing.includes(',')) {
          const firstOrigin = existing.split(',')[0].trim();
          return originalSetHeader(name, firstOrigin);
        }
        // If it exists and matches the new value, skip setting (prevent duplicate)
        if (existing === value) {
          return;
        }
        // If different, use the new value (cors middleware should take precedence)
        return originalSetHeader(name, value);
      }
    }
    return originalSetHeader(name, value);
  };
  next();
});

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
        console.log(origin);
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    // Prevent duplicate headers by ensuring cors middleware handles everything
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

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
app.use("/api/v1/uploads",Uploadrouter)
 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});