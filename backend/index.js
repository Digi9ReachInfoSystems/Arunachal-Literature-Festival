import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/mongoConnect.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
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
const PORT = process.env.PORT || 8000;
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
      imgSrc: ["'self'", "data:", "https:", "http://localhost:8000", "http://192.168.1.21:8000"],
      mediaSrc: ["'self'", "data:", "https:", "http://localhost:8000", "http://192.168.1.21:8000"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", ...allowedOrigins],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
      childSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Range', 'Cache-Control']
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
 
  // Additional security headers not covered by Helmet (allow video playback features)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=*, encrypted-media=*, fullscreen=*, picture-in-picture=*, publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), web-share=(), xr-spatial-tracking=()');
 
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

// Handle OPTIONS requests for video files specifically
app.options('/uploads/VideoBlog/videos/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Range');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  res.status(200).end();
});

// Handle OPTIONS requests for thumbnail files
app.options('/uploads/VideoBlog/thumbnails/:filename', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  res.status(200).end();
});

// Video streaming route with range support
app.get('/uploads/VideoBlog/videos/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const videoPath = path.join(process.cwd(), 'uploads', 'VideoBlog', 'videos', filename);
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).send('Invalid filename');
    }
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).send('Video not found');
    }
    
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Range');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      // Validate range
      if (start >= fileSize || end >= fileSize) {
        return res.status(416).send('Range not satisfiable');
      }
      
      // Create read stream for the requested range
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunksize,
      };
      
      res.writeHead(206, head);
      file.pipe(res);
      
      // Handle stream errors
      file.on('error', (err) => {
        console.error('Video stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Stream error');
        }
      });
      
    } else {
      // Send entire file
      const head = {
        'Content-Length': fileSize,
      };
      res.writeHead(200, head);
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
      
      // Handle stream errors
      stream.on('error', (err) => {
        console.error('Video stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Stream error');
        }
      });
    }
  } catch (error) {
    console.error('Video route error:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal server error');
    }
  }
});

// Custom middleware for other uploads (images, thumbnails)
app.use('/uploads', (req, res, next) => {
  const filePath = req.path.toLowerCase();
  
  // Set CORS headers for all uploads
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Define MIME types for image formats
  const imageMimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  
  // Check if it's an image file and set appropriate headers
  for (const [ext, mimeType] of Object.entries(imageMimeTypes)) {
    if (filePath.endsWith(ext)) {
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      break;
    }
  }
  
  next();
});

// Serve static files from uploads directory with custom options
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, filePath) => {
    // Additional headers for all static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (filePath.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Accept-Ranges', 'bytes');
    }
    
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));
 
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