import type { Request, Response, RequestHandler } from "express";
import { asyncHandler } from "@/shared/utils/index";
import { updateProfileSchema, updateSkillsSchema, updatePreferencesSchema } from "@applyr/shared";
import * as profileService from "./services/index";

export const getProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.getOrCreateProfile(req.user!.id);

  res.json({
    success: true,
    data: profile,
  });
});

export const updateProfile: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProfileSchema.parse(req.body);
  const profile = await profileService.updateProfile(req.user!.id, input);

  res.json({
    success: true,
    data: profile,
  });
});

export const updateSkills: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSkillsSchema.parse(req.body);
  const profile = await profileService.updateSkills(req.user!.id, input);

  res.json({
    success: true,
    data: profile,
  });
});

export const updatePreferences: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const input = updatePreferencesSchema.parse(req.body);
    const profile = await profileService.updatePreferences(req.user!.id, input);

    res.json({
      success: true,
      data: profile,
    });
  }
);
