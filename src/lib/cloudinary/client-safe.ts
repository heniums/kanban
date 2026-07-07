// Client-safe exports — no Node.js-only dependencies

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
