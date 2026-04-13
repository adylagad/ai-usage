import { execSync } from "child_process";
import { DayBucket, ToolSummary } from "../types";

interface BillingUsageItem {
  date: string;
  model?: string;
  quantity: number;
  netAmount: number;
}

interface OrgMetrics {
  total_suggestions_count?: number;
  total_acceptances_count?: number;
  total_active_users?: number;
  breakdown?: Array<{ date: string }>;
}

function getGhToken(): string | null {
  try {
    return execSync("gh auth token 2>/dev/null", { encoding: "utf-8" }).trim() || null;
  } catch {
    return null;
  }
}

function getGhLogin(): string | null {
  try {
    return execSync("gh api /user --jq .login 2>/dev/null", { encoding: "utf-8" }).trim() || null;
  } catch {
    return null;
  }
}

async function fetchPersonalUsage(
  login: string,
  token: string
): Promise<{ daily: DayBucket[]; totalRequests: number; totalCostUsd: number; topModel?: string } | null> {
  const res = await fetch(
    `https://api.github.com/users/${login}/settings/billing/premium_request/usage`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  if (!res.ok) return null;

  const json = await res.json();
  const items: BillingUsageItem[] = json.usageItems ?? [];

  const dailyMap: Record<string, DayBucket> = {};
  const modelCount: Record<string, number> = {};

  for (const item of items) {
    const date = item.date?.split("T")[0];
    if (!date) continue;
    if (!dailyMap[date]) {
      dailyMap[date] = { date, inputTokens: 0, outputTokens: item.quantity, costUsd: item.netAmount };
    } else {
      dailyMap[date].outputTokens += item.quantity;
      dailyMap[date].costUsd += item.netAmount;
    }
    if (item.model) {
      modelCount[item.model] = (modelCount[item.model] ?? 0) + item.quantity;
    }
  }

  const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
  return {
    daily,
    totalRequests: daily.reduce((s, d) => s + d.outputTokens, 0),
    totalCostUsd: daily.reduce((s, d) => s + d.costUsd, 0),
    topModel: Object.entries(modelCount).sort((a, b) => b[1] - a[1])[0]?.[0],
  };
}

async function fetchOrgMetrics(token: string, org: string): Promise<OrgMetrics | null> {
  const res = await fetch(
    `https://api.github.com/orgs/${org}/copilot/metrics/reports/organization-28-day/latest`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function fetchSummary(_days: number): Promise<ToolSummary> {
  const base: Omit<ToolSummary, "configured" | "daily" | "lastFetchedAt"> = {
    tool: "copilot",
    label: "GitHub Copilot",
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
  };

  // Auto-detect gh CLI token — zero setup required
  const ghToken = getGhToken();
  const orgToken = process.env.GITHUB_TOKEN ?? ghToken;
  const org = process.env.GITHUB_ORG;

  if (!ghToken && !orgToken) {
    return {
      ...base,
      configured: false,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
      error: "Run `gh auth login` to enable Copilot tracking",
    };
  }

  // Try personal billing with gh token
  if (ghToken) {
    const login = getGhLogin();
    if (login) {
      const personal = await fetchPersonalUsage(login, ghToken);
      if (personal) {
        return {
          ...base,
          label: "GitHub Copilot",
          configured: true,
          totalOutputTokens: personal.totalRequests,
          totalCostUsd: personal.totalCostUsd,
          topModel: personal.topModel,
          daily: personal.daily,
          lastFetchedAt: new Date().toISOString(),
        };
      }
    }
  }

  // Fall back to org metrics
  if (orgToken && org) {
    const metrics = await fetchOrgMetrics(orgToken, org);
    if (metrics) {
      const daily: DayBucket[] = (metrics.breakdown ?? []).map((d) => ({
        date: d.date,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      }));
      return {
        ...base,
        label: "GitHub Copilot (Org)",
        configured: true,
        suggestions: metrics.total_suggestions_count ?? 0,
        acceptances: metrics.total_acceptances_count ?? 0,
        activeUsers: metrics.total_active_users ?? 0,
        daily,
        lastFetchedAt: new Date().toISOString(),
      };
    }
  }

  return {
    ...base,
    configured: true,
    daily: [],
    lastFetchedAt: new Date().toISOString(),
    error: ghToken
      ? "No Copilot plan found on this account. Make sure you have an active Copilot subscription."
      : `Could not fetch org metrics for '${org}'.`,
  };
}
