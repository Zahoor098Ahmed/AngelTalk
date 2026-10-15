import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import { User, IUser } from "../../models/User";
import { RefreshToken } from "../../models/RefreshToken";
import { Device } from "../../models/Device";
import { AuditLog } from "../../models/AuditLog";
import { TokenService } from "./token.service";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PinLockedError,
  UnauthorizedError,
  MfaRequiredError,
} from "../../common/errors";
import { AuthenticatedUser, UserRole } from "../../common/types";

export class AuthService {
  public static async register(data: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
    phoneNumber?: string;
    pin?: string;
  }): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    if (data.role === "admin" || data.role === "superadmin") {
      throw new ForbiddenError("Cannot register as administrative user");
    }

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    let pinHash: string | undefined;
    if (data.pin) {
      pinHash = await bcrypt.hash(data.pin, 10);
    }

    const user = await User.create({
      _id: uuidv4(),
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: data.role || "parent",
      phoneNumber: data.phoneNumber,
      pinHash,
      status: "active",
      tokenVersion: 1,
    });

    const authUser: AuthenticatedUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = TokenService.generateAccessToken(authUser);
    const refreshToken = TokenService.generateRefreshToken(user._id, user.tokenVersion);
    const tokenHash = TokenService.hashToken(refreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await AuditLog.create({
      actorId: user._id,
      action: "user.register",
      targetType: "user",
      targetId: user._id,
      meta: { email: user.email, role: user.role },
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        hasPin: !!pinHash,
      } as Partial<IUser>,
      accessToken,
      refreshToken,
    };
  }

  public static async login(
    data: {
      email: string;
      password: string;
      deviceId?: string;
      deviceName?: string;
      platform?: "ios" | "android" | "web";
      mfaCode?: string;
    },
    ip?: string,
    userAgent?: string
  ): Promise<{ user: Partial<IUser>; accessToken: string; refreshToken: string }> {
    const emailCandidate = data.email.includes("@") ? data.email : `${data.email}@angeltalk.sa`;
    const user = await User.findOne({
      $or: [{ email: data.email }, { email: emailCandidate }],
    }).select("+passwordHash +pinHash +mfaSecret");
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "suspended") {
      throw new ForbiddenError("Your account has been suspended. Please contact support.");
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // MFA Check (mandatory for admin/superadmin, optional for parent)
    const requiresMfa = user.mfaEnabled || user.role === "admin" || user.role === "superadmin";
    if (requiresMfa) {
      if (!user.mfaSecret) {
        // First-time admin login requiring setup
        if (user.role === "admin" || user.role === "superadmin") {
          // Allowed only if setup token is handled
        }
      } else {
        if (!data.mfaCode) {
          throw new MfaRequiredError(user._id, "Two-factor authentication code is required");
        }
        const isValidMfa = speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: "base32",
          token: data.mfaCode,
          window: 1,
        });
        if (!isValidMfa) {
          throw new UnauthorizedError("Invalid two-factor authentication code");
        }
      }
    }

    // Handle Device Registry
    if (data.deviceId) {
      const existingDevice = await Device.findOne({ userId: user._id, deviceId: data.deviceId });
      if (existingDevice && existingDevice.revokedAt) {
        throw new ForbiddenError("This device has been revoked. Please re-authenticate on an approved device.");
      }
      await Device.findOneAndUpdate(
        { userId: user._id, deviceId: data.deviceId },
        {
          deviceName: data.deviceName || "Mobile Device",
          platform: data.platform || "web",
          lastActiveAt: new Date(),
          revokedAt: null,
        },
        { upsert: true, new: true }
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    const authUser: AuthenticatedUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      deviceId: data.deviceId,
    };

    const accessToken = TokenService.generateAccessToken(authUser);
    const refreshToken = TokenService.generateRefreshToken(user._id, user.tokenVersion);
    const tokenHash = TokenService.hashToken(refreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await AuditLog.create({
      actorId: user._id,
      action: "user.login",
      targetType: "user",
      targetId: user._id,
      ip,
      meta: { deviceId: data.deviceId, platform: data.platform },
    });

    return {
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        hasPin: !!user.pinHash,
        mfaEnabled: user.mfaEnabled,
      } as Partial<IUser>,
      accessToken,
      refreshToken,
    };
  }

  public static async refresh(
    rawToken: string,
    deviceId?: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let decoded: { id: string; tokenVersion: number };
    try {
      decoded = TokenService.verifyRefreshToken(rawToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const tokenHash = TokenService.hashToken(rawToken);
    const storedToken = await RefreshToken.findOne({ tokenHash });

    // REUSE DETECTION: If token was already revoked, someone is replaying a stolen token!
    if (storedToken && storedToken.revokedAt) {
      await User.updateOne({ _id: decoded.id }, { $inc: { tokenVersion: 1 } });
      await RefreshToken.updateMany({ userId: decoded.id }, { revokedAt: new Date() });
      await AuditLog.create({
        actorId: decoded.id,
        action: "user.sessions_revoked",
        targetType: "user",
        targetId: decoded.id,
        meta: { reason: "RefreshToken reuse detected" },
      });
      throw new UnauthorizedError("Security alert: Revoked refresh token reused. All sessions terminated.");
    }

    if (!storedToken) {
      throw new UnauthorizedError("Refresh token not found");
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status === "suspended") {
      throw new UnauthorizedError("User not found or suspended");
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new UnauthorizedError("Session has expired, please log in again");
    }

    if (deviceId) {
      const dev = await Device.findOne({ userId: user._id, deviceId });
      if (dev && dev.revokedAt) {
        throw new ForbiddenError("This device has been revoked");
      }
    }

    // Rotate token: revoke old one, issue new one
    storedToken.revokedAt = new Date();
    await storedToken.save();

    const authUser: AuthenticatedUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      deviceId,
    };

    const newAccessToken = TokenService.generateAccessToken(authUser);
    const newRefreshToken = TokenService.generateRefreshToken(user._id, user.tokenVersion);
    const newTokenHash = TokenService.hashToken(newRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      userAgent,
      ip,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public static async logout(rawToken?: string): Promise<void> {
    if (rawToken) {
      const tokenHash = TokenService.hashToken(rawToken);
      await RefreshToken.updateOne({ tokenHash }, { revokedAt: new Date() });
    }
  }

  public static async logoutAll(userId: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
    await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
    await AuditLog.create({
      actorId: userId,
      action: "user.sessions_revoked",
      targetType: "user",
      targetId: userId,
      meta: { scope: "all_sessions" },
    });
  }

  public static async verifyPin(userId: string, pin: string): Promise<{ pinToken: string }> {
    const user = await User.findById(userId).select("+pinHash");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.pinHash) {
      throw new BadRequestError("No PIN configured on this account. Please set a 4-digit PIN first.");
    }

    // Lockout check
    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new PinLockedError(remainingMinutes);
    }

    const isMatch = await bcrypt.compare(pin, user.pinHash);
    if (!isMatch) {
      user.pinFailedAttempts += 1;
      if (user.pinFailedAttempts >= 5) {
        user.pinLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
        await user.save();
        await AuditLog.create({
          actorId: userId,
          action: "pin.lockout",
          targetType: "user",
          targetId: userId,
          meta: { failedAttempts: user.pinFailedAttempts },
        });
        throw new PinLockedError(15);
      }
      await user.save();
      throw new UnauthorizedError(`Incorrect PIN. ${5 - user.pinFailedAttempts} attempts remaining.`);
    }

    // Success: reset attempts
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    const pinToken = TokenService.generatePinToken(user._id, user.email);
    return { pinToken };
  }

  public static async changePin(userId: string, newPin: string, currentPin?: string): Promise<void> {
    const user = await User.findById(userId).select("+pinHash");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.pinHash && currentPin) {
      const isMatch = await bcrypt.compare(currentPin, user.pinHash);
      if (!isMatch) {
        throw new UnauthorizedError("Current PIN is incorrect");
      }
    }

    user.pinHash = await bcrypt.hash(newPin, 10);
    user.pinFailedAttempts = 0;
    user.pinLockedUntil = null;
    await user.save();

    await AuditLog.create({
      actorId: userId,
      action: "pin.changed",
      targetType: "user",
      targetId: userId,
      meta: {},
    });
  }

  public static async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    user.passwordHash = await bcrypt.hash(newPass, 12);
    user.tokenVersion += 1; // invalidate all sessions
    await user.save();

    await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  }

  public static async setupMfa(userId: string): Promise<{ secret: string; qrCode: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const secret = speakeasy.generateSecret({
      name: `AngelTalk (${user.email})`,
      issuer: "Angel Talk",
    });

    user.mfaSecret = secret.base32;
    await user.save();

    const qrCode = await qrcode.toDataURL(secret.otpauth_url || "");
    return {
      secret: secret.base32,
      qrCode,
    };
  }

  public static async verifyMfa(userId: string, token: string): Promise<boolean> {
    const user = await User.findById(userId).select("+mfaSecret");
    if (!user || !user.mfaSecret) {
      throw new BadRequestError("MFA setup has not been initiated");
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!verified) {
      throw new UnauthorizedError("Invalid verification code");
    }

    user.mfaEnabled = true;
    await user.save();
    return true;
  }
}

