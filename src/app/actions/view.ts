"use server";

import prisma from "@/lib/prisma";

export async function incrementViewCount(videoId: string) {
  try {
    await prisma.video.update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    });
    return { success: true };
  } catch {
    // View tracking should never break the page
    return { success: false, error: "Failed to track view" };
  }
}
