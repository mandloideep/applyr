import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger, createRequestLogger } from "@/shared/utils/logger.js";

// Extend Express Request to include requestId and logger
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      log: ReturnType<typeof createRequestLogger>;
    }
  }
}

// Generate a short unique ID for requests
const generateRequestId = (): string => {
  return crypto.randomBytes(8).toString("hex");
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers["x-request-id"] as string) || generateRequestId();

  // Attach to request object
  req.requestId = requestId;
  req.log = createRequestLogger(requestId);

  // Set response header for tracing
  res.setHeader("X-Request-ID", requestId);

  // Record start time
  const startTime = process.hrtime.bigint();

  // Log incoming request
  req.log.http(`${req.method} ${req.originalUrl}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // Log response when finished
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    // Choose log level based on status code
    if (res.statusCode >= 500) {
      req.log.error(`${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      req.log.warn(`${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
    } else {
      req.log.http(`${req.method} ${req.originalUrl} ${res.statusCode}`, logData);
    }
  });

  next();
};

// Export logger for use in other parts of the application
export { logger };
