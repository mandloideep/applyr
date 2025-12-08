import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { env, JSON_BODY_LIMIT, URL_ENCODED_LIMIT } from "@/config/index.js";
import { getConnectionState } from "@/db/connection.js";
import { requestLogger, errorHandler } from "@/shared/middlewares/index.js";
import { NotFoundError } from "@/shared/utils/index.js";

export const createApp = (): Express => {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxy
  app.set("trust proxy", 1);

  // Request logging (adds requestId and logger to req)
  app.use(requestLogger);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (env.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    })
  );

  // Body parsers
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: URL_ENCODED_LIMIT }));

  // Health check endpoint (no auth required)
  app.get("/health", (_req: Request, res: Response) => {
    const dbState = getConnectionState();

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbState.isConnected,
        status: dbState.readyStateText,
      },
    });
  });

  // Readiness check endpoint (for container orchestration)
  app.get("/ready", (_req: Request, res: Response) => {
    const dbState = getConnectionState();

    if (!dbState.isConnected) {
      res.status(503).json({
        status: "not ready",
        checks: {
          database: dbState.readyStateText,
        },
      });
      return;
    }

    res.status(200).json({
      status: "ready",
      checks: {
        database: dbState.readyStateText,
      },
    });
  });

  // TODO: Mount API routes here (Phase 4+)
  // app.use("/api/v1", apiRouter);

  // 404 handler for unmatched routes
  app.use((_req: Request, _res: Response) => {
    throw new NotFoundError("Route");
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
