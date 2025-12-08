// API versioning
export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

// Request limits
export const JSON_BODY_LIMIT = "10kb";
export const URL_ENCODED_LIMIT = "10kb";

// Pagination defaults
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX = 100;
export const AUTH_RATE_LIMIT_MAX = 10;

// File uploads
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
