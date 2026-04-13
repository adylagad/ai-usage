import { OverviewCards } from "@/components/overview-cards";
import { UsageChart } from "@/components/usage-chart";
import { ToolBreakdown } from "@/components/tool-breakdown";
import { RefreshButton } from "@/components/refresh-button";
import { AdvancedVisualizations } from "@/components/advanced-visualizations";
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
  const totalCost = tools.reduce((sum, tool) => sum + tool.totalCostUsd, 0);
  const totalTokens = tools.reduce((sum, tool) => sum + tool.totalInputTokens + tool.totalOutputTokens, 0);
  const configured = tools.filter((tool) => tool.configured).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-gradient-to-r from-[color:var(--brand-blue)]/12 via-white to-[color:var(--brand-mint)]/12 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Usage Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Last {DAYS} days · {configured} tools configured · Updated at {lastUpdated}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 font-medium">
              {totalTokens.toLocaleString()} tokens
            </span>
            <span className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 font-medium">
              ${totalCost.toFixed(2)} estimated cost
            </span>
          </div>
        </div>
        <RefreshButton />
      </div>

      <OverviewCards tools={tools} />
      <UsageChart tools={tools} />
      <AdvancedVisualizations tools={tools} />
      <ToolBreakdown tools={tools} />
    </div>
  );
}
