import mongoose, { Schema, type Document, type Model } from "mongoose";
import { softDeleteFields, timestampFields } from "@/db/utils";

// Preferences subdocument interface
export interface UserPreferences {
  jobTypes?: ("full-time" | "part-time" | "contract" | "remote")[];
  locations?: string[];
  salaryMin?: number;
  industries?: string[];
  companySizes?: ("startup" | "mid" | "enterprise")[];
  notifications?: {
    email: boolean;
    highMatchScore: number;
  };
}

// UserProfile document interface
export interface IUserProfile {
  userId: string; // References Better Auth user.id
  headline?: string;
  summary?: string;
  location?: string;
  skills: string[];
  preferences: UserPreferences;
  // Timestamps and soft delete
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface IUserProfileDocument extends IUserProfile, Document {}

// Preferences schema
const preferencesSchema = new Schema<UserPreferences>(
  {
    jobTypes: {
      type: [String],
      enum: ["full-time", "part-time", "contract", "remote"],
      default: [],
    },
    locations: {
      type: [String],
      default: [],
    },
    salaryMin: {
      type: Number,
      default: undefined,
    },
    industries: {
      type: [String],
      default: [],
    },
    companySizes: {
      type: [String],
      enum: ["startup", "mid", "enterprise"],
      default: [],
    },
    notifications: {
      type: {
        email: { type: Boolean, default: true },
        highMatchScore: { type: Number, default: 70, min: 0, max: 100 },
      },
      default: { email: true, highMatchScore: 70 },
    },
  },
  { _id: false }
);

// UserProfile schema
const userProfileSchema = new Schema<IUserProfileDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    headline: {
      type: String,
      maxlength: 200,
    },
    summary: {
      type: String,
      maxlength: 2000,
    },
    location: {
      type: String,
      maxlength: 100,
    },
    skills: {
      type: [String],
      default: [],
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    ...timestampFields,
    ...softDeleteFields,
  },
  {
    timestamps: false, // We're using our own timestamp fields
    collection: "user_profiles",
  }
);

// Indexes
userProfileSchema.index({ userId: 1, isDeleted: 1 });

// Pre-save middleware to update updatedAt
userProfileSchema.pre("save", function () {
  this.updatedAt = new Date();
});

// Pre-update middleware
userProfileSchema.pre(["updateOne", "findOneAndUpdate"], function () {
  this.set({ updatedAt: new Date() });
});

export const UserProfile: Model<IUserProfileDocument> = mongoose.model<IUserProfileDocument>(
  "UserProfile",
  userProfileSchema
);
