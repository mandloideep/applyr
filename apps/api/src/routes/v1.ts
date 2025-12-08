import { Router, type Router as RouterType } from "express";
import { profileRouter } from "./profile.routes";

const router: RouterType = Router();

// Mount feature routers
router.use("/profile", profileRouter);

// Future routes will be added here:
// router.use("/jobs", jobsRouter);
// router.use("/applications", applicationsRouter);
// router.use("/resumes", resumesRouter);

export const v1Router: RouterType = router;
