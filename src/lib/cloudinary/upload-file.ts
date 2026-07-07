"use client";

import type { CloudinaryUploadResult } from "@/lib/cloudinary/client-safe";

/**
 * Upload a single image file to Cloudinary.
 * Dynamically imports the upload-signature server action to keep the
 * static dependency graph free of server-only modules (important for tests).
 */
export async function uploadImageFile(file: File): Promise<CloudinaryUploadResult> {
  const { getUploadSignatureAction } = await import("@/lib/actions/upload-signature");

  const sig = await getUploadSignatureAction();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("upload_preset", sig.uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  return (await res.json()) as CloudinaryUploadResult;
}
