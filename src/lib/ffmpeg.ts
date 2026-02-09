import ffmpeg from "fluent-ffmpeg";

// Configure fluent-ffmpeg with explicit paths to FFmpeg binaries.
// This avoids relying on PATH which may not be updated in the current shell/process.
// TODO: Use environment variables (FFMPEG_PATH, FFPROBE_PATH) in production

const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  "C:\\Users\\sudha\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe";

const FFPROBE_PATH =
  process.env.FFPROBE_PATH ||
  "C:\\Users\\sudha\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe";

let configured = false;

export function configureFfmpeg() {
  if (configured) return;
  ffmpeg.setFfmpegPath(FFMPEG_PATH);
  ffmpeg.setFfprobePath(FFPROBE_PATH);
  configured = true;
}
