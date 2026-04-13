import fs from "fs";
import path from "path";
import os from "os";
import { DayBucket, ToolSummary } from "../types";

// Pricing per million tokens (April 2026)
const PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus":   { input: 5.00,  output: 25.00, cacheWrite: 6.25, cacheRead: 0.50 },
  "claude-sonnet": { input: 3.00,  output: 15.00, cacheWrite: 3.75, cacheRead: 0.30 },
  "claude-haiku":  { input: 1.00,  output:  5.00, cacheWrite: 1.25, cacheRead: 0.10 },
};

function getPrice(model: string) {
  for (const [key, price] of Object.entries(PRICING)) {
    if (model.includes(key)) return price;
  }
  // Default to sonnet pricing for unknown models
  return PRICING["claude-sonnet"];
}

function calcCost(usage: {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}, model: string): number {
  const p = getPrice(model);
  const M = 1_000_000;
  return (
    ((usage.input_tokens ?? 0) / M) * p.input +
    ((usage.output_tokens ?? 0) / M) * p.output +
    ((usage.cache_creation_input_tokens ?? 0) / M) * p.cacheWrite +
    ((usage.cache_read_input_tokens ?? 0) / M) * p.cacheRead
  );
}

function findJsonlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { recursive: true, encoding: "utf-8" }) as string[];
  return entries
    .filter((e) => e.endsWith(".jsonl"))
    .map((e) => path.join(dir, e));
}

export async function fetchSummary(days: number): Promise<ToolSummary> {
  const claudeDir = path.join(os.homedir(), ".claude", "projects");
  const files = findJsonlFiles(claudeDir);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const seen = new Set<string>();
  const dailyMap: Record<string, DayBucket> = {};
  const modelCount: Record<string, number> = {};

  for (const file of files) {
    let lines: string[];
    try {
      lines = fs.readFileSync(file, "utf-8").split("\n");
    } catch {
      continue;
    }

    for (const line of lines) {
      if (!line.trim()) continue;
      let record: Record<string, unknown>;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }

      if (record.type !== "assistant") continue;

      const msg = record.message as Record<string, unknown> | undefined;
      if (!msg?.usage) continue;

      const msgId = msg.id as string | undefined;
      if (msgId && seen.has(msgId)) continue;
      if (msgId) seen.add(msgId);

      const timestamp = record.timestamp as string | undefined;
      if (!timestamp) continue;

      const date = new Date(timestamp);
      if (date < cutoff) continue;

      const dateStr = timestamp.split("T")[0];
      const model = (msg.model as string) ?? "unknown";
      const usage = msg.usage as Record<string, number>;

      const inputTokens =
        (usage.input_tokens ?? 0) +
        (usage.cache_creation_input_tokens ?? 0) +
        (usage.cache_read_input_tokens ?? 0);
      const outputTokens = usage.output_tokens ?? 0;
      const cost = calcCost(usage, model);

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, inputTokens: 0, outputTokens: 0, costUsd: 0 };
      }
      dailyMap[dateStr].inputTokens += inputTokens;
      dailyMap[dateStr].outputTokens += outputTokens;
      dailyMap[dateStr].costUsd += cost;

      modelCount[model] = (modelCount[model] ?? 0) + inputTokens + outputTokens;
    }
  }

  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  const topModel = Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    tool: "claude",
    label: "Claude (Claude Code)",
    configured: true,
    totalInputTokens: daily.reduce((s, d) => s + d.inputTokens, 0),
    totalOutputTokens: daily.reduce((s, d) => s + d.outputTokens, 0),
    totalCostUsd: daily.reduce((s, d) => s + d.costUsd, 0),
    topModel,
    daily,
    lastFetchedAt: new Date().toISOString(),
  };
}
