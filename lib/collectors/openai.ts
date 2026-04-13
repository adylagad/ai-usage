import fs from "fs";
import path from "path";
import os from "os";
import { DayBucket, ToolSummary } from "../types";

// Pricing per million tokens (April 2026)
const PRICING: Record<string, { input: number; output: number; cachedInput: number }> = {
  "gpt-5.4":      { input: 2.50,  output: 10.00, cachedInput: 1.25 },
  "gpt-5.4-mini": { input: 0.15,  output:  0.60, cachedInput: 0.075 },
  "gpt-4o":       { input: 2.50,  output: 10.00, cachedInput: 1.25 },
  "gpt-4o-mini":  { input: 0.15,  output:  0.60, cachedInput: 0.075 },
  "o1":           { input: 15.00, output: 60.00, cachedInput: 7.50 },
  "o3":           { input: 10.00, output: 40.00, cachedInput: 2.50 },
  "o3-mini":      { input: 1.10,  output:  4.40, cachedInput: 0.55 },
  "o4-mini":      { input: 1.10,  output:  4.40, cachedInput: 0.55 },
  "codex-mini":   { input: 1.50,  output:  6.00, cachedInput: 0.375 },
};

function getPrice(model: string) {
  for (const [key, price] of Object.entries(PRICING)) {
    if (model.includes(key)) return price;
  }
  return PRICING["gpt-4o"]; // fallback
}

function calcCost(usage: {
  input_tokens?: number;
  output_tokens?: number;
  cached_input_tokens?: number;
}, model: string): number {
  const p = getPrice(model);
  const M = 1_000_000;
  const uncachedInput = (usage.input_tokens ?? 0) - (usage.cached_input_tokens ?? 0);
  return (
    (Math.max(0, uncachedInput) / M) * p.input +
    ((usage.cached_input_tokens ?? 0) / M) * p.cachedInput +
    ((usage.output_tokens ?? 0) / M) * p.output
  );
}

function findJsonlFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { recursive: true, encoding: "utf-8" }) as string[];
  return entries
    .filter((e) => e.endsWith(".jsonl") && e.includes("rollout-"))
    .map((e) => path.join(dir, e));
}

function readModel(): string {
  try {
    const configPath = path.join(os.homedir(), ".codex", "config.toml");
    const content = fs.readFileSync(configPath, "utf-8");
    const match = content.match(/^model\s*=\s*"([^"]+)"/m);
    return match?.[1] ?? "gpt-4o";
  } catch {
    return "gpt-4o";
  }
}

export async function fetchSummary(days: number): Promise<ToolSummary> {
  const sessionsDir = path.join(os.homedir(), ".codex", "sessions");

  if (!fs.existsSync(sessionsDir)) {
    return {
      tool: "openai",
      label: "OpenAI (Codex CLI)",
      configured: false,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
      error: "Codex CLI not found (~/.codex/sessions missing). Install with: npm install -g @openai/codex",
    };
  }

  const files = findJsonlFiles(sessionsDir);
  const defaultModel = readModel();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const dailyMap: Record<string, DayBucket> = {};

  for (const file of files) {
    // Extract date from filename: rollout-YYYY-MM-DDT...
    const fileDate = path.basename(file).match(/rollout-(\d{4}-\d{2}-\d{2})/)?.[1];
    if (!fileDate) continue;
    if (new Date(fileDate) < cutoff) continue;

    let lines: string[];
    try {
      lines = fs.readFileSync(file, "utf-8").split("\n");
    } catch {
      continue;
    }

    // Each session file has a single token_count event with cumulative totals.
    // We use the last one (most up-to-date for the session).
    let lastTokenCount: {
      input_tokens?: number;
      output_tokens?: number;
      cached_input_tokens?: number;
    } | null = null;

    for (const line of lines) {
      if (!line.trim()) continue;
      let record: Record<string, unknown>;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }

      if (record.type !== "event_msg") continue;
      const payload = record.payload as Record<string, unknown> | undefined;
      if (payload?.type !== "token_count") continue;

      const info = payload.info as Record<string, unknown> | undefined;
      const last = info?.last_token_usage as Record<string, number> | undefined;
      if (last) {
        lastTokenCount = {
          input_tokens: last.input_tokens,
          output_tokens: last.output_tokens,
          cached_input_tokens: last.cached_input_tokens,
        };
      }
    }

    if (!lastTokenCount) continue;

    const inputTokens = lastTokenCount.input_tokens ?? 0;
    const outputTokens = lastTokenCount.output_tokens ?? 0;
    const cost = calcCost(lastTokenCount, defaultModel);

    if (!dailyMap[fileDate]) {
      dailyMap[fileDate] = { date: fileDate, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    }
    dailyMap[fileDate].inputTokens += inputTokens;
    dailyMap[fileDate].outputTokens += outputTokens;
    dailyMap[fileDate].costUsd += cost;
  }

  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

  return {
    tool: "openai",
    label: "OpenAI (Codex CLI)",
    configured: true,
    totalInputTokens: daily.reduce((s, d) => s + d.inputTokens, 0),
    totalOutputTokens: daily.reduce((s, d) => s + d.outputTokens, 0),
    totalCostUsd: daily.reduce((s, d) => s + d.costUsd, 0),
    topModel: defaultModel,
    daily,
    lastFetchedAt: new Date().toISOString(),
  };
}
