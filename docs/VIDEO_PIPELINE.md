# Video Pipeline Specification

> Complete specification for video upload, transcoding, storage, and playback in the Video Platform MVP.
> **This is the single source of truth for the entire video lifecycle.**
> Claude Code must reference this document when building any upload, processing, or playback feature.

---

## Table of Contents

1. [Upload Flow](#1-upload-flow)
2. [Transcoding Pipeline](#2-transcoding-pipeline)
3. [Storage Structure](#3-storage-structure)
4. [Playback](#4-playback)
5. [Processing Status & UI Feedback](#5-processing-status--ui-feedback)
6. [Validation & Security](#6-validation--security)
7. [Environment Variables](#7-environment-variables)
8. [Implementation Files](#8-implementation-files)
9. [MVP Simplifications](#9-mvp-simplifications)

---

## 1. Upload Flow

### 1.1 Overview

Creators upload video files directly to object storage (S3/R2) using presigned URLs. The Next.js server never handles the raw video bytes — this bypasses body size limits and offloads bandwidth to the storage provider.

**For MVP:** Start with local file storage in `public/uploads/` via a Next.js API route. The architecture is designed so that switching to S3/R2 presigned URLs requires changing only the upload endpoint and storage utility — no component or action changes.

### 1.2 Step-by-Step Upload Flow

```
Creator                  Browser (Client)           Server                    Storage (S3/R2 or local)
  │                           │                        │                           │
  │  1. Click "Upload"        │                        │                           │
  │──────────────────────────>│                        │                           │
  │                           │  Navigate to /upload   │                           │
  │                           │                        │                           │
  │  2. Select/drop file      │                        │                           │
  │──────────────────────────>│                        │                           │
  │                           │  3. Validate file      │                           │
  │                           │  (type + size)         │                           │
  │                           │                        │                           │
  │                           │  4. createVideo()      │                           │
  │                           │───────────────────────>│                           │
  │                           │                        │  Create Video (DRAFT)     │
  │                           │                        │  Generate presigned URL   │
  │                           │  { videoId, uploadUrl } │                           │
  │                           │<───────────────────────│                           │
  │                           │                        │                           │
  │                           │  5. Upload file direct │                           │
  │                           │────────────────────────────────────────────────────>│
  │  6. Progress bar updates  │                        │                           │
  │<──────────────────────────│                        │                           │
  │                           │  7. Upload complete    │                           │
  │                           │<────────────────────────────────────────────────────│
  │                           │                        │                           │
  │                           │  8. confirmUpload()    │                           │
  │                           │───────────────────────>│                           │
  │                           │                        │  Update Video → PROCESSING│
  │                           │                        │  Create ProcessingJob     │
  │                           │                        │  Trigger transcoding      │
  │                           │                        │                           │
  │  9. Fill metadata (title, │                        │                           │
  │     description, tags)    │                        │                           │
  │──────────────────────────>│                        │                           │
  │                           │  10. updateVideo()     │                           │
  │                           │───────────────────────>│                           │
  │                           │                        │  Update title, desc, etc. │
```

### 1.3 Detailed Steps

**Step 1 — Navigate to upload page:**
- Creator clicks "Upload" in the dashboard sidebar → lands on `/dashboard/upload`
- Page requires `CREATOR` role minimum (enforced by dashboard layout)

**Step 2 — Select video file:**
- Drag-and-drop zone OR file picker button
- Visual: dashed border area with `Upload` icon (Lucide) and helper text

**Step 3 — Client-side validation (before any server call):**

| Check | Rule | Error Message |
|-------|------|---------------|
| File type | Must be one of: `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/webm` | "Unsupported format. Please upload MP4, MOV, AVI, or WebM." |
| File extension | `.mp4`, `.mov`, `.avi`, `.webm` | Same as above |
| File size | Maximum 2 GB (2,147,483,648 bytes) | "File too large. Maximum size is 2 GB." |
| File count | Single file only | "Please upload one video at a time." |

```typescript
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",    // .mov
  "video/x-msvideo",    // .avi
  "video/webm",
];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

function validateVideoFile(file: File): string | null {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    return "Unsupported format. Please upload MP4, MOV, AVI, or WebM.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large. Maximum size is 2 GB.";
  }
  return null; // valid
}
```

**Step 4 — Create video record + get upload URL:**

Call the `createUpload` Server Action which:
1. Verifies auth + `CREATOR` role
2. Creates a `Video` record with `status: DRAFT` and a placeholder `fileUrl`
3. Generates a presigned S3/R2 upload URL (or for MVP: returns the local upload API endpoint)
4. Returns `{ videoId, uploadUrl, fileKey }`

```typescript
// Server Action: src/app/actions/upload.ts
"use server";

import { requireRole } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import slugify from "slugify";
import { getUploadUrl } from "@/lib/storage";

export async function createUpload(input: {
  filename: string;
  contentType: string;
  fileSize: number;
}) {
  const user = await requireRole("CREATOR");

  // Generate storage key
  const timestamp = Date.now().toString(36);
  const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `videos/${timestamp}-${safeFilename}`;

  // Create Video record
  const tempSlug = `upload-${timestamp}`;
  const video = await prisma.video.create({
    data: {
      title: input.filename.replace(/\.[^.]+$/, ""), // filename without extension
      slug: tempSlug,
      fileUrl: fileKey,
      userId: user.id,
      status: "DRAFT",
    },
  });

  // Get presigned upload URL (or local endpoint for MVP)
  const { uploadUrl } = await getUploadUrl(fileKey, input.contentType);

  return {
    success: true as const,
    data: { videoId: video.id, uploadUrl, fileKey },
  };
}
```

**Step 5 — Direct upload to storage:**

The client uploads the file directly to S3/R2 using the presigned URL. This keeps video bytes off the Next.js server.

For MVP (local storage): Upload to `/api/upload/file` API route.

**Step 6 — Progress tracking:**

Use `XMLHttpRequest` for upload progress (fetch API does not support upload progress in all browsers):

```typescript
function uploadFileWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.send(file);
  });
}
```

**Step 7 — Upload complete:**

Storage returns success. Client proceeds to confirm.

**Step 8 — Confirm upload + trigger processing:**

```typescript
// Server Action: src/app/actions/upload.ts

export async function confirmUpload(videoId: string) {
  const user = await requireRole("CREATOR");

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.userId !== user.id) {
    return { success: false as const, error: "Video not found" };
  }

  // Update video status to PROCESSING
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "PROCESSING" },
  });

  // Create processing job
  const job = await prisma.processingJob.create({
    data: {
      videoId,
      status: "QUEUED",
    },
  });

  // Trigger transcoding pipeline (async — don't await)
  triggerTranscoding(job.id, video.fileUrl).catch((err) => {
    console.error(`[Processing] Failed to start job ${job.id}:`, err);
  });

  revalidatePath("/dashboard/videos");

  return { success: true as const };
}
```

**Step 9 — Fill in metadata:**

Creator fills in title, description, category, and tags. This can happen during upload (form is visible alongside the progress bar) or after upload completes. Metadata is saved via the `updateVideo` Server Action (defined in `SERVER_INTERACTIONS.md`).

**Step 10 — Save metadata:**

The `updateVideo` action updates the Video record. The slug is regenerated from the title, replacing the temporary upload slug.

### 1.4 Upload Page UI States

| State | Visual |
|-------|--------|
| **Empty** | Dashed drop zone with Upload icon, "Drag & drop video file or click to browse", "MP4, WebM, MOV — max 2GB" |
| **File selected** | File name + size shown, "Remove" button, drop zone collapses |
| **Uploading** | Progress bar (percentage + bytes transferred), "Cancel" button, metadata form visible |
| **Upload complete** | Green checkmark, "Processing..." badge, metadata form fully enabled |
| **Processing** | Animated spinner or progress bar, "Your video is being processed" message |
| **Ready** | "Video ready! Publish now or save as draft" with action buttons |
| **Error** | Red error message with "Try again" button |

### 1.5 Upload API Route (MVP — Local Storage)

**File:** `src/app/api/upload/file/route.ts`

For MVP, this API route receives the video file and saves it to `public/uploads/`. In production, this route is replaced by S3/R2 presigned URL uploads.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user || !hasRole(session.user.role, "CREATOR")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get the file key from query params
    const fileKey = request.nextUrl.searchParams.get("key");
    if (!fileKey) {
      return NextResponse.json({ error: "Missing file key" }, { status: 400 });
    }

    // Read the request body as a buffer
    const buffer = Buffer.from(await request.arrayBuffer());

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", path.dirname(fileKey));
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(process.cwd(), "public", "uploads", fileKey);
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, key: fileKey });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// Allow large request bodies for video uploads
export const config = {
  api: {
    bodyParser: false,
  },
};
```

**Note:** For MVP local storage, the `uploadFileWithProgress` function in Step 6 sends the PUT request to `/api/upload/file?key={fileKey}`. For production S3/R2, it sends the PUT directly to the presigned URL.

---

## 2. Transcoding Pipeline

### 2.1 Overview

After a video is uploaded, the transcoding pipeline:
1. Extracts metadata (duration, resolution, codec) using `ffprobe`
2. Generates thumbnail images at key timestamps
3. Transcodes the video to HLS (HTTP Live Streaming) format with adaptive bitrate variants
4. Uploads processed files to storage
5. Updates the database with results

### 2.2 Prerequisites

**FFmpeg** must be installed on the processing server:

```bash
# Windows (via chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

### 2.3 Processing Steps

```
ProcessingJob created (QUEUED)
        │
        ▼
┌──────────────────────┐
│ 1. Pick up job       │  Set status → PROCESSING, startedAt → now()
│    Update progress 0%│
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 2. Download source   │  Download from storage to temp directory
│    Update progress 5%│
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 3. Extract metadata  │  ffprobe → duration, resolution, codec, bitrate
│    Update progress 10%│
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 4. Generate          │  3 thumbnails at 25%, 50%, 75% of duration
│    thumbnails        │  Auto-select first as default
│    Update progress 20%│
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 5. Transcode to HLS  │  Adaptive bitrate:
│                      │    360p (800kbps)  — always
│    Update progress   │    480p (1400kbps) — always
│    20% → 90%         │    720p (2800kbps) — always
│                      │    1080p (5000kbps) — only if source >= 1080p
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 6. Upload processed  │  Upload HLS segments + playlists + thumbnails
│    files to storage  │  to S3/R2 (or local public/uploads/)
│    Update progress 95%│
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 7. Update database   │  Video: hlsUrl, thumbnailUrl, duration
│    Set progress 100% │  ProcessingJob: status → COMPLETED
│    Set completedAt   │
└──────────────────────┘
```

### 2.4 Metadata Extraction (ffprobe)

```typescript
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

interface VideoMetadata {
  duration: number;      // seconds
  width: number;
  height: number;
  codec: string;
  bitrate: number;       // bps
  fps: number;
  hasAudio: boolean;
}

async function extractMetadata(filePath: string): Promise<VideoMetadata> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);

  const probe = JSON.parse(stdout);
  const videoStream = probe.streams.find(
    (s: { codec_type: string }) => s.codec_type === "video"
  );
  const audioStream = probe.streams.find(
    (s: { codec_type: string }) => s.codec_type === "audio"
  );

  if (!videoStream) {
    throw new Error("No video stream found in file");
  }

  return {
    duration: Math.round(parseFloat(probe.format.duration)),
    width: videoStream.width,
    height: videoStream.height,
    codec: videoStream.codec_name,
    bitrate: parseInt(probe.format.bit_rate) || 0,
    fps: eval(videoStream.r_frame_rate) || 30, // "30/1" → 30
    hasAudio: !!audioStream,
  };
}
```

### 2.5 Thumbnail Generation

Generate 3 thumbnail options at 25%, 50%, and 75% of the video duration. Auto-select the first (25%) as the default thumbnail.

```typescript
async function generateThumbnails(
  inputPath: string,
  outputDir: string,
  duration: number
): Promise<string[]> {
  const timestamps = [0.25, 0.5, 0.75].map((pct) =>
    Math.round(duration * pct)
  );

  const thumbnailPaths: string[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const outputPath = path.join(outputDir, `thumb_${i}.jpg`);
    await execFileAsync("ffmpeg", [
      "-ss", timestamps[i].toString(),
      "-i", inputPath,
      "-vframes", "1",
      "-q:v", "2",           // JPEG quality (2 = high quality)
      "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2",
      "-y",
      outputPath,
    ]);
    thumbnailPaths.push(outputPath);
  }

  return thumbnailPaths;
}
```

**Thumbnail specifications:**
- Format: JPEG
- Resolution: 1280x720 (padded to maintain aspect ratio)
- Quality: High (`-q:v 2`)
- Naming: `thumb_0.jpg`, `thumb_1.jpg`, `thumb_2.jpg`

### 2.6 HLS Transcoding

#### Quality Variants

| Label | Resolution | Video Bitrate | Audio Bitrate | Conditions |
|-------|-----------|---------------|---------------|------------|
| 360p | 640x360 | 800 kbps | 96 kbps | Always generated |
| 480p | 854x480 | 1,400 kbps | 128 kbps | Always generated |
| 720p | 1280x720 | 2,800 kbps | 128 kbps | Always generated |
| 1080p | 1920x1080 | 5,000 kbps | 192 kbps | Only if source >= 1080p |

**Rules:**
- Only generate quality variants at or below the source resolution
- If source is 720p, generate 360p, 480p, 720p (skip 1080p)
- If source is 480p, generate 360p, 480p (skip 720p, 1080p)
- Minimum: always generate at least 360p

#### HLS Parameters

| Parameter | Value | Reason |
|-----------|-------|--------|
| Segment duration | 6 seconds (`-hls_time 6`) | Good balance of seek granularity vs file count |
| Playlist type | VOD (`-hls_playlist_type vod`) | Complete playlist for on-demand content |
| Segment filename pattern | `segment_%03d.ts` | Numbered .ts segments |
| Video codec | H.264 (`libx264`) | Universal browser support |
| Audio codec | AAC (`aac`) | Universal browser support |
| Preset | `fast` | Good quality-to-speed ratio for server-side encoding |
| CRF | 22 | Good visual quality with reasonable file size |

#### FFmpeg Command — Multi-Quality

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3]; \
    [v1]scale=1280:720[v720]; \
    [v2]scale=854:480[v480]; \
    [v3]scale=640:360[v360]" \
  -map "[v720]" -c:v:0 libx264 -preset fast -crf 22 -b:v:0 2800k -maxrate:v:0 3080k -bufsize:v:0 5600k \
  -map "[v480]" -c:v:1 libx264 -preset fast -crf 22 -b:v:1 1400k -maxrate:v:1 1540k -bufsize:v:1 2800k \
  -map "[v360]" -c:v:2 libx264 -preset fast -crf 22 -b:v:2 800k -maxrate:v:2 880k -bufsize:v:2 1600k \
  -map 0:a -c:a aac -b:a 128k \
  -map 0:a -c:a aac -b:a 128k \
  -map 0:a -c:a aac -b:a 96k \
  -f hls \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_playlist_type vod \
  -hls_segment_filename "output/%v/segment_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  output/%v/playlist.m3u8
```

**With 1080p (when source >= 1080p):**

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=4[v1][v2][v3][v4]; \
    [v1]scale=1920:1080[v1080]; \
    [v2]scale=1280:720[v720]; \
    [v3]scale=854:480[v480]; \
    [v4]scale=640:360[v360]" \
  -map "[v1080]" -c:v:0 libx264 -preset fast -crf 22 -b:v:0 5000k -maxrate:v:0 5500k -bufsize:v:0 10000k \
  -map "[v720]"  -c:v:1 libx264 -preset fast -crf 22 -b:v:1 2800k -maxrate:v:1 3080k -bufsize:v:1 5600k \
  -map "[v480]"  -c:v:2 libx264 -preset fast -crf 22 -b:v:2 1400k -maxrate:v:2 1540k -bufsize:v:2 2800k \
  -map "[v360]"  -c:v:3 libx264 -preset fast -crf 22 -b:v:3 800k -maxrate:v:3 880k -bufsize:v:3 1600k \
  -map 0:a -c:a aac -b:a 192k \
  -map 0:a -c:a aac -b:a 128k \
  -map 0:a -c:a aac -b:a 128k \
  -map 0:a -c:a aac -b:a 96k \
  -f hls \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_playlist_type vod \
  -hls_segment_filename "output/%v/segment_%03d.ts" \
  -master_pl_name master.m3u8 \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3" \
  output/%v/playlist.m3u8
```

#### MVP Simplification — Single Quality (720p)

For initial MVP development, start with single-quality 720p transcoding to simplify the pipeline. Add multi-quality in a later pass.

```bash
ffmpeg -i input.mp4 \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -preset fast -crf 22 \
  -c:a aac -b:a 128k \
  -f hls \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_playlist_type vod \
  -hls_segment_filename "output/720p/segment_%03d.ts" \
  output/720p/playlist.m3u8
```

For MVP single-quality, the `master.m3u8` is a simple redirect to the 720p playlist:

```m3u8
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720
720p/playlist.m3u8
```

### 2.7 Transcoding Implementation

```typescript
// src/lib/transcoding.ts

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { mkdir } from "fs/promises";
import prisma from "@/lib/prisma";
import { uploadToStorage, downloadFromStorage } from "@/lib/storage";

const execFileAsync = promisify(execFile);

interface TranscodeOptions {
  jobId: string;
  fileKey: string; // S3/R2 key or local path
}

export async function triggerTranscoding(jobId: string, fileKey: string) {
  // For MVP: run in-process as async function
  // For production: enqueue to BullMQ / SQS / etc.
  processVideo({ jobId, fileKey });
}

async function processVideo({ jobId, fileKey }: TranscodeOptions) {
  const tempDir = path.join(process.cwd(), "tmp", jobId);
  const outputDir = path.join(tempDir, "output");

  try {
    // 1. Start processing
    await updateJob(jobId, { status: "PROCESSING", progress: 0, startedAt: new Date() });

    // 2. Download source file to temp directory
    await mkdir(tempDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    const inputPath = path.join(tempDir, "source" + path.extname(fileKey));
    await downloadFromStorage(fileKey, inputPath);
    await updateJob(jobId, { progress: 5 });

    // 3. Extract metadata
    const metadata = await extractMetadata(inputPath);
    await updateJob(jobId, { progress: 10 });

    // 4. Generate thumbnails
    const thumbDir = path.join(tempDir, "thumbnails");
    await mkdir(thumbDir, { recursive: true });
    const thumbnailPaths = await generateThumbnails(inputPath, thumbDir, metadata.duration);
    await updateJob(jobId, { progress: 20 });

    // 5. Determine quality variants based on source resolution
    const variants = getQualityVariants(metadata.width, metadata.height);

    // 6. Transcode to HLS (MVP: single 720p)
    await transcodeToHls(inputPath, outputDir, variants, metadata.hasAudio);
    await updateJob(jobId, { progress: 90 });

    // 7. Upload processed files to storage
    const job = await prisma.processingJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("Job not found");

    const videoId = job.videoId;
    const storagePrefix = `videos/${videoId}/hls`;
    const thumbPrefix = `videos/${videoId}`;

    // Upload thumbnails
    const thumbnailKeys: string[] = [];
    for (let i = 0; i < thumbnailPaths.length; i++) {
      const key = `${thumbPrefix}/thumb_${i}.jpg`;
      await uploadToStorage(thumbnailPaths[i], key);
      thumbnailKeys.push(key);
    }

    // Upload HLS files (all files in output directory, recursively)
    await uploadDirectoryToStorage(outputDir, storagePrefix);
    await updateJob(jobId, { progress: 95 });

    // 8. Update database
    const hlsUrl = `${storagePrefix}/master.m3u8`;
    const thumbnailUrl = thumbnailKeys[0]; // Auto-select first thumbnail (25% mark)

    await prisma.video.update({
      where: { id: videoId },
      data: {
        hlsUrl,
        thumbnailUrl,
        duration: metadata.duration,
        // Keep status as PROCESSING — creator publishes manually
        // Or set to DRAFT to signal "ready for publishing"
        status: "DRAFT",
      },
    });

    await updateJob(jobId, {
      status: "COMPLETED",
      progress: 100,
      completedAt: new Date(),
    });

    console.log(`[Processing] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[Processing] Job ${jobId} failed:`, error);

    await updateJob(jobId, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      completedAt: new Date(),
    });
  } finally {
    // Cleanup temp directory
    // await rm(tempDir, { recursive: true, force: true });
    // NOTE: Keep temp files in development for debugging. Enable cleanup in production.
  }
}

async function updateJob(jobId: string, data: {
  status?: "PROCESSING" | "COMPLETED" | "FAILED";
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}) {
  await prisma.processingJob.update({
    where: { id: jobId },
    data,
  });
}
```

### 2.8 Quality Variant Selection

```typescript
interface QualityVariant {
  label: string;
  width: number;
  height: number;
  videoBitrate: string;    // e.g., "2800k"
  maxRate: string;         // e.g., "3080k"
  bufSize: string;         // e.g., "5600k"
  audioBitrate: string;    // e.g., "128k"
}

const ALL_VARIANTS: QualityVariant[] = [
  { label: "1080p", width: 1920, height: 1080, videoBitrate: "5000k", maxRate: "5500k", bufSize: "10000k", audioBitrate: "192k" },
  { label: "720p",  width: 1280, height: 720,  videoBitrate: "2800k", maxRate: "3080k", bufSize: "5600k",  audioBitrate: "128k" },
  { label: "480p",  width: 854,  height: 480,  videoBitrate: "1400k", maxRate: "1540k", bufSize: "2800k",  audioBitrate: "128k" },
  { label: "360p",  width: 640,  height: 360,  videoBitrate: "800k",  maxRate: "880k",  bufSize: "1600k",  audioBitrate: "96k" },
];

function getQualityVariants(sourceWidth: number, sourceHeight: number): QualityVariant[] {
  return ALL_VARIANTS.filter(
    (v) => v.height <= Math.max(sourceHeight, 360) // Always include at least 360p
  );
}
```

### 2.9 Error Handling in Processing

| Error | Handling |
|-------|---------|
| FFmpeg not found | Job fails with "FFmpeg is not installed on this server" |
| Corrupt/unreadable file | Job fails with "Unable to read video file" |
| Unsupported codec | Job fails with "Video codec not supported" |
| Disk space exhaustion | Job fails with "Insufficient disk space" |
| FFmpeg crash | Job fails with FFmpeg stderr output |
| Storage upload failure | Job fails with "Failed to upload processed files" |

All failures:
1. Set `ProcessingJob.status` → `FAILED`
2. Set `ProcessingJob.errorMessage` with descriptive message
3. Set `ProcessingJob.completedAt` to current time
4. Video remains in `PROCESSING` status (creator can retry or delete)
5. Log full error with stack trace server-side

---

## 3. Storage Structure

### 3.1 S3/R2 Bucket Layout

```
{bucket}/
├── videos/
│   ├── {videoId}/
│   │   ├── original.mp4              # Original uploaded file (preserved)
│   │   ├── thumb_0.jpg               # Thumbnail at 25% duration
│   │   ├── thumb_1.jpg               # Thumbnail at 50% duration
│   │   ├── thumb_2.jpg               # Thumbnail at 75% duration
│   │   └── hls/
│   │       ├── master.m3u8           # HLS master playlist (adaptive)
│   │       ├── 0/                    # First variant (highest quality)
│   │       │   ├── playlist.m3u8     # Variant playlist
│   │       │   ├── segment_000.ts
│   │       │   ├── segment_001.ts
│   │       │   └── ...
│   │       ├── 1/                    # Second variant
│   │       │   ├── playlist.m3u8
│   │       │   ├── segment_000.ts
│   │       │   └── ...
│   │       ├── 2/                    # Third variant
│   │       │   ├── playlist.m3u8
│   │       │   ├── segment_000.ts
│   │       │   └── ...
│   │       └── 3/                    # Fourth variant (lowest, if applicable)
│   │           ├── playlist.m3u8
│   │           ├── segment_000.ts
│   │           └── ...
│   ├── {videoId2}/
│   │   └── ...
│   └── ...
└── avatars/
    ├── {userId}/
    │   └── avatar.jpg
    └── ...
```

### 3.2 MVP Local Storage Layout

For MVP development without S3/R2, files are stored under `public/uploads/`:

```
public/uploads/
├── videos/
│   ├── {videoId}/
│   │   ├── original.mp4
│   │   ├── thumb_0.jpg
│   │   ├── thumb_1.jpg
│   │   ├── thumb_2.jpg
│   │   └── hls/
│   │       ├── master.m3u8
│   │       └── 720p/
│   │           ├── playlist.m3u8
│   │           ├── segment_000.ts
│   │           └── ...
└── avatars/
    └── ...
```

**Accessing local files:** Files under `public/` are served at the root URL:
- `public/uploads/videos/abc123/hls/master.m3u8` → `/uploads/videos/abc123/hls/master.m3u8`

### 3.3 Database Path Values

The database stores **relative storage keys** (not full URLs). Full URLs are constructed at runtime using the CDN/storage base URL.

```typescript
// Database values (relative keys)
{
  fileUrl: "videos/clx1abc123/original.mp4",
  thumbnailUrl: "videos/clx1abc123/thumb_0.jpg",
  hlsUrl: "videos/clx1abc123/hls/master.m3u8"
}
```

### 3.4 Storage Utility

**File:** `src/lib/storage.ts`

Abstraction layer that switches between local and S3/R2 storage based on environment:

```typescript
import path from "path";
import { writeFile, readFile, mkdir, cp } from "fs/promises";

const STORAGE_MODE = process.env.STORAGE_MODE || "local"; // "local" | "s3"
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// ─── Get full URL for a storage key ─────────────────────

export function getStorageUrl(key: string): string {
  if (STORAGE_MODE === "s3") {
    const cdnBase = process.env.CDN_BASE_URL!;
    return `${cdnBase}/${key}`;
  }
  // Local: files are under public/uploads/, served at /uploads/
  return `/uploads/${key}`;
}

// ─── Get presigned upload URL (or local endpoint) ────────

export async function getUploadUrl(
  key: string,
  contentType: string
): Promise<{ uploadUrl: string }> {
  if (STORAGE_MODE === "s3") {
    // TODO: Generate presigned S3/R2 PUT URL
    // const command = new PutObjectCommand({ Bucket, Key: key, ContentType: contentType });
    // const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    // return { uploadUrl };
    throw new Error("S3 storage not yet implemented");
  }

  // Local: return the local upload API endpoint
  return {
    uploadUrl: `/api/upload/file?key=${encodeURIComponent(key)}`,
  };
}

// ─── Download file from storage to local path ────────────

export async function downloadFromStorage(
  key: string,
  destPath: string
): Promise<void> {
  if (STORAGE_MODE === "s3") {
    // TODO: Download from S3/R2
    throw new Error("S3 storage not yet implemented");
  }

  const sourcePath = path.join(LOCAL_UPLOAD_DIR, key);
  const buffer = await readFile(sourcePath);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, buffer);
}

// ─── Upload file to storage ──────────────────────────────

export async function uploadToStorage(
  localPath: string,
  key: string
): Promise<void> {
  if (STORAGE_MODE === "s3") {
    // TODO: Upload to S3/R2
    throw new Error("S3 storage not yet implemented");
  }

  const destPath = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(destPath), { recursive: true });
  const buffer = await readFile(localPath);
  await writeFile(destPath, buffer);
}

// ─── Upload entire directory to storage ──────────────────

export async function uploadDirectoryToStorage(
  localDir: string,
  keyPrefix: string
): Promise<void> {
  if (STORAGE_MODE === "s3") {
    // TODO: Recursively upload directory to S3/R2
    throw new Error("S3 storage not yet implemented");
  }

  const destDir = path.join(LOCAL_UPLOAD_DIR, keyPrefix);
  await mkdir(destDir, { recursive: true });
  await cp(localDir, destDir, { recursive: true });
}

// ─── Delete file from storage ────────────────────────────

export async function deleteFromStorage(key: string): Promise<void> {
  if (STORAGE_MODE === "s3") {
    // TODO: Delete from S3/R2
    throw new Error("S3 storage not yet implemented");
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  const { unlink } = await import("fs/promises");
  await unlink(filePath).catch(() => {}); // Ignore if file doesn't exist
}
```

### 3.5 Storage Cleanup on Video Deletion

When a video is deleted, all associated storage files must be cleaned up:

```typescript
// In deleteVideo server action (extend the existing one)
// TODO: Implement for production
// 1. Delete original file: deleteFromStorage(video.fileUrl)
// 2. Delete HLS directory: deleteDirectoryFromStorage(`videos/${videoId}/hls/`)
// 3. Delete thumbnails: deleteFromStorage(`videos/${videoId}/thumb_*.jpg`)
```

For MVP, local files in `public/uploads/` accumulate and require manual cleanup. Add a TODO for automated cleanup.

---

## 4. Playback

### 4.1 HLS Player (hls.js)

The VideoPlayer component uses `hls.js` for adaptive bitrate HLS playback. Native HLS support in Safari means `hls.js` is only loaded as a fallback on other browsers.

**File:** `src/components/video/VideoPlayer.tsx`

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { getStorageUrl } from "@/lib/storage";

interface VideoPlayerProps {
  videoId: string;
  hlsUrl: string | null;  // Relative storage key
  thumbnailUrl: string | null;
  title: string;
}

export function VideoPlayer({ videoId, hlsUrl, thumbnailUrl, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    const src = getStorageUrl(hlsUrl);

    // Safari has native HLS support
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => setIsLoading(false));
      return;
    }

    // Other browsers: use hls.js
    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: -1,           // Auto quality selection
        capLevelToPlayerSize: true, // Don't load 1080p on small screens
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad(); // Retry
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError(); // Attempt recovery
              break;
            default:
              setError("Failed to load video");
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      setError("Your browser does not support HLS video playback.");
    }
  }, [hlsUrl]);

  // View count increment — once on first play
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let counted = false;
    function handlePlay() {
      if (!counted) {
        counted = true;
        fetch(`/api/videos/${videoId}/views`, { method: "POST" });
      }
    }

    video.addEventListener("play", handlePlay);
    return () => video.removeEventListener("play", handlePlay);
  }, [videoId]);

  const posterUrl = thumbnailUrl ? getStorageUrl(thumbnailUrl) : undefined;

  return (
    <div className="relative aspect-video w-full bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-white" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        poster={posterUrl}
        aria-label={title}
      />
    </div>
  );
}
```

### 4.2 HLS.js Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| `startLevel` | `-1` (auto) | Let hls.js pick the best quality based on bandwidth |
| `capLevelToPlayerSize` | `true` | Don't load 1080p on a 360px-wide mobile player |
| `maxBufferLength` | `30` | Buffer 30 seconds ahead |
| `maxMaxBufferLength` | `60` | Maximum buffer ceiling of 60 seconds |
| `enableWorker` | `true` (default) | Use Web Worker for demuxing — keeps UI thread smooth |

### 4.3 Quality Switching

hls.js handles adaptive quality switching automatically based on network bandwidth. Manual quality selection can be added via a custom UI control:

```typescript
// Get available quality levels
const levels = hlsRef.current?.levels; // Array of quality levels

