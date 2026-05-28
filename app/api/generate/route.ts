import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  download_url?: string;
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

  const workflows: string[] = [];
  for (const f of files.slice(0, 3)) {
    const content = await fetchGitHubFile(
      owner,
      repo,
      `.github/workflows/${f.name}`,
      token
    );
    if (content) workflows.push(`## ${f.name}\n${content.slice(0, 1000)}`);
  }
  return workflows.join("\n\n") || null;
}

export async function POST(req: NextRequest) {
  const { url, token } = await req.json();

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

  const filesToFetch = [
    "README.md",
    "readme.md",
    "CONTRIBUTING.md",
    "contributing.md",
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "Makefile",
    ".eslintrc.json",
    ".eslintrc.js",
    ".prettierrc",
    ".prettierrc.json",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.ts",
    "vitest.config.js",
    "Dockerfile",
    "docker-compose.yml",
    ".github/PULL_REQUEST_TEMPLATE.md",
    "AGENTS.md",
    "CLAUDE.md",
    "CODEBASE.md",
  ];

  const fetchedFiles: Record<string, string> = {};

  await Promise.all(
    filesToFetch.map(async (path) => {
      const content = await fetchGitHubFile(owner, repo, path, token);
      if (content) fetchedFiles[path] = content.slice(0, 3000);
    })
  );

  if (fetchedFiles["AGENTS.md"]) {
    return NextResponse.json(
      { error: "This repository already has an AGENTS.md file." },
      { status: 400 }
    );
  }

  const rootFiles = await fetchRepoTree(owner, repo, token);
  const folderStructure = Array.isArray(rootFiles)
    ? rootFiles.map((f) => `${f.type === "dir" ? "/" : " "}${f.name}`).join("\n")
    : "";

  const workflows = await fetchWorkflows(owner, repo, token);

  const contextParts: string[] = [
    `Repository: ${owner}/${repo}`,
    `Root structure:\n${folderStructure}`,
  ];

  for (const [path, content] of Object.entries(fetchedFiles)) {
    contextParts.push(`\n--- ${path} ---\n${content}`);
  }

  if (workflows) {
    contextParts.push(`\n--- .github/workflows ---\n${workflows}`);
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
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const agentsMd =
    message.content[0].type === "text" ? message.content[0].text : "";

  const lines = agentsMd.split("\n");
  const truncated =
    lines.length > 200 ? lines.slice(0, 200).join("\n") : agentsMd;

  return NextResponse.json({ agentsMd: truncated, repo: `${owner}/${repo}` });
}
