import { NextRequest, NextResponse } from "next/server";

const MAX_CONTEXT_CHARS = 24_000;

const FILE_CHAR_LIMITS: Record<string, number> = {
  "README.md": 6_000,
  "readme.md": 6_000,
  "Readme.md": 6_000,
  "CONTRIBUTING.md": 3_000,
  "contributing.md": 3_000,
};
const DEFAULT_FILE_CHAR_LIMIT = 2_000;

const PRIORITY_FILES = [
  "README.md",
  "readme.md",
  "Readme.md",
  "package.json",
  "pyproject.toml",
  "go.mod",
  "Cargo.toml",
  "CONTRIBUTING.md",
  "contributing.md",
  "Makefile",
  ".eslintrc.json",
  ".eslintrc.js",
  ".eslintrc.yml",
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
  type: string;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

async function fetchFile(
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

async function fetchTree(
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
    const content = await fetchFile(
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

    const rawFiles: Record<string, string> = {};
    await Promise.all(
      PRIORITY_FILES.map(async (path) => {
        const limit = FILE_CHAR_LIMITS[path] ?? DEFAULT_FILE_CHAR_LIMIT;
        const content = await fetchFile(owner, repo, path, token);
        if (content) rawFiles[path] = content.slice(0, limit);
      })
    );

    if (rawFiles["AGENTS.md"]) {
      return NextResponse.json(
        { error: "This repository already has an AGENTS.md file." },
        { status: 400 }
      );
    }

    const [rootFiles, workflows] = await Promise.all([
      fetchTree(owner, repo, token),
      fetchWorkflows(owner, repo, token),
    ]);

    const folderStructure = Array.isArray(rootFiles)
      ? rootFiles
          .map((f) => `${f.type === "dir" ? "/" : " "}${f.name}`)
          .join("\n")
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
        contextParts.push(entry.slice(0, charBudget) + "\n[truncated]");
        charBudget = 0;
        break;
      }
      contextParts.push(entry);
      charBudget -= entry.length;
      if (charBudget <= 0) break;
    }

    if (workflows && charBudget > 200) {
      contextParts.push(
        `\n--- .github/workflows ---\n${workflows}`.slice(0, charBudget)
      );
    }

    return NextResponse.json({
      context: contextParts.join("\n"),
      repo: `${owner}/${repo}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
