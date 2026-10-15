import { Request, Response, NextFunction } from "express";
import { HydratedDocument } from "mongoose";
import { TokenService } from "../modules/auth/token.service";
import { User } from "../models/User";
import { Device } from "../models/Device";
import { Child, IChild } from "../models/Child";
import { CareTeam } from "../models/CareTeam";
import {
  UnauthorizedError,
  ForbiddenError,
  PinRequiredError,
  NotFoundError,
} from "../common/errors";
import { AuthenticatedUser, CareTeamPermission, UserRole } from "../common/types";

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new UnauthorizedError("Authentication token is missing"));
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = TokenService.verifyAccessToken(token);

    const user = await User.findById(payload.id);
    if (!user || user.status === "suspended") {
      next(new UnauthorizedError("User account not found or suspended"));
      return;
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      next(new UnauthorizedError("Token has been revoked, please log in again"));
      return;
    }

    if (payload.deviceId) {
      const device = await Device.findOne({ userId: user._id, deviceId: payload.deviceId });
      if (device && device.revokedAt) {
        next(new ForbiddenError("This device has been revoked"));
        return;
      }
    }

    (req as AuthenticatedRequest).user = {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      deviceId: payload.deviceId,
    };

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !allowedRoles.includes(user.role)) {
      next(new ForbiddenError("You do not have permission to perform this action"));
      return;
    }
    next();
  };
}

export function requirePin(req: Request, _res: Response, next: NextFunction): void {
  const pinToken = req.headers["x-pin-token"] as string | undefined;
  if (!pinToken) {
    next(new PinRequiredError());
    return;
  }

  try {
    const user = (req as AuthenticatedRequest).user;
    const payload = TokenService.verifyPinToken(pinToken);
    if (payload.id !== user.id) {
      next(new PinRequiredError("PIN token does not match authenticated user"));
      return;
    }
    next();
  } catch {
    next(new PinRequiredError("Invalid or expired PIN token. Please re-enter your PIN."));
  }
}

/**
 * Mandatory Data Isolation & IDOR Protection:
 * Asserts that the authenticated user has verified access to childId for a specific permission.
 * Returns the hydrated child document if authorized.
 * Returns 404 NotFoundError if unauthorized (NO existence leakage!).
 */
export async function assertChildAccess(
  user: AuthenticatedUser,
  childId: string,
  permission?: CareTeamPermission
): Promise<HydratedDocument<IChild>> {
  // Admin & Superadmin check (restricted from clinical or biometric data)
  if (user.role === "admin" || user.role === "superadmin") {
    if (permission === "view_clinical" || permission === "write_clinical") {
      throw new ForbiddenError("Administrative accounts are strictly restricted from accessing clinical or care-log data.");
    }
  }

  const child = await Child.findOne({ _id: childId, deletedAt: null });
  if (!child) {
    throw new NotFoundError("Child profile not found");
  }

  // 1. Direct Owner Access
  if (child.ownerId === user.id) {
    return child;
  }

  // 2. Admin General Management Access (Non-clinical)
  if (user.role === "admin" || user.role === "superadmin") {
    return child;
  }

  // 3. Care-Team Member Access
  if (permission) {
    const careTeamMember = await CareTeam.findOne({
      childId,
      userId: user.id,
      status: "active",
      permissions: permission,
    });
    if (careTeamMember) {
      return child;
    }
  }

  // Unauthorized access throws 404 (prevents IDOR and existence leakage)
  throw new NotFoundError("Child profile not found");
}

