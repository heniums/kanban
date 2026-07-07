import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  getCloudinaryConfig,
  generateUploadSignature,
  deleteCloudinaryAsset,
  mapUploadResultToAttachment,
  type CloudinaryUploadResult,
} from "@/lib/cloudinary";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: {
      api_sign_request: vi.fn(() => "mocked-signature"),
    },
    uploader: {
      destroy: vi.fn(() => Promise.resolve({ result: "ok" })),
    },
  },
}));

describe("Cloudinary config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns config when all env vars are present", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "123456";
    process.env.CLOUDINARY_API_SECRET = "secret-key";
    process.env.CLOUDINARY_UPLOAD_PRESET = "test-preset";

    const config = getCloudinaryConfig();

    expect(config).toEqual({
      CLOUDINARY_CLOUD_NAME: "test-cloud",
      CLOUDINARY_API_KEY: "123456",
      CLOUDINARY_API_SECRET: "secret-key",
      CLOUDINARY_UPLOAD_PRESET: "test-preset",
    });
  });

  it("throws when env vars are missing", () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_UPLOAD_PRESET;

    expect(() => getCloudinaryConfig()).toThrow(
      /Cloudinary environment variables are missing or invalid/,
    );
  });

  it("throws when some env vars are empty", () => {
    process.env.CLOUDINARY_CLOUD_NAME = "";
    process.env.CLOUDINARY_API_KEY = "123";
    process.env.CLOUDINARY_API_SECRET = "secret";
    process.env.CLOUDINARY_UPLOAD_PRESET = "preset";

    expect(() => getCloudinaryConfig()).toThrow(
      /Cloudinary environment variables are missing or invalid/,
    );
  });
});

describe("generateUploadSignature", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "123456";
    process.env.CLOUDINARY_API_SECRET = "secret-key";
    process.env.CLOUDINARY_UPLOAD_PRESET = "test-preset";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("generates a signature with current timestamp", () => {
    const result = generateUploadSignature();

    expect(result.signature).toBe("mocked-signature");
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it("uses provided timestamp when given", () => {
    const result = generateUploadSignature(1234567890);

    expect(result.timestamp).toBe(1234567890);
  });
});

describe("deleteCloudinaryAsset", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
    process.env.CLOUDINARY_API_KEY = "123456";
    process.env.CLOUDINARY_API_SECRET = "secret-key";
    process.env.CLOUDINARY_UPLOAD_PRESET = "test-preset";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("calls cloudinary destroy with publicId", async () => {
    await deleteCloudinaryAsset("image_123");

    const { v2: cloudinary } = await import("cloudinary");
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("image_123");
  });
});

describe("mapUploadResultToAttachment", () => {
  it("maps full upload result correctly", () => {
    const result: CloudinaryUploadResult = {
      public_id: "abc123",
      secure_url: "https://res.cloudinary.com/test/image/upload/abc123.jpg",
      format: "jpg",
      width: 800,
      height: 600,
      bytes: 12345,
      resource_type: "image",
    };

    const mapped = mapUploadResultToAttachment(result);

    expect(mapped).toEqual({
      publicId: "abc123",
      url: "https://res.cloudinary.com/test/image/upload/abc123.jpg",
      format: "jpg",
      width: 800,
      height: 600,
      bytes: 12345,
      resourceType: "image",
    });
  });

  it("handles null/undefined values", () => {
    const result = {
      public_id: "abc123",
      secure_url: "https://example.com/image.jpg",
      format: undefined,
      width: undefined,
      height: undefined,
      bytes: undefined,
      resource_type: undefined,
    } as unknown as CloudinaryUploadResult;

    const mapped = mapUploadResultToAttachment(result);

    expect(mapped).toEqual({
      publicId: "abc123",
      url: "https://example.com/image.jpg",
      format: null,
      width: null,
      height: null,
      bytes: null,
      resourceType: null,
    });
  });
});
