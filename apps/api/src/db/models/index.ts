// Model exports will be added as they are implemented
// Phase 4: user-profile model
// Future: job, application, resume, email models

// Re-export database utilities for convenience
export {
  timestampFields,
  softDeleteFields,
  baseSchemaFields,
  excludeDeleted,
  paginate,
  buildSortObject,
  touchUpdatedAt,
  softDeleteUpdate,
  restoreUpdate,
} from "../utils";
