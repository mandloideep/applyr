import type { Request } from "express";

// Extend Express Request type to include custom properties
export interface AuthenticatedRequest extends Request {
  id?: string; // Request ID for tracing
  user?: {
    id: string;
    email: string;
    name: string;
  };
  session?: {
    id: string;
    expiresAt: Date;
  };
}

// Pagination types
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
