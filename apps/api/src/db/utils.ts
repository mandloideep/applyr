import type { Model, SortOrder } from "mongoose";
import mongoose from "mongoose";
import type { PaginationOptions, PaginatedResult, Pagination } from "@/shared/types/index.js";
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from "@/config/index.js";

// Mongoose 9 doesn't directly export FilterQuery, so we use the type from the module
type FilterQuery<T> = mongoose.QueryFilter<T>;

// Timestamp fields for schemas
export const timestampFields = {
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
};

// Soft delete fields for schemas
export const softDeleteFields = {
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
};

// Combine both for convenience
export const baseSchemaFields = {
  ...timestampFields,
  ...softDeleteFields,
};

// Filter out soft-deleted documents by default
export const excludeDeleted = <T>(): FilterQuery<T> => {
  return { isDeleted: { $ne: true } } as FilterQuery<T>;
};

// Pagination helper
export const paginate = async <T>(
  model: Model<T>,
  query: FilterQuery<T> = {},
  options: Partial<PaginationOptions> = {}
): Promise<PaginatedResult<T>> => {
  const page = Math.max(1, options.page ?? DEFAULT_PAGE);
  const limit = Math.min(Math.max(1, options.limit ?? DEFAULT_LIMIT), MAX_LIMIT);
  const sort = options.sort ?? "createdAt";
  const order: SortOrder = options.order === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  // Combine user query with soft delete filter
  const combinedQuery: FilterQuery<T> = {
    ...excludeDeleted<T>(),
    ...query,
  };

  // Execute count and find in parallel
  const [total, items] = await Promise.all([
    model.countDocuments(combinedQuery),
    model
      .find(combinedQuery)
      .sort({ [sort]: order })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const pages = Math.ceil(total / limit);

  const pagination: Pagination = {
    page,
    limit,
    total,
    pages,
  };

  return {
    items: items as T[],
    pagination,
  };
};

// Helper to build sort object
export const buildSortObject = (
  sort: string = "createdAt",
  order: "asc" | "desc" = "desc"
): Record<string, SortOrder> => {
  return { [sort]: order === "asc" ? 1 : -1 };
};

// Helper to update the updatedAt field
export const touchUpdatedAt = () => ({
  updatedAt: new Date(),
});

// Helper for soft delete
export const softDeleteUpdate = () => ({
  isDeleted: true,
  deletedAt: new Date(),
});

// Helper to restore soft-deleted document
export const restoreUpdate = () => ({
  isDeleted: false,
  deletedAt: null,
});
