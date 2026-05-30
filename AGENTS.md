# AGENTS.md Generator

Generates concise, evidence-based `AGENTS.md` files for GitHub repositories using Claude AI.

## Installation / Setup

```bash
git clone https://github.com/davidcjw/agents-md-generator
cd agents-md-generator
npm install
cp .env.example .env.local
```

Add your `ANTHROPIC_API_KEY` to `.env.local`. Requires Node.js 18+.

## Executable Commands

```bash
npm run dev      # Start Next.js dev server (localhost:3000)
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Folder Structure

```
/app             # Next.js App Router application code
/public          # Static assets
.gitignore       # Git ignore rules
eslint.config.mjs # ESLint configuration
next.config.ts   # Next.js configuration
package.json     # Dependencies and scripts
postcss.config.mjs # PostCSS/Tailwind configuration
tsconfig.json    # TypeScript configuration
```

## Linting

ESLint is configured via `eslint.config.mjs` with Next.js recommended rules (`eslint-config-next`).

```bash
npm run lint
```

## Deployment

Deploy to Vercel using the deploy button in the README or manually:

1. Connect your GitHub repo to Vercel
2. Set `ANTHROPIC_API_KEY` environment variable in project settings
3. Deploy

For private repos, users can provide a GitHub personal access token with `repo` scope through the UI.

## PR Instructions

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with conventional format: `git commit -m 'feat: describe change'`
4. Ensure tests pass before pushing
5. Open a pull request

## Tech Stack

- **Framework:** Next.js 16.2.6 (App Router)
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic SDK with `claude-haiku-4-5-20251001`
- **Language:** TypeScript 5
- **Linting:** ESLint 9

## How It Works

1. `/api/github` endpoint fetches repository files (README, package.json, configs, workflows) up to 24k characters
2. Context sent to Claude Haiku with structured prompt
3. Claude generates only sections with real evidence from the repo
4. Output hard-capped at 200 lines, editable and downloadable in browser
