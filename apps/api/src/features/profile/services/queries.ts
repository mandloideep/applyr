import { UserProfile, type IUserProfile } from "../profile.model";
import { NotFoundError } from "@/shared/utils/index";

// Get profile by user ID
export const getProfileByUserId = async (userId: string): Promise<IUserProfile> => {
  const profile = await UserProfile.findOne({
    userId,
    isDeleted: { $ne: true },
  }).lean();

  if (!profile) {
    throw new NotFoundError("Profile");
  }

  return profile as IUserProfile;
};

// Get profile by user ID (returns null if not found)
export const findProfileByUserId = async (userId: string): Promise<IUserProfile | null> => {
  const profile = await UserProfile.findOne({
    userId,
    isDeleted: { $ne: true },
  }).lean();

  return profile as IUserProfile | null;
};

// Check if profile exists for user
export const profileExists = async (userId: string): Promise<boolean> => {
  const count = await UserProfile.countDocuments({
    userId,
    isDeleted: { $ne: true },
  });
  return count > 0;
};
