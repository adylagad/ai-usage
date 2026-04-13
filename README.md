# AI Usage Tracker

An open-source self-hosted dashboard to track AI tool usage — tokens, costs, and activity — across Claude Code, OpenAI Codex CLI, GitHub Copilot, and Cursor.

## Setup

```bash
git clone https://github.com/adylagad/ai-usage.git
cd ai-usage
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it for most users.

## How it works

The dashboard reads data that AI tools already write to your machine — no API keys, no accounts, no configuration required for the core tools.

| Tool | Data source | What you need |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` | Nothing — just use Claude Code |
| OpenAI Codex CLI | `~/.codex/sessions/**/rollout-*.jsonl` | Nothing — just use Codex CLI |
| GitHub Copilot | GitHub API via `gh` CLI session | Run `gh auth login` once (most devs already have this) |
| Cursor | Cursor Analytics API | Enterprise API key |

## Optional configuration

Only needed for Cursor enterprise users or GitHub org admins. Copy the example file and fill in what applies to you:

```bash
cp .env.local.example .env.local
```

| Variable | Tool | Notes |
|---|---|---|
| `CURSOR_API_KEY` | Cursor | Enterprise teams only |
| `GITHUB_TOKEN` + `GITHUB_ORG` | GitHub Copilot (org) | Overrides `gh` CLI auth; org must have Copilot Business/Enterprise |

## Tool support

| Tool | Data | Cost | Notes |
|---|---|---|---|
| Claude Code | Tokens (input/output/cache) | ✅ estimated | From local JSONL session files |
| OpenAI Codex CLI | Tokens (input/output/cached) | ✅ estimated | From local JSONL session files |
| GitHub Copilot | Premium requests + billing | ✅ actual | Via `gh auth token`; personal plan only |
| Cursor | Message counts per model | ❌ | Enterprise API only; no token data locally |

Cost estimates use hardcoded pricing tables (updated April 2026) and reflect list prices — they won't account for discounts or credits.

## Contributing

PRs welcome. To add a new tool:

1. Create `lib/collectors/<tool>.ts` exporting `fetchSummary(days: number): Promise<ToolSummary>`
2. Add `app/api/<tool>/route.ts` that calls the collector and handles caching
3. Register the tool name in `app/dashboard/page.tsx`

See `lib/types.ts` for the `ToolSummary` shape.

## License

MIT
