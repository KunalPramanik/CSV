import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { corsOptions } from './config/cors.config.js';
import { loggingMiddleware } from './middleware/logging.middleware.js';
import { globalLimiter } from './middleware/rate-limiter.middleware.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
import apiRouter from './routes/api.router.js';

const app = express();

// Trust reverse proxy (Vercel, Cloudflare, etc.) for rate limiter IP extraction
app.set('trust proxy', 1);

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors(corsOptions));

// Compress responses
app.use(compression());

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom request logger
app.use(loggingMiddleware);

// Apply rate limiting globally
app.use(globalLimiter);

// Mount API Gateway
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
