import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../config/env";
import { BadRequestError } from "../../common/errors";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT,
  credentials:
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  forcePathStyle: !!env.AWS_ENDPOINT, // Required for Cloudflare R2 / MinIO
});

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "audio/mp4": "m4a",
  "audio/m4a": "m4a",
  "audio/mpeg": "mp3",
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

export class S3Service {
  public static async generatePresignedUploadUrl(
    childId: string,
    contentType: string,
    fileSize?: number
  ): Promise<{ uploadUrl: string; fileKey: string; publicUrl: string }> {
    const ext = ALLOWED_CONTENT_TYPES[contentType];
    if (!ext) {
      throw new BadRequestError(
        `Unsupported media type: '${contentType}'. Allowed types: jpeg, png, webp, mp4, m4a, mpeg.`
      );
    }

    const isImage = contentType.startsWith("image/");
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
    if (fileSize && fileSize > maxSize) {
      throw new BadRequestError(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    // Key is strictly scoped to children/{childId}/{uuid}.ext
    const fileKey = `children/${childId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes

    const publicUrl = env.AWS_ENDPOINT
      ? `${env.AWS_ENDPOINT}/${env.S3_BUCKET_NAME}/${fileKey}`
      : `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileKey}`;

    return { uploadUrl, fileKey, publicUrl };
  }
}

