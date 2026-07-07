import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "./config";

export { getCloudinaryConfig };
export type { CloudinaryEnv } from "./config";
export type { CloudinaryUploadResult, AttachmentMetadata } from "./client-safe";
export { mapUploadResultToAttachment } from "./client-safe";

export function initCloudinary() {
  const config = getCloudinaryConfig();

  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export function generateUploadSignature(timestamp?: number): {
  signature: string;
  timestamp: number;
} {
  const config = getCloudinaryConfig();
  const ts = timestamp ?? Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: ts,
      upload_preset: config.CLOUDINARY_UPLOAD_PRESET,
    },
    config.CLOUDINARY_API_SECRET,
  );

  return { signature, timestamp: ts };
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  initCloudinary();
  await cloudinary.uploader.destroy(publicId);
}
