import path from "path";
import { mkdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import { configureFfmpeg } from "@/lib/ffmpeg";
import slugify from "slugify";

configureFfmpeg();

// TODO: Replace local storage with S3/R2 in production

// ─── Path Helpers ─────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Sanitize a filename by removing special characters and replacing spaces with hyphens.
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

/**
 * Generate a unique storage path for an uploaded file.
 * Returns an absolute path like: uploads/raw/<uuid>-<sanitized-filename>
 */
export async function generateUploadPath(
  filename: string,
  type: "raw" | "processed" | "thumbnails"
): Promise<string> {
  const dir = path.join(UPLOADS_DIR, type);
  await mkdir(dir, { recursive: true });
  const sanitized = sanitizeFilename(filename);
  const uniqueName = `${uuidv4()}-${sanitized}`;
  return path.join(dir, uniqueName);
}

/**
 * Convert a storage path to a URL served via the /api/uploads route handler.
 */
// TODO: Return CDN URL in production
export function getPublicUrl(storagePath: string): string {
  const relativePath = path.relative(UPLOADS_DIR, storagePath);
  // Normalize to forward slashes for URL
  const urlPath = relativePath.split(path.sep).join("/");
  return `/api/uploads/${urlPath}`;
}

/**
 * Probe a video file and return its duration in seconds.
 */
export function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      resolve(Math.round(duration ?? 0));
    });
  });
}

/**
 * Probe a video file and return its resolution (width × height).
 */
export function getVideoResolution(
  filePath: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video"
      );
      if (!videoStream || !videoStream.width || !videoStream.height) {
        return reject(new Error("Could not determine video resolution"));
      }
      resolve({ width: videoStream.width, height: videoStream.height });
    });
  });
}

/**
 * Generate a unique slug from a video title.
 * Appends 6 random alphanumeric chars for uniqueness.
 */
export function generateSlug(title: string): string {
  const base = slugify(title, { lower: true, strict: true });
  const suffix = uuidv4().replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`;
}
