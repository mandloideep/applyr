import { Router, type Router as RouterType } from "express";
import { requireAuth } from "@/features/auth/index";
import * as profileController from "@/features/profile/profile.controller";

const router: RouterType = Router();

// All profile routes require authentication
router.use(requireAuth);

// GET /api/v1/profile - Get current user's profile
router.get("/", profileController.getProfile);

// PATCH /api/v1/profile - Update profile basic fields
router.patch("/", profileController.updateProfile);

// PATCH /api/v1/profile/skills - Update skills
router.patch("/skills", profileController.updateSkills);

// PATCH /api/v1/profile/preferences - Update preferences
router.patch("/preferences", profileController.updatePreferences);

export const profileRouter: RouterType = router;