// Set specific quality level (index into levels array)
hlsRef.current!.currentLevel = levelIndex; // -1 for auto

// Get current quality info
const currentLevel = hlsRef.current?.currentLevel;
const level = hlsRef.current?.levels[currentLevel];
// level.height → 720, level.width → 1280, level.bitrate → 2800000
```

**MVP:** Auto quality selection only. Manual quality picker is a post-MVP enhancement.

### 4.4 Fallback for Unprocessed Videos

If a video has no `hlsUrl` (still processing or processing failed), show a placeholder:

```typescript
if (!hlsUrl) {
  return (
    <div className="relative aspect-video w-full bg-zinc-900 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500 mx-auto" />
        <p className="text-sm text-zinc-400">Video is being processed...</p>
      </div>
    </div>
  );
}
```

### 4.5 Master Playlist Format

The generated `master.m3u8` for multi-quality looks like:

```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
0/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
1/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1528000,RESOLUTION=854x480,CODECS="avc1.64001e,mp4a.40.2"
2/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360,CODECS="avc1.640015,mp4a.40.2"
3/playlist.m3u8
```

---

## 5. Processing Status & UI Feedback

### 5.1 Status Flow

```
              createUpload()         confirmUpload()        Processing completes
    ○ ──────────→ DRAFT ──────────→ PROCESSING ──────────→ DRAFT (ready)
                    │                    │                      │
                    │                    │                      │ publishVideo()
                    │                    │                      ▼
                    │                    │                  PUBLISHED
                    │                    │
                    │                    │ Processing fails
                    │                    ▼
                    │              PROCESSING (failed)
                    │                    │
                    │                    │ Creator retries or deletes
                    │                    ▼
                    │                  DRAFT
                    │
                    │ Creator deletes
                    ▼
                  (deleted)
