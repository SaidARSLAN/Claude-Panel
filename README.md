# Claude Panel

A dashboard for visualizing Claude Code usage statistics. Track token consumption, cost analysis, and session history from a single interface.

## What It Does

Claude Code saves session logs to the `~/.claude` folder while running in the terminal. This app reads those logs and provides:

- Total token usage and cost tracking
- Daily/monthly usage trends
- Project-based statistics
- Model-based cost breakdown
- Session history with conversation details
- Cost optimization suggestions

## Installation

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Configuration

By default, the app reads data from `~/.claude`. To use a different location, set the `CLAUDE_DIR` environment variable:

```bash
CLAUDE_DIR=/path/to/claude npm run dev
```

## Pages

### Dashboard
Main page with summary stats including total sessions, token usage, cost, and duration. Shows daily usage chart and project distribution.

### Sessions
List of all Claude Code sessions. Filter by date, project, model, and cost. Click any session to view the full conversation.

### Analytics
Detailed usage analysis with model-based token distribution, project comparisons, and daily trends.

### Costs
Cost analysis page. Compare current vs previous month, see cost breakdown by token type (input, output, cache read, cache write), and view current model pricing.

### Cost Optimization
Cost reduction suggestions based on your usage patterns. Includes cache efficiency analysis, model change recommendations, and most expensive prompt patterns.

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Recharts
- Radix UI

## Notes

- Read-only - does not modify log files
- Server-side data processing, no API key required
- Dark mode supported

## License

MIT
