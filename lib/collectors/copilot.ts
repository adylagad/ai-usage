import { DayBucket, ToolSummary } from "../types";

export async function fetchSummary(_days: number): Promise<ToolSummary> {
  const base: Omit<ToolSummary, "configured" | "daily" | "lastFetchedAt"> = {
    tool: "copilot",
    label: "GitHub Copilot",
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
  };

  const token = process.env.GITHUB_TOKEN;
  const org = process.env.GITHUB_ORG;
  if (!token || !org) {
    return { ...base, configured: false, daily: [], lastFetchedAt: new Date().toISOString() };
  }

  // Fetch 28-day org summary
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

  if (!res.ok) {
    const text = await res.text();
    return {
      ...base,
      configured: true,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
      error: `GitHub API error ${res.status}: ${text.slice(0, 200)}`,
    };
  }

  const json = await res.json();

  // The 28-day report returns aggregate metrics
  // We'll surface suggestions, acceptances, and active users
  const suggestions: number = json.total_suggestions_count ?? 0;
  const acceptances: number = json.total_acceptances_count ?? 0;
  const activeUsers: number = json.total_active_users ?? 0;

  // Build approximate daily buckets from the breakdown if available
  const dailyData: Array<{
    date: string;
    total_suggestions_count?: number;
    total_acceptances_count?: number;
  }> = json.breakdown ?? [];

  const daily: DayBucket[] = dailyData.map((d) => ({
    date: d.date,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  }));

  return {
    tool: "copilot",
    label: "GitHub Copilot",
    configured: true,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
    suggestions,
    acceptances,
    activeUsers,
    daily,
    lastFetchedAt: new Date().toISOString(),
  };
}
