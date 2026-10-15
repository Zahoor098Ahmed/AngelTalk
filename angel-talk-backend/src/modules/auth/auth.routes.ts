import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { authenticate } from "../../middleware/auth";
import { authRateLimiter } from "../../middleware/rate-limiter";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  verifyPinSchema,
  changePinSchema,
  changePasswordSchema,
  mfaVerifySchema,
} from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/auth/register",
  authRateLimiter,
  validate({ body: registerSchema }),
  AuthController.register
);

authRouter.post(
  "/auth/login",
  authRateLimiter,
  validate({ body: loginSchema }),
  AuthController.login
);

authRouter.post(
  "/auth/refresh",
  validate({ body: refreshSchema }),
  AuthController.refresh
);

authRouter.post(
  "/auth/logout",
  validate({ body: logoutSchema }),
  AuthController.logout
);

// Protected Auth Routes
authRouter.get(
  "/auth/me",
  authenticate,
  AuthController.me
);

authRouter.post(
  "/auth/logout-all",
  authenticate,
  AuthController.logoutAll
);

authRouter.post(
  "/auth/verify-pin",
  authenticate,
  validate({ body: verifyPinSchema }),
  AuthController.verifyPin
);

authRouter.post(
  "/auth/change-pin",
  authenticate,
  validate({ body: changePinSchema }),
  AuthController.changePin
);

authRouter.post(
  "/auth/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  AuthController.changePassword
);

authRouter.post(
  "/auth/mfa/setup",
  authenticate,
  AuthController.setupMfa
);

authRouter.post(
  "/auth/mfa/verify",
  authenticate,
  validate({ body: mfaVerifySchema }),
  AuthController.verifyMfa
);

