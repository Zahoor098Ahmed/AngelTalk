import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 8787),
  openaiKey: process.env.OPENAI_API_KEY || "",
  appToken: process.env.APP_TOKEN || "",
  pixabayKey: process.env.PIXABAY_KEY || "",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  imageModel: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
  imageSize: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
  openaiBase: "https://api.openai.com/v1",
};

export function assertConfig() {
  if (!config.openaiKey) {
    console.warn("[config] OPENAI_API_KEY is not set — /images/generations and /audio/transcriptions will return 503.");
  }
  if (!config.appToken) {
    console.warn("[config] APP_TOKEN is not set — the API is UNAUTHENTICATED. Set it before deploying.");
  }
}
