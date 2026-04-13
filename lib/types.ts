export type ToolId = "claude" | "openai" | "copilot" | "cursor";

export interface DayBucket {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface ToolSummary {
  tool: ToolId;
  label: string;
  configured: boolean;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  topModel?: string;
  // Copilot-specific (no token data)
  suggestions?: number;
  acceptances?: number;
  activeUsers?: number;
  // GitHub identity when authenticated via gh CLI
  ghLogin?: string;
  daily: DayBucket[];
  lastFetchedAt: string; // ISO string
  error?: string;
  // Informational note (shown in UI but not treated as an error)
  info?: string;
}

export interface CacheEntry<T> {
  data: T;
  fetchedAt: string; // ISO string
}
