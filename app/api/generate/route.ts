import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit, clientIp } from "@/lib/ratelimit";

// Client is instantiated per-request so it can accept a user-provided key

// Hard cap on total repo context sent to Claude.
// ~6 000 chars ≈ 1 500 tokens for file content; prompt overhead adds ~800 more.
// Absolute ceiling: ~2 300 input tokens + 1 500 output tokens ≈ $0.03 worst-case.
const MAX_CONTEXT_CHARS = 24_000;

// Per-file char budgets (trimmed before the aggregate cap is applied)
const FILE_CHAR_LIMITS: Record<string, number> = {
  "README.md": 6_000,
  "readme.md": 6_000,
  "CONTRIBUTING.md": 3_000,
  "contributing.md": 3_000,
};
const DEFAULT_FILE_CHAR_LIMIT = 2_000;

// Files ordered by signal value — we fill the budget in this order.
const PRIORITY_FILES = [
  "README.md",
  "readme.md",
  "package.json",
  "pyproject.toml",
  "go.mod",
  "Cargo.toml",
  "CONTRIBUTING.md",
  "contributing.md",
  "Makefile",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.js",
  "jest.config.js",
  "jest.config.ts",
  "vitest.config.ts",
  "vitest.config.js",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  "requirements.txt",
  "AGENTS.md",
  "CLAUDE.md",
];

interface GitHubFile {
  name: string;
  path: string;
  type: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string,
  token?: string
): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.raw",
    "User-Agent": "agents-md-generator",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );
  if (!res.ok) return null;
  return res.text();
}

async function fetchRepoTree(
  owner: string,
  repo: string,
  token?: string
): Promise<GitHubFile[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agents-md-generator",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/`,
    { headers }
  );
  if (!res.ok) return [];
  return res.json();
}

async function fetchWorkflows(
  owner: string,
  repo: string,
  token?: string
): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "agents-md-generator",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows`,
    { headers }
  );
  if (!res.ok) return null;
  const files: GitHubFile[] = await res.json();
  if (!Array.isArray(files)) return null;

  const snippets: string[] = [];
  for (const f of files.slice(0, 2)) {
    const content = await fetchGitHubFile(
      owner,
      repo,
      `.github/workflows/${f.name}`,
      token
    );
    if (content) snippets.push(`## ${f.name}\n${content.slice(0, 800)}`);
  }
  return snippets.join("\n\n") || null;
}

export async function POST(req: NextRequest) {
  try {
  // Throttle abuse before any (paid) Claude work — protects the server-side
  // ANTHROPIC_API_KEY fallback from being looped to drain the budget.
  const rl = rateLimit(`generate:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { url, token, anthropicKey } = await req.json();
  const apiKey = anthropicKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "No Anthropic API key configured. Set ANTHROPIC_API_KEY in Vercel environment variables, or provide it in the request." },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub repository URL" },
      { status: 400 }
    );
  }

  const { owner, repo } = parsed;

  // Fetch all candidate files in parallel
  const rawFiles: Record<string, string> = {};
  await Promise.all(
    PRIORITY_FILES.map(async (path) => {
      const limit = FILE_CHAR_LIMITS[path] ?? DEFAULT_FILE_CHAR_LIMIT;
      const content = await fetchGitHubFile(owner, repo, path, token);
      if (content) rawFiles[path] = content.slice(0, limit);
    })
  );

  if (rawFiles["AGENTS.md"]) {
    return NextResponse.json(
      { error: "This repository already has an AGENTS.md file." },
      { status: 400 }
    );
  }

  // Build context respecting the aggregate character budget
  const [rootFiles, workflows] = await Promise.all([
    fetchRepoTree(owner, repo, token),
    fetchWorkflows(owner, repo, token),
  ]);

  const folderStructure = Array.isArray(rootFiles)
    ? rootFiles.map((f) => `${f.type === "dir" ? "/" : " "}${f.name}`).join("\n")
    : "";

  const contextParts: string[] = [
    `Repository: ${owner}/${repo}`,
    `Root structure:\n${folderStructure}`,
  ];
  let charBudget = MAX_CONTEXT_CHARS - folderStructure.length - 100;

  for (const path of PRIORITY_FILES) {
    const content = rawFiles[path];
    if (!content) continue;
    const entry = `\n--- ${path} ---\n${content}`;
    if (entry.length > charBudget) {
      // Include a truncated slice rather than nothing
      const partial = entry.slice(0, charBudget);
      contextParts.push(partial + "\n[truncated]");
      charBudget = 0;
      break;
    }
    contextParts.push(entry);
    charBudget -= entry.length;
    if (charBudget <= 0) break;
  }

  if (workflows && charBudget > 200) {
    const entry = `\n--- .github/workflows ---\n${workflows}`;
    contextParts.push(entry.slice(0, charBudget));
  }

  const context = contextParts.join("\n");

  const prompt = `You are an expert developer who writes concise, accurate AGENTS.md files for AI coding agents.

Given the following repository context, generate an AGENTS.md file. Include ONLY sections that are relevant and have real information from the repo. Do not invent or guess at sections you have no evidence for.

Possible sections (include only relevant ones):
- Installation / Setup
- Coding/Development Guidelines
- Executable Commands
- Folder Structure
- Testing Instructions
- Linting
- Deployment
- PR Instructions
- Do-Not Rules
- Styling Guide

Rules:
- Maximum 200 lines total
- Be specific, not generic — use actual commands, paths, and patterns from the repo
- Use markdown formatting with ## section headers
- Start with a one-line description of what the repo does
- Only include sections with real, extracted information
- For commands, use code blocks
- Keep each section tight — no padding or filler

Repository context:
${context}

Output ONLY the AGENTS.md content, no preamble.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3_000,
    messages: [{ role: "user", content: prompt }],
  });

  const agentsMd =
    message.content[0].type === "text" ? message.content[0].text : "";

  const lines = agentsMd.split("\n");
  const truncated =
    lines.length > 200 ? lines.slice(0, 200).join("\n") : agentsMd;

  return NextResponse.json({
    agentsMd: truncated,
    repo: `${owner}/${repo}`,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
