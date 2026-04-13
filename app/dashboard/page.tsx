import { OverviewCards } from "@/components/overview-cards";
import { UsageChart } from "@/components/usage-chart";
import { ToolBreakdown } from "@/components/tool-breakdown";
import { RefreshButton } from "@/components/refresh-button";
import { ToolSummary } from "@/lib/types";

const TOOLS = [
  "claude",
  "openai",
  "copilot", // shows personal usage when signed in with GitHub, org metrics if GITHUB_ORG is set
  "cursor",
] as const;
const DAYS = 30;

async function fetchTool(tool: string): Promise<ToolSummary> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/${tool}?days=${DAYS}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${tool}`);
  return res.json();
}

export default async function DashboardPage() {
  const results = await Promise.allSettled(TOOLS.map(fetchTool));

  const tools: ToolSummary[] = results.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    // Fallback on fetch failure
    return {
      tool: TOOLS[i],
      label: TOOLS[i].charAt(0).toUpperCase() + TOOLS[i].slice(1),
      configured: false,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      daily: [],
      lastFetchedAt: new Date().toISOString(),
      error: result.reason?.message,
    };
  });

  const lastUpdated = new Date().toLocaleTimeString();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Last {DAYS} days · Updated at {lastUpdated}</p>
        </div>
        <RefreshButton />
      </div>

      <OverviewCards tools={tools} />
      <UsageChart tools={tools} />
      <ToolBreakdown tools={tools} />
    </div>
  );
}
