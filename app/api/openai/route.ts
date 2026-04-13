import { NextRequest, NextResponse } from "next/server";
import { fetchSummary } from "@/lib/collectors/openai";
import { readCache, writeCache } from "@/lib/cache";
import { ToolSummary } from "@/lib/types";

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (!force) {
    const cached = readCache<ToolSummary>("openai");
    if (cached) return NextResponse.json(cached);
  }

  const summary = await fetchSummary(days);
  writeCache("openai", summary);
  return NextResponse.json(summary);
}
