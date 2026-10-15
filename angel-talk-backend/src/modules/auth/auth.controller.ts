import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { sendSuccess } from "../../common/response";
import { AuthenticatedRequest } from "../../middleware/auth";

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(res, result, "Account registered successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const result = await AuthService.login(req.body, ip, userAgent);
      sendSuccess(res, result, "Logged in successfully");
    } catch (err) {
      next(err);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"];
      const { refreshToken, deviceId } = req.body;
      const result = await AuthService.refresh(refreshToken, deviceId, ip, userAgent);
      sendSuccess(res, result, "Token refreshed successfully");
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.logout(req.body?.refreshToken);
      sendSuccess(res, null, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  }

  public static async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      await AuthService.logoutAll(user.id);
      sendSuccess(res, null, "All sessions revoked successfully");
    } catch (err) {
      next(err);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      const result = await AuthService.verifyPin(user.id, req.body.pin);
      sendSuccess(res, result, "PIN verified successfully");
    } catch (err) {
      next(err);
    }
  }

  public static async changePin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      await AuthService.changePin(user.id, req.body.newPin, req.body.currentPin);
      sendSuccess(res, null, "PIN updated successfully");
    } catch (err) {
      next(err);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      await AuthService.changePassword(user.id, req.body.currentPassword, req.body.newPassword);
      sendSuccess(res, null, "Password changed successfully. Please log in again.");
    } catch (err) {
      next(err);
    }
  }

  public static async setupMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      const result = await AuthService.setupMfa(user.id);
      sendSuccess(res, result, "MFA setup initialized");
    } catch (err) {
      next(err);
    }
  }

  public static async verifyMfa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      await AuthService.verifyMfa(user.id, req.body.token);
      sendSuccess(res, { mfaEnabled: true }, "MFA enabled successfully");
    } catch (err) {
      next(err);
    }
  }
}

