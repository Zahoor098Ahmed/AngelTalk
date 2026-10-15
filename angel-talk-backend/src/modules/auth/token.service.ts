import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import { AuthenticatedUser } from "../../common/types";

export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
  tokenVersion: number;
  deviceId?: string;
}

export interface PinTokenPayload {
  id: string;
  email: string;
  type: "pin_auth";
}

export class TokenService {
  public static generateAccessToken(user: AuthenticatedUser): string {
    const payload: AccessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      deviceId: user.deviceId,
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
  }

  public static generateRefreshToken(userId: string, tokenVersion: number): string {
    return jwt.sign({ id: userId, tokenVersion, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
      expiresIn: "30d",
    });
  }

  public static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  public static generatePinToken(userId: string, email: string): string {
    const payload: PinTokenPayload = {
      id: userId,
      email,
      type: "pin_auth",
    };
    return jwt.sign(payload, env.JWT_PIN_SECRET, { expiresIn: "5m" });
  }

  public static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  public static verifyRefreshToken(token: string): { id: string; tokenVersion: number } {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; tokenVersion: number };
  }

  public static verifyPinToken(token: string): PinTokenPayload {
    return jwt.verify(token, env.JWT_PIN_SECRET) as PinTokenPayload;
  }
}

