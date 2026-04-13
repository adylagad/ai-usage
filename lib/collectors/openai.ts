import { DayBucket, ToolSummary } from "../types";

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
    tool: "openai",
    label: "OpenAI",
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ...base, configured: false, daily: [], lastFetchedAt: new Date().toISOString() };
  }

  const startDate = isoDate(daysAgo(days));
  const endDate = isoDate(new Date());

  const res = await fetch(
    `https://api.openai.com/v1/organization/usage/completions?start_date=${startDate}&end_date=${endDate}&bucket_width=1d&limit=31`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
      error: `OpenAI API error ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  const json = await res.json();
  const buckets: Array<{
    start_time: number;
    results: Array<{
      input_tokens?: number;
      output_tokens?: number;
      input_cached_tokens?: number;
      model_id?: string;
    }>;
  }> = json.data ?? [];

  const dailyMap: Record<string, DayBucket> = {};
  const modelCount: Record<string, number> = {};

  for (const bucket of buckets) {
    const date = new Date(bucket.start_time * 1000).toISOString().split("T")[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { date, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    }
    for (const result of bucket.results ?? []) {
      const input = (result.input_tokens ?? 0) + (result.input_cached_tokens ?? 0);
      const output = result.output_tokens ?? 0;
      dailyMap[date].inputTokens += input;
      dailyMap[date].outputTokens += output;

      if (result.model_id) {
        modelCount[result.model_id] = (modelCount[result.model_id] ?? 0) + input + output;
      }
    }
  }

  // OpenAI usage API doesn't return cost directly — compute approximate cost
  // using rough estimates; users can override with billing API if needed
  for (const day of Object.values(dailyMap)) {
    // Average ~$2.50/1M input, ~$10/1M output (GPT-4o approximation)
    day.costUsd = (day.inputTokens / 1_000_000) * 2.5 + (day.outputTokens / 1_000_000) * 10;
  }

  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    tool: "openai",
    label: "OpenAI",
    configured: true,
    totalInputTokens: daily.reduce((s, d) => s + d.inputTokens, 0),
    totalOutputTokens: daily.reduce((s, d) => s + d.outputTokens, 0),
    totalCostUsd: daily.reduce((s, d) => s + d.costUsd, 0),
    topModel,
    daily,
    lastFetchedAt: new Date().toISOString(),
  };
}
