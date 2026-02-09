import { NextResponse } from "next/server";
import { stat, readFile } from "fs/promises";
import path from "path";

// TODO: Serve files from CDN in production, remove this route handler

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: segments } = await params;
    const filePath = path.join(UPLOADS_DIR, ...segments);

    // Directory traversal protection
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(UPLOADS_DIR)) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400 }
      );
    }

    // Check file exists
    try {
      await stat(resolved);
    } catch {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await readFile(resolved);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": String(fileBuffer.length),
    };

    // Cache processed files and thumbnails (1 hour), not raw files
    if (resolved.includes("processed") || resolved.includes("thumbnails")) {
      headers["Cache-Control"] = "public, max-age=3600";
    }

    return new Response(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error("[API] File serving error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
