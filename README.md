# AI Usage Tracker

An open-source self-hosted dashboard to track AI tool usage — tokens, costs, and activity — across Claude Code, OpenAI Codex CLI, and Cursor.

## Features

- **Zero credentials required** for Claude and Codex — data is read directly from local files written by the CLI tools
- **Unified dashboard**: Total tokens, estimated cost, and per-tool breakdown in one place
- **Usage charts**: Token usage over time, per tool
- **Cost estimation**: Calculated from published pricing tables, broken down by model
- **Local caching**: Results are cached locally (5-minute TTL) to avoid re-reading files on every page load
- **Self-hosted**: Everything stays on your machine

## How it works

Rather than calling external APIs, the dashboard reads the session files that AI CLI tools already write to your disk:

| Tool | Data source | Credentials needed |
|---|---|---|
| Claude Code | `~/.claude/projects/**/*.jsonl` | None |
| OpenAI Codex CLI | `~/.codex/sessions/**/rollout-*.jsonl` | None |
| Cursor | Cursor Analytics API | Enterprise API key |
| GitHub Copilot | GitHub REST API | Org token (enterprise/business only) |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/adylagad/ai-usage.git
cd ai-usage
npm install
```

### 2. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Claude and Codex data will appear automatically if you have either CLI tool installed. No configuration needed.

### 3. Optional: Cursor or Copilot

For Cursor (enterprise) or GitHub Copilot (org/business plan), copy the env file and add your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Tool | Notes |
|---|---|---|
| `CURSOR_API_KEY` | Cursor | Enterprise teams only — Cursor team settings |
| `GITHUB_TOKEN` + `GITHUB_ORG` | GitHub Copilot | Needs `read:org` scope, org must have Copilot Business/Enterprise |

## Configuration

| Variable | Default | Description |
|---|---|---|
| `CACHE_TTL_MINUTES` | `5` | How long to cache parsed results |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Change if running on a different port |

## Tool support

| Tool | Tokens | Cost | Method |
|---|---|---|---|
| Claude Code | ✅ | ✅ estimated | Parses `~/.claude/projects/**/*.jsonl` |
| OpenAI Codex CLI | ✅ | ✅ estimated | Parses `~/.codex/sessions/**/rollout-*.jsonl` |
| Cursor | Messages only | ❌ | Enterprise API — no local token data |
| GitHub Copilot | ❌ | ❌ | Org-level API only — suggestions/acceptance rates |

Cost estimates use hardcoded pricing tables (updated April 2026). They reflect list prices and won't account for discounts or credits.

## Contributing

PRs welcome. To add a new tool:

1. Create `lib/collectors/<tool>.ts` exporting `fetchSummary(days: number): Promise<ToolSummary>`
2. Add `app/api/<tool>/route.ts` that calls the collector and handles caching
3. Register the tool name in `app/dashboard/page.tsx`

See `lib/types.ts` for the `ToolSummary` shape.

## License

MIT
