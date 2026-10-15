import { Request, Response, NextFunction } from "express";
import { AppError } from "../common/errors";
import { sendError } from "../common/response";
import { logger } from "../common/logger";
import { env } from "../config/env";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, "Operational 5xx error");
    } else {
      logger.warn(
        { code: err.code, message: err.message, path: req.path, method: req.method, issues: err.issues },
        "Operational client error"
      );
    }
    sendError(res, err.message, err.statusCode, err.code, err.issues);
    return;
  }

  // Handle Mongoose CastError or DuplicateKey error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  if (anyErr.name === "CastError") {
    sendError(res, `Invalid format for field '${anyErr.path}'`, 400, "INVALID_FIELD_FORMAT");
    return;
  }

  if (anyErr.code === 11000) {
    const field = Object.keys(anyErr.keyPattern || {})[0] || "field";
    sendError(res, `A record with this ${field} already exists.`, 409, "DUPLICATE_KEY");
    return;
  }

  // Unhandled / system errors
  logger.error({ err, path: req.path, method: req.method }, "Unhandled server exception");

  const message =
    env.NODE_ENV === "production" ? "An internal server error occurred." : err.message || "Internal server error";

  sendError(res, message, 500, "INTERNAL_SERVER_ERROR");
}

