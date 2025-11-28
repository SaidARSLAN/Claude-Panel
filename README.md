# Claude Panel

A dashboard for visualizing your Claude Code usage. Track how much you spend, which projects consume the most tokens, and find ways to reduce costs.

## What It Does

Claude Code saves session logs to `~/.claude` while you work. This app reads those logs and shows you:

- How much you've spent in total and per project
- Daily and monthly usage trends
- Full conversation history for any session
- Tips to reduce your costs

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

If your Claude logs are in a different location:

```bash
CLAUDE_DIR=/your/path npm run dev
```

## How to Use

### Dashboard
Start here. See your total sessions, tokens, cost, and time spent. The charts show daily trends and which projects use the most resources.

### Sessions
Browse all your past conversations. Use filters to find specific sessions by date, project, or model. Click any session to read the full chat.

### Analytics
Dig deeper into the numbers. Compare projects side by side, see which models you use most, and track how your usage changes over time.

### Costs
Understand where your money goes. See the breakdown between input tokens, output tokens, and cache usage. Compare this month to last month.

### Cost Optimization
Get practical suggestions to spend less. The app analyzes your patterns and tells you:
- Which prompts cost you the most
- Whether you could use cheaper models for some tasks
- How well you're using the cache system

## License

MIT
