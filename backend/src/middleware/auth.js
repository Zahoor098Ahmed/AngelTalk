import { config } from "../config.js";

/**
 * Requires "Authorization: Bearer <APP_TOKEN>" on every request when APP_TOKEN
 * is configured. When it is blank (local dev), auth is skipped.
 */
export function requireAppToken(req, res, next) {
  if (!config.appToken) return next();

  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (token && token === config.appToken) return next();
  return res.status(401).json({ error: "Unauthorized. Send Authorization: Bearer <app token>." });
}