```

### 5.2 ProcessingJob Status Display

| Job Status | Progress | Video Status | UI Display |
|-----------|----------|-------------|------------|
| `QUEUED` | 0% | `PROCESSING` | "Queued for processing..." with spinner |
| `PROCESSING` | 1-99% | `PROCESSING` | Progress bar with percentage |
| `COMPLETED` | 100% | `DRAFT` | "Ready to publish" with green check |
| `FAILED` | — | `PROCESSING` | "Processing failed" with error message + retry button |

### 5.3 Polling for Processing Status

The upload page and dashboard videos table should poll for processing status updates:

```typescript
"use client";

import { useEffect, useState } from "react";

export function useProcessingStatus(videoId: string, initialStatus: string) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (status !== "PROCESSING") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/videos/${videoId}/processing-status`);
      const data = await res.json();

      setProgress(data.progress);

      if (data.jobStatus === "COMPLETED") {
        setStatus("DRAFT"); // Ready to publish
        clearInterval(interval);
      } else if (data.jobStatus === "FAILED") {
        setStatus("FAILED");
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [videoId, status]);

  return { status, progress };
}
```

### 5.4 Processing Status API Route

**File:** `src/app/api/videos/[id]/processing-status/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const job = await prisma.processingJob.findFirst({
    where: { videoId: id },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      progress: true,
      errorMessage: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "No processing job found" }, { status: 404 });
  }

  return NextResponse.json({
    jobStatus: job.status,
    progress: job.progress,
    errorMessage: job.errorMessage,
  });
}
```

