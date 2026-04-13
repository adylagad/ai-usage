# AI Usage Tracker

An open-source self-hosted dashboard to track AI tool usage — tokens, costs, and activity — across Claude, OpenAI, GitHub Copilot, and Cursor.

## Features

- **Unified dashboard**: See total tokens, estimated cost, and per-tool breakdown in one place
- **Usage charts**: Token usage over time, per tool
- **Multi-tool support**: Claude (Anthropic), OpenAI, GitHub Copilot, Cursor
- **Local caching**: API responses are cached locally (5-minute TTL by default) to avoid rate limits
- **Self-hosted**: Runs locally, your API keys never leave your machine

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/ai-usage.git
cd ai-usage
npm install
```

### 2. Configure credentials

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in the API keys for the tools you want to track. You only need to add keys for tools you use — unconfigured tools will show a "Not configured" badge.

| Variable | Tool | Where to get it |
|---|---|---|
| `ANTHROPIC_ADMIN_API_KEY` | Claude | [console.anthropic.com/settings/admin-keys](https://console.anthropic.com/settings/admin-keys) |
| `OPENAI_API_KEY` | OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `GITHUB_TOKEN` + `GITHUB_ORG` | GitHub Copilot | [github.com/settings/tokens](https://github.com/settings/tokens) (needs `read:org`) |
| `CURSOR_API_KEY` | Cursor | Cursor team settings (enterprise only) |

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Variable | Default | Description |
|---|---|---|
| `CACHE_TTL_MINUTES` | `5` | How long to cache API responses |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Base URL for internal API calls |

## Tool Support Notes

| Tool | Token Data | Cost Data | Notes |
|---|---|---|---|
| Claude | ✅ | ✅ | Requires Admin API key |
| OpenAI | ✅ | ~approx | Cost is estimated from token counts |
| GitHub Copilot | ❌ | ❌ | Shows suggestions/acceptance rates, org-level only |
| Cursor | Messages | ❌ | Enterprise teams only; shows message counts per model |

## Contributing

PRs welcome! To add a new tool, create a collector in `lib/collectors/` that exports `fetchSummary(days: number): Promise<ToolSummary>`, add an API route in `app/api/`, and register the tool in the dashboard page.

## License

MIT
