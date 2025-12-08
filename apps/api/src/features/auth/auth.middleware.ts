import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "./auth";
import { UnauthorizedError } from "@/shared/utils/index";

// Extend Express Request to include user and session
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
      };
    }
  }
}

// Require authentication - throws if not authenticated
export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedError("Authentication required");
    }

    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - attaches user if authenticated, continues otherwise
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }

    next();
  } catch {
    // Silently continue without user
    next();
  }
};
