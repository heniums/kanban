"use server";

import { verifySession } from "@/lib/dal";
import { generateUploadSignature } from "@/lib/cloudinary";
import { getCloudinaryConfig } from "@/lib/cloudinary/config";

export async function getUploadSignatureAction() {
  await verifySession();

  const config = getCloudinaryConfig();
  const { signature, timestamp } = generateUploadSignature();

  return {
    signature,
    timestamp,
    apiKey: config.CLOUDINARY_API_KEY,
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    uploadPreset: config.CLOUDINARY_UPLOAD_PRESET,
  };
}
