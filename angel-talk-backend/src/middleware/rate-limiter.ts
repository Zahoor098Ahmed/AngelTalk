import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "../common/logger";
import { AppError } from "../common/errors";

let redisClient: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    redisClient.connect().catch((err) => {
      logger.warn({ err }, "Redis connection failed, falling back to memory rate limiting");
      redisClient = null;
    });
  } catch (err) {
    logger.warn({ err }, "Redis initialization failed, falling back to memory rate limiting");
    redisClient = null;
  }
}

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        // @ts-expect-error RedisStore type compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
        prefix: "rl:global:",
      })
    : undefined,
  handler: (_req, _res, next) => {
    next(new AppError("Too many requests from this IP, please try again in a minute.", 429, "RATE_LIMIT_EXCEEDED"));
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        // @ts-expect-error RedisStore type compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
        prefix: "rl:auth:",
      })
    : undefined,
  handler: (_req, _res, next) => {
    next(new AppError("Too many authentication attempts, please try again after 15 minutes.", 429, "AUTH_RATE_LIMIT_EXCEEDED"));
  },
});

export const ttsRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 TTS requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: redisClient
    ? new RedisStore({
        // @ts-expect-error RedisStore type compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
        prefix: "rl:tts:",
      })
    : undefined,
  handler: (_req, _res, next) => {
    next(new AppError("Too many TTS requests, please try again shortly.", 429, "TTS_RATE_LIMIT_EXCEEDED"));
  },
});

