import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  REDIS_URL: z.string().optional(),
  
  // JWT Secrets
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_PIN_SECRET: z.string().min(16, "JWT_PIN_SECRET must be at least 16 characters"),
  
  // CORS
  CORS_ORIGIN: z.string().default("*"),
  
  // Superadmin Seed Credentials
  ADMIN_EMAIL: z.string().email().default("angeltalkadmin@angeltalk.sa"),
  ADMIN_PASSWORD: z.string().min(8).default("admin123"),
  
  // Feature Flags & Security
  FACE_SERVER_TEMPLATES: z.coerce.boolean().default(false),
  ENABLE_WHISPER: z.coerce.boolean().default(false),
  ENABLE_IMAGE_GEN: z.coerce.boolean().default(false),
  
  // Storage (S3 / Cloudflare R2 / MinIO / Saudi Sovereign Cloud)
  AWS_REGION: z.string().default("me-central-1"),
  AWS_ENDPOINT: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().default("angel-talk-media"),
  
  // External Provider Keys
  GOOGLE_TTS_API_KEY: z.string().optional(),
  GOOGLE_TTS_REGION: z.string().default("me-central1"),
  OPENAI_API_KEY: z.string().optional(),
  SMS_PROVIDER: z.enum(["mock", "unifonic", "twilio"]).default("mock"),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().default("AngelTalk"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // eslint-disable-next-line no-console
  console.error("FATAL: Environment validation failed with issues:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export type Env = z.infer<typeof envSchema>;

