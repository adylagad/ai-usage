import { NextResponse } from "next/server";
import { clearCache } from "@/lib/cache";

export async function POST() {
  clearCache("claude");
  clearCache("openai");
  clearCache("copilot");
  clearCache("cursor");
  return NextResponse.json({ ok: true });
}
