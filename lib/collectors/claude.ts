import { DayBucket, ToolSummary } from "../types";

const BASE = "https://api.anthropic.com";
const HEADERS = {
  "anthropic-version": "2023-06-01",
  "content-type": "application/json",
};

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function fetchSummary(days: number): Promise<ToolSummary> {
  const base: Omit<ToolSummary, "configured" | "daily" | "lastFetchedAt"> = {
    tool: "claude",
    label: "Claude (Anthropic)",
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
  };

  const apiKey = process.env.ANTHROPIC_ADMIN_API_KEY;
  if (!apiKey) {
    return {
      ...base,
      configured: false,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
    };
  }

  const headers = { ...HEADERS, "x-api-key": apiKey };
  const startDate = isoDate(daysAgo(days));
  const endDate = isoDate(new Date());

  // Fetch usage (tokens)
  const usageRes = await fetch(
    `${BASE}/v1/organizations/usage_report/messages?starting_at=${startDate}&ending_at=${endDate}&bucket_width=1d&limit=31`,
    { headers }
  );

  if (!usageRes.ok) {
    const text = await usageRes.text();
    return {
      ...base,
      configured: true,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
      error: `Anthropic API error ${usageRes.status}: ${text.slice(0, 200)}`,
    };
  }

  const usageData = await usageRes.json();

  // Fetch cost
  const costRes = await fetch(
    `${BASE}/v1/organizations/cost_report?starting_at=${startDate}&ending_at=${endDate}&bucket_width=1d&limit=31`,
    { headers }
  );
  const costData = costRes.ok ? await costRes.json() : null;

  // Build per-day cost map (date -> costUsd)
  const costByDate: Record<string, number> = {};
  if (costData?.data) {
    for (const bucket of costData.data) {
      const date = bucket.start_time?.split("T")[0] ?? bucket.date;
      // cost values are in cents as decimal strings
      const cost = parseFloat(bucket.total_cost ?? "0") / 100;
      costByDate[date] = (costByDate[date] ?? 0) + cost;
    }
  }

  // Build daily buckets from usage data
  const dailyMap: Record<string, DayBucket> = {};
  const modelCount: Record<string, number> = {};

  for (const bucket of usageData.data ?? []) {
    const date: string = (bucket.start_time ?? bucket.timestamp ?? "").split("T")[0];
    if (!date) continue;

    const inputTokens =
      (bucket.uncached_input_tokens ?? 0) +
      (bucket.cached_input_tokens ?? 0) +
      (bucket.cache_creation_input_tokens ?? 0);
    const outputTokens = bucket.output_tokens ?? 0;

    if (!dailyMap[date]) {
      dailyMap[date] = { date, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    }
    dailyMap[date].inputTokens += inputTokens;
    dailyMap[date].outputTokens += outputTokens;
    dailyMap[date].costUsd += costByDate[date] ?? 0;

    if (bucket.model) {
      modelCount[bucket.model] = (modelCount[bucket.model] ?? 0) + inputTokens + outputTokens;
    }
  }

  // If no daily data from API, create an empty bucket for today using cost data
  if (Object.keys(dailyMap).length === 0 && costData?.data) {
    for (const bucket of costData.data) {
      const date = (bucket.start_time ?? bucket.date ?? "").split("T")[0];
      if (!date) continue;
      if (!dailyMap[date]) {
        dailyMap[date] = { date, inputTokens: 0, outputTokens: 0, costUsd: parseFloat(bucket.total_cost ?? "0") / 100 };
      }
    }
  }

  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  const totalInputTokens = daily.reduce((s, d) => s + d.inputTokens, 0);
  const totalOutputTokens = daily.reduce((s, d) => s + d.outputTokens, 0);
  const totalCostUsd = daily.reduce((s, d) => s + d.costUsd, 0);

  return {
    tool: "claude",
    label: "Claude (Anthropic)",
    configured: true,
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd,
    topModel,
    daily,
    lastFetchedAt: new Date().toISOString(),
  };
}
