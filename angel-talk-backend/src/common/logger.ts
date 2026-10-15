import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['x-pin-token']",
      "req.headers.cookie",
      "password",
      "passwordHash",
      "pin",
      "pinHash",
      "token",
      "refreshToken",
      "tokenHash",
      "vector",
      "mfaSecret",
      "*.password",
      "*.pin",
      "*.token",
      "*.vector",
    ],
    censor: "[REDACTED]",
  },
  transport:
    env.NODE_ENV !== "production" && env.NODE_ENV !== "test"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