---

## 6. Validation & Security

### 6.1 Client-Side Validation (before upload)

```typescript
// src/lib/validations/upload.ts
import { z } from "zod";

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
] as const;

export const ACCEPTED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"] as const;

export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

export const uploadFileSchema = z.object({
  filename: z.string().min(1, { error: "Filename is required" }),
  contentType: z.enum(ACCEPTED_VIDEO_TYPES, {
    error: "Unsupported format. Please upload MP4, MOV, AVI, or WebM.",
  }),
  fileSize: z.number()
    .max(MAX_FILE_SIZE, { error: "File too large. Maximum size is 2 GB." }),
});
```

### 6.2 Server-Side Validation

- Re-validate file type and size in the upload API route
- Verify auth session and `CREATOR` role before generating presigned URLs
- Verify video ownership in `confirmUpload` and all video mutations
- Validate that the presigned URL key matches the expected pattern

### 6.3 Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Malicious file upload | Client + server MIME type validation. FFprobe validation during processing (rejects non-video files). |
| File size abuse | Client-side 2GB check + S3/R2 presigned URL with content-length condition. For local MVP: check `Content-Length` header. |
| Path traversal | Storage keys are generated server-side with sanitized filenames. Never use user-provided paths directly. |
| Presigned URL abuse | URLs expire after 1 hour. Each URL is bound to a specific key and content type. |
| Processing DoS | One processing job per video. Rate limit uploads per user (post-MVP). |
| Storage quota | Monitor total storage per user (post-MVP). For MVP, no per-user limit. |
| Temp file cleanup | Processing temp files are cleaned up after job completion. Failed jobs clean up on retry. |

