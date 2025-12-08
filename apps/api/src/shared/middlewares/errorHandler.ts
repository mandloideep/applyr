import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError, type ZodIssue } from "zod";
import { env } from "@/config/index";
import { logger } from "@/shared/utils/logger";
import {
  ErrorCode,
  isAppError,
  isOperationalError,
  ValidationError,
  type ErrorCodeType,
} from "@/shared/utils/errors";

// Standard error response format
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
  requestId?: string;
}

// Convert Zod errors to ValidationError format
const formatZodError = (error: ZodError): ValidationError => {
  const errors = error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
  return new ValidationError(errors);
};

// Global error handler middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Get request logger if available, otherwise use global logger
  const log = req.log || logger;

  // Convert Zod errors to ValidationError
  if (err instanceof ZodError) {
    err = formatZodError(err);
  }

  // Determine if this is an operational error we can handle gracefully
  const operational = isOperationalError(err);

  // Get error details
  let statusCode = 500;
  let code: ErrorCodeType = ErrorCode.INTERNAL_ERROR;
  let message = "Internal server error";
  let details: Record<string, unknown> | undefined;

  if (isAppError(err)) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  // Log the error
  if (operational) {
    // Operational errors are expected, log at warn level for client errors
    if (statusCode >= 500) {
      log.error(message, {
        code,
        statusCode,
        details,
        stack: err.stack,
      });
    } else {
      log.warn(message, {
        code,
        statusCode,
        details,
      });
    }
  } else {
    // Unexpected errors - log full details
    log.error("Unhandled error", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
  }

  // Build error response
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message: operational ? message : "Internal server error",
    },
    requestId: req.requestId,
  };

  // Include details if available and operational
  if (operational && details) {
    response.error.details = details;
  }

  // Include stack trace in development for debugging
  if (env.NODE_ENV === "development" && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Handle uncaught exceptions
export const handleUncaughtException = (error: Error): void => {
  logger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });

  // Exit process for uncaught exceptions (let process manager restart)
  process.exit(1);
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (reason: unknown): void => {
  logger.error("Unhandled Rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });

  // Exit process for unhandled rejections (let process manager restart)
  process.exit(1);
};
