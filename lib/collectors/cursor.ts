import { DayBucket, ToolSummary } from "../types";

const CURSOR_API_BASE = "https://api.cursor.com";

export async function fetchSummary(days: number): Promise<ToolSummary> {
  const base: Omit<ToolSummary, "configured" | "daily" | "lastFetchedAt"> = {
    tool: "cursor",
    label: "Cursor",
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
  };

  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    return { ...base, configured: false, daily: [], lastFetchedAt: new Date().toISOString() };
  }

  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

  // Fetch model usage breakdown
  const res = await fetch(
    `${CURSOR_API_BASE}/analytics/team/models?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      ...base,
      configured: true,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
      error: `Cursor API error ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  const json = await res.json();

  // Cursor returns model-level message counts, not tokens
  // Map to a single aggregate bucket
  const models: Array<{ model: string; message_count: number }> = json.data ?? [];
  const topModel = models.sort((a, b) => b.message_count - a.message_count)[0]?.model;
  const totalMessages = models.reduce((s, m) => s + m.message_count, 0);

  // Cursor doesn't expose per-day breakdown in the team/models endpoint
  // Return a single aggregate "today" bucket with message count in outputTokens slot
  const today = new Date().toISOString().split("T")[0];
  const daily: DayBucket[] = [
    { date: today, inputTokens: 0, outputTokens: totalMessages, costUsd: 0 },
  ];

  return {
    tool: "cursor",
    label: "Cursor",
    configured: true,
    totalInputTokens: 0,
    totalOutputTokens: totalMessages,
    totalCostUsd: 0,
    topModel,
    daily,
    lastFetchedAt: new Date().toISOString(),
  };
}
