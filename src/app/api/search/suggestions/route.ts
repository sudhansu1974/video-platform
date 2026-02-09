import { NextRequest, NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/queries/search";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q || q.length === 0) {
      return NextResponse.json([]);
    }

    if (q.length > 200) {
      return NextResponse.json(
        { error: "Query too long" },
        { status: 400 }
      );
    }

    const suggestions = await getSearchSuggestions(q);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("[API] Search suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
