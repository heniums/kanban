import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "./config";

export { getCloudinaryConfig };
export type { CloudinaryEnv } from "./config";

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

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resource_type: string;
};

export type AttachmentMetadata = {
  publicId: string;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  resourceType: string | null;
};

export function mapUploadResultToAttachment(result: CloudinaryUploadResult): AttachmentMetadata {
  return {
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format ?? null,
    width: result.width ?? null,
    height: result.height ?? null,
    bytes: result.bytes ?? null,
    resourceType: result.resource_type ?? null,
  };
}