---

## 7. Environment Variables

Add these to `.env`:

```env
# Storage mode: "local" (MVP) or "s3" (production)
STORAGE_MODE="local"

# S3/R2 Configuration (production only)
# S3_ENDPOINT="https://xxxxx.r2.cloudflarestorage.com"
# S3_BUCKET="video-platform"
# S3_REGION="auto"
# S3_ACCESS_KEY_ID="your-access-key"
# S3_SECRET_ACCESS_KEY="your-secret-key"

# CDN base URL for serving files (production only)
# CDN_BASE_URL="https://cdn.example.com"

# Webhook secret for processing callbacks (production only)
# PROCESSING_WEBHOOK_SECRET="your-webhook-secret"

# FFmpeg path (if not in system PATH)
# FFMPEG_PATH="/usr/bin/ffmpeg"
# FFPROBE_PATH="/usr/bin/ffprobe"
```

---

## 8. Implementation Files

### 8.1 File Map

```
video-platform/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       └── upload/
│   │   │           └── page.tsx           # Upload page (renders VideoUpload)
│   │   ├── api/
│   │   │   ├── upload/
│   │   │   │   ├── route.ts              # Presigned URL generation
│   │   │   │   └── file/
│   │   │   │       └── route.ts          # MVP local file upload endpoint
│   │   │   └── videos/
│   │   │       └── [id]/
│   │   │           ├── views/
│   │   │           │   └── route.ts      # View count increment
│   │   │           └── processing-status/
│   │   │               └── route.ts      # Processing status polling
│   │   └── actions/
│   │       └── upload.ts                 # createUpload, confirmUpload actions
│   ├── components/
│   │   └── video/
│   │       ├── VideoPlayer.tsx           # HLS player (Client Component)
│   │       ├── VideoUpload.tsx           # Upload UI with drag-drop (Client Component)
│   │       └── ProcessingStatus.tsx      # Processing progress display (Client Component)
│   ├── hooks/
│   │   └── useProcessingStatus.ts        # Polling hook for processing updates
│   └── lib/
│       ├── storage.ts                    # Storage abstraction (local/S3)
│       ├── transcoding.ts               # FFmpeg transcoding pipeline
│       └── validations/
│           └── upload.ts                 # Upload file validation schemas
├── public/
│   └── uploads/                          # MVP local file storage (gitignored)
│       ├── videos/
│       └── avatars/
└── tmp/                                  # Transcoding temp directory (gitignored)
```

