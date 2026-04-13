import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchSummary } from "@/lib/collectors/copilot";
import { readCache, writeCache } from "@/lib/cache";
import { ToolSummary } from "@/lib/types";

export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (!force) {
    const cached = readCache<ToolSummary>("copilot");
    if (cached) return NextResponse.json(cached);
  }

  const session = await getServerSession(authOptions);
  const summary = await fetchSummary(days, session?.accessToken, session?.login);
  writeCache("copilot", summary);
  return NextResponse.json(summary);
}
