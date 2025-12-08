import { UserProfile, type IUserProfile, type UserPreferences } from "../profile.model";
import { findProfileByUserId } from "./queries";
import { touchUpdatedAt, softDeleteUpdate } from "@/db/utils";

// Profile update input types
export interface UpdateProfileInput {
  headline?: string;
  summary?: string;
  location?: string;
}

export interface UpdateSkillsInput {
  skills: string[];
}

export interface UpdatePreferencesInput {
  preferences: Partial<UserPreferences>;
}

// Create profile for user (called after signup)
export const createProfile = async (userId: string): Promise<IUserProfile> => {
  const profile = new UserProfile({
    userId,
    skills: [],
    preferences: {},
  });

  await profile.save();
  return profile.toObject();
};

// Get or create profile for user
export const getOrCreateProfile = async (userId: string): Promise<IUserProfile> => {
  const existing = await findProfileByUserId(userId);
  if (existing) {
    return existing;
  }
  return createProfile(userId);
};

// Update profile basic fields
export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput
): Promise<IUserProfile> => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId, isDeleted: { $ne: true } },
    {
      ...input,
      ...touchUpdatedAt(),
    },
    { new: true }
  ).lean();

  if (!profile) {
    // Profile doesn't exist, create it with the input
    const newProfile = new UserProfile({
      userId,
      ...input,
      skills: [],
      preferences: {},
    });
    await newProfile.save();
    return newProfile.toObject();
  }

  return profile;
};

// Update skills array
export const updateSkills = async (
  userId: string,
  input: UpdateSkillsInput
): Promise<IUserProfile> => {
  const profile = await UserProfile.findOneAndUpdate(
    { userId, isDeleted: { $ne: true } },
    {
      skills: input.skills,
      ...touchUpdatedAt(),
    },
    { new: true }
  ).lean();

  if (!profile) {
    // Profile doesn't exist, create it with skills
    const newProfile = new UserProfile({
      userId,
      skills: input.skills,
      preferences: {},
    });
    await newProfile.save();
    return newProfile.toObject();
  }

  return profile;
};

// Update preferences (partial update)
export const updatePreferences = async (
  userId: string,
  input: UpdatePreferencesInput
): Promise<IUserProfile> => {
  // Build the update object for nested fields
  const updateObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input.preferences)) {
    if (value !== undefined) {
      updateObj[`preferences.${key}`] = value;
    }
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId, isDeleted: { $ne: true } },
    {
      $set: {
        ...updateObj,
        ...touchUpdatedAt(),
      },
    },
    { new: true }
  ).lean();

  if (!profile) {
    // Profile doesn't exist, create it with preferences
    const newProfile = new UserProfile({
      userId,
      skills: [],
      preferences: input.preferences,
    });
    await newProfile.save();
    return newProfile.toObject();
  }

  return profile;
};

// Soft delete profile
export const deleteProfile = async (userId: string): Promise<void> => {
  await UserProfile.updateOne({ userId, isDeleted: { $ne: true } }, { $set: softDeleteUpdate() });
};