### 8.2 API Routes Index (additions from this spec)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/upload` | POST | Generate presigned upload URL | Yes (CREATOR+) |
| `/api/upload/file` | PUT | MVP local file upload endpoint | Yes (CREATOR+) |
| `/api/videos/[id]/processing-status` | GET | Poll processing job status | No (public, video ID required) |

### 8.3 Server Actions Index (additions from this spec)

| Action | File | Auth | Min Role |
|--------|------|------|----------|
| `createUpload` | `actions/upload.ts` | Yes | CREATOR |
| `confirmUpload` | `actions/upload.ts` | Yes | CREATOR |

---

## 9. MVP Simplifications

### 9.1 What's Simplified for MVP

| Area | MVP Approach | Production Approach |
|------|-------------|-------------------|
| **Storage** | Local filesystem (`public/uploads/`) | S3/R2 with presigned URLs |
| **Transcoding** | Single quality (720p) only | Multi-quality adaptive (360p-1080p) |
| **Job queue** | In-process async function | BullMQ with Redis / AWS SQS |
| **Progress tracking** | Polling every 3 seconds | WebSocket or Server-Sent Events |
| **Thumbnails** | 3 auto-generated, first auto-selected | Creator chooses from 3 + custom upload |
| **Upload limits** | No per-user quotas | Per-user storage quota + rate limiting |
| **Retry** | Manual retry (delete + re-upload) | Automatic retry with exponential backoff |
| **CDN** | Next.js serves from `public/` | Cloudflare R2 + CDN |
| **Cleanup** | Manual temp cleanup | Automatic cleanup via cron/lifecycle rules |
| **Resumable uploads** | Not supported | tus protocol for resumable uploads |

