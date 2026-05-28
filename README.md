# AGENTS.md Generator

Generate an `AGENTS.md` file for any public GitHub repository using Claude AI.

**Live:** [agents-md-generator.vercel.app](https://agents-md-generator.vercel.app)

## What it does

Paste a GitHub URL → get a concise, accurate `AGENTS.md` (≤200 lines) covering only the sections that have real evidence in the repo:

- Installation / Setup
- Executable Commands
- Folder Structure
- Testing Instructions
- Linting
- Deployment
- PR Instructions
- Coding Guidelines
- Do-Not Rules
- Styling Guide

Output is editable in the browser and can be copied or downloaded.

## How it works

1. `/api/github` fetches key files from the repo in priority order (README → package.json → lint/test configs → CI workflows etc.), capped at 24k characters
2. The context is sent to `claude-haiku-4-5-20251001` with a structured prompt
3. Claude generates only sections backed by real evidence — no generic filler
4. Output is hard-capped to 200 lines

**Cost ceiling: ~$0.02 per generation** (Haiku: $0.80/MTok input, $4.00/MTok output)

## Self-hosting

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Local development

```bash
git clone https://github.com/davidcjw/agents-md-generator
cd agents-md-generator
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/davidcjw/agents-md-generator)

Set the `ANTHROPIC_API_KEY` environment variable in your Vercel project settings.

## Private repos

Expand "Private repo? Add GitHub token" in the UI and provide a GitHub personal access token with `repo` scope.

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Tailwind CSS](https://tailwindcss.com)
- [Anthropic SDK](https://github.com/anthropic-ai/sdk-python) — `claude-haiku-4-5-20251001`
