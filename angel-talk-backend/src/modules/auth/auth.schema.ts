import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").trim(),
  role: z.enum(["parent", "slp", "educator"]).default("parent"),
  phoneNumber: z.string().optional(),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits").optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Username or email is required").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: z.enum(["ios", "android", "web"]).default("web"),
  mfaCode: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
  deviceId: z.string().optional(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

export const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4}$/, "Current PIN must be exactly 4 digits").optional(),
  newPin: z.string().regex(/^\d{4}$/, "New PIN must be exactly 4 digits"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const mfaVerifySchema = z.object({
  token: z.string().length(6, "MFA code must be exactly 6 digits"),
});

