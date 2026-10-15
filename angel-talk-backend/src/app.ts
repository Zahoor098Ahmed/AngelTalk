import express, { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { globalRateLimiter } from "./middleware/rate-limiter";
import { errorHandler } from "./middleware/error-handler";
import { sendSuccess } from "./common/response";
import { authRouter } from "./modules/auth/auth.routes";
import { devicesRouter } from "./modules/devices/devices.routes";
import { consentsRouter } from "./modules/consents/consents.routes";
import { childrenRouter } from "./modules/children/children.routes";
import { careTeamRouter } from "./modules/careteam/careteam.routes";
import { boardRouter } from "./modules/board/board.routes";
import { verbsRouter } from "./modules/verbs/verbs.routes";
import { faceRouter } from "./modules/face/face.routes";
import { mediaRouter } from "./modules/media-speech/media.routes";
import { routinesClinicalRouter } from "./modules/routines-clinical/routines-clinical.routes";
import { syncRouter } from "./modules/sync/sync.routes";
import { pdplRouter } from "./modules/pdpl/pdpl.routes";
import { adminRouter } from "./modules/admin/admin.routes";

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // Strict CORS Allowlist
  const origins = env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((s) => s.trim());
  app.use(
    cors({
      origin: origins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-pin-token"],
    })
  );

  // Body Parsing (Strict 2MB limit)
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Global Rate Limiter
  app.use(globalRateLimiter);

  // Health Probes
  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/v1/health", (_req, res) => {
    sendSuccess(res, { status: "ok", service: "angel-talk-backend", timestamp: new Date().toISOString() });
  });

  // Mount API Routers (Prefix /api/v1)
  const apiPrefix = "/api/v1";
  app.use(apiPrefix, authRouter);
  app.use(apiPrefix, devicesRouter);
  app.use(apiPrefix, consentsRouter);
  app.use(apiPrefix, childrenRouter);
  app.use(apiPrefix, careTeamRouter);
  app.use(apiPrefix, boardRouter);
  app.use(apiPrefix, verbsRouter);
  app.use(apiPrefix, faceRouter);
  app.use(apiPrefix, mediaRouter);
  app.use("/api", mediaRouter);
  app.use(apiPrefix, routinesClinicalRouter);
  app.use(apiPrefix, syncRouter);
  app.use(apiPrefix, pdplRouter);
  app.use(apiPrefix, adminRouter);

  // Catch-all 404 Route
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      code: "ROUTE_NOT_FOUND",
      message: "The requested API endpoint does not exist.",
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