### 9.2 Migration Path to Production

When moving from MVP local storage to S3/R2:

1. **Install AWS SDK:** `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. **Update `src/lib/storage.ts`:** Implement the S3 TODO stubs with real SDK calls
3. **Set `STORAGE_MODE=s3`** and configure S3 environment variables
4. **Update `getStorageUrl`** to return CDN URLs instead of `/uploads/` paths
5. **Remove the local upload API route** (`/api/upload/file`) — presigned URLs bypass the server entirely
6. **Add S3 lifecycle rules** for automatic temp file cleanup

No changes needed in:
- Components (VideoPlayer, VideoUpload)
- Server Actions (createUpload, confirmUpload)
- Processing pipeline (uses storage abstraction)
- Database schema

### 9.3 Gitignore Additions

Add to `.gitignore`:

```
# Video uploads (MVP local storage)
public/uploads/

# Transcoding temp files
tmp/
```

---

## Appendix: HLS Master Playlist Reference

### Single Quality (MVP)

```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720
720p/playlist.m3u8
```

### Multi-Quality (Production)

```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
0/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
1/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1528000,RESOLUTION=854x480,CODECS="avc1.64001e,mp4a.40.2"
2/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=896000,RESOLUTION=640x360,CODECS="avc1.640015,mp4a.40.2"
3/playlist.m3u8
```

### Variant Playlist Example (720p)

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:6.006000,
segment_000.ts
#EXTINF:6.006000,
segment_001.ts
#EXTINF:6.006000,
segment_002.ts
#EXTINF:4.171167,
segment_003.ts

#EXT-X-ENDLIST
```
