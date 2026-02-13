import ffmpeg from "fluent-ffmpeg";
const isWindows = process.platform === "win32";

// Configure fluent-ffmpeg with explicit paths to FFmpeg binaries.
// This avoids relying on PATH which may not be updated in the current shell/process.
// TODO: Use environment variables (FFMPEG_PATH, FFPROBE_PATH) in production

const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  (isWindows
    ? "D:\\ffmpeg\\bin\\ffmpeg.exe"
    : "/usr/bin/ffmpeg");

const FFPROBE_PATH =
  process.env.FFPROBE_PATH ||
  (isWindows
    ? "D:\\ffmpeg\\bin\\ffprobe.exe"
    : "/usr/bin/ffprobe");

let configured = false;

export function configureFfmpeg() {
  if (configured) return;
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
  ffmpeg.setFfprobePath(FFPROBE_PATH);
  configured = true;
}
