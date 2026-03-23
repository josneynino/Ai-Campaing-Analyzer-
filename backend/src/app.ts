import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { registerRoutes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";
import { requestLogger } from "./middlewares/request-logger";

dotenv.config();

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }));

  // CORS configuration for production
  const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : ['http://localhost:3000', 'http://localhost:5173', /^http:\/\/127\.0\.0\.1:\d+$/],
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
    message: { error: 'Too many requests from this IP' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Body parsing with size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  app.use(requestLogger);

  registerRoutes(app);

  app.use(errorHandler);

  return app;
}

