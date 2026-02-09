import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensure a file reference is a browser-accessible URL.
 * - If already a URL path (starts with /), return as-is.
 * - If an absolute filesystem path under uploads/, convert to /api/uploads/... URL.
 * - Otherwise return as-is (external URL, etc.).
 */
export function toPublicUrl(fileRef: string): string {
  // Already a URL path
  if (fileRef.startsWith("/")) return fileRef;

  // Already an http(s) URL
  if (fileRef.startsWith("http")) return fileRef;

  // Absolute filesystem path — convert to API URL
  const normalized = path.resolve(fileRef);
  if (normalized.startsWith(UPLOADS_DIR)) {
    const relativePath = path.relative(UPLOADS_DIR, normalized);
    const urlPath = relativePath.split(path.sep).join("/");
    return `/api/uploads/${urlPath}`;
  }

  // Fallback: return as-is
  return fileRef;
}
