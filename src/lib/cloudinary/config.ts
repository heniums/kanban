import { z } from "zod";

const cloudinaryEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1),
});

export type CloudinaryEnv = z.infer<typeof cloudinaryEnvSchema>;

export function getCloudinaryConfig(): CloudinaryEnv {
  const parsed = cloudinaryEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(
      `Cloudinary environment variables are missing or invalid:\n${issues.join("\n")}`,
    );
  }

  return parsed.data;
}
