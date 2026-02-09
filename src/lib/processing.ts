import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { configureFfmpeg } from "@/lib/ffmpeg";
import prisma from "@/lib/prisma";

configureFfmpeg();
import {
  generateUploadPath,
  getPublicUrl,
  getVideoDuration,
  getVideoResolution,
} from "@/lib/upload";

// TODO: Replace with cloud transcoding service (AWS MediaConvert, Mux, etc.) in production

/**
 * Transcode a video to 720p MP4 (H.264 + AAC).
 * Output is optimized for web streaming with faststart.
 */
export function transcodeVideo(
  inputPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .audioBitrate("128k")
      .outputOptions([
        "-preset medium",
        "-crf 23",
        "-vf scale=-2:720",
        "-movflags +faststart",
      ])
      .format("mp4")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

/**
 * Extract a thumbnail from a video at 25% of its duration.
 * Output as JPEG with 1280px width maintaining aspect ratio.
 */
export function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timestamp?: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const outputDir = path.dirname(outputPath);
    const outputFilename = path.basename(outputPath);

    ffmpeg(inputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .screenshots({
        timestamps: [timestamp ?? "25%"],
        filename: outputFilename,
        folder: outputDir,
        size: "1280x?",
      });
  });
}

/**
 * Main processing pipeline. Runs transcoding and thumbnail generation,
 * then updates the database records.
 *
 * This is intended to be called fire-and-forget from the upload route.
 */
export async function processVideo(
  videoId: string,
  jobId: string
): Promise<void> {
  try {
    // 1. Update job status to PROCESSING
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    // 2. Get video record
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new Error(`Video not found: ${videoId}`);
    }

    const rawPath = video.fileUrl; // absolute path to raw file

    // 3. Transcode video
    const processedPath = await generateUploadPath(
      path.basename(rawPath, path.extname(rawPath)) + ".mp4",
      "processed"
    );

    await prisma.processingJob.update({
      where: { id: jobId },
      data: { progress: 10 },
    });

    await transcodeVideo(rawPath, processedPath);

    await prisma.processingJob.update({
      where: { id: jobId },
      data: { progress: 70 },
    });

    // 4. Generate thumbnail
    const thumbnailPath = await generateUploadPath(
      path.basename(rawPath, path.extname(rawPath)) + ".jpg",
      "thumbnails"
    );

    await generateThumbnail(rawPath, thumbnailPath);

    await prisma.processingJob.update({
      where: { id: jobId },
      data: { progress: 85 },
    });

    // 5. Get duration and resolution from processed file
    const duration = await getVideoDuration(processedPath);
    const resolution = await getVideoResolution(processedPath);

    // 6. Update Video record
    await prisma.video.update({
      where: { id: videoId },
      data: {
        fileUrl: getPublicUrl(processedPath),
        thumbnailUrl: getPublicUrl(thumbnailPath),
        duration,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    // 7. Update ProcessingJob to COMPLETED
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        progress: 100,
        resolution: `${resolution.width}x${resolution.height}`,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[Processing] Failed for video ${videoId}:`, error);

    // Update job to FAILED
    await prisma.processingJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown processing error",
        },
      })
      .catch(console.error);

    // Revert video status to DRAFT
    await prisma.video
      .update({
        where: { id: videoId },
        data: { status: "DRAFT" },
      })
      .catch(console.error);
  }
}
