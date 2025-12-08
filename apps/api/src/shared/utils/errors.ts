// Error codes for consistent error identification
export const ErrorCode = {
  // Client errors (4xx)
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors (5xx)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// Base application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodeType;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCodeType,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // Operational errors are expected and handled
    this.details = details;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: Record<string, unknown>) {
    super(message, 400, ErrorCode.BAD_REQUEST, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

// 400 Validation Error (with field-level errors)
export class ValidationError extends AppError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(errors: Array<{ field: string; message: string }>, message = "Validation failed") {
    super(message, 400, ErrorCode.VALIDATION_ERROR, { errors });
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: Record<string, unknown>) {
    super(message, 401, ErrorCode.UNAUTHORIZED, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: Record<string, unknown>) {
    super(message, 403, ErrorCode.FORBIDDEN, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource = "Resource", details?: Record<string, unknown>) {
    super(`${resource} not found`, 404, ErrorCode.NOT_FOUND, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: Record<string, unknown>) {
    super(message, 409, ErrorCode.CONFLICT, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

// 429 Rate Limited
export class RateLimitedError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = "Too many requests", retryAfter?: number) {
    super(message, 429, ErrorCode.RATE_LIMITED, retryAfter ? { retryAfter } : undefined);
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitedError.prototype);
  }
}

// 500 Internal Server Error
export class InternalError extends AppError {
  constructor(message = "Internal server error", details?: Record<string, unknown>) {
    super(message, 500, ErrorCode.INTERNAL_ERROR, details);
    Object.setPrototypeOf(this, InternalError.prototype);
  }
}

// 500 Database Error
export class DatabaseError extends AppError {
  constructor(message = "Database error", details?: Record<string, unknown>) {
    super(message, 500, ErrorCode.DATABASE_ERROR, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// 502 External Service Error
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string, details?: Record<string, unknown>) {
    super(message || `External service error: ${service}`, 502, ErrorCode.EXTERNAL_SERVICE_ERROR, {
      service,
      ...details,
    });
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

// Type guard to check if error is an AppError
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

// Type guard to check if error is operational (expected)
export const isOperationalError = (error: unknown): boolean => {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
};
