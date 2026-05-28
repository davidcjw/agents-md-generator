"use client";

import { useState, useRef } from "react";
const PROMPT_TEMPLATE = `You are an expert developer who writes concise, accurate AGENTS.md files for AI coding agents.

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
CONTEXT_PLACEHOLDER

Output ONLY the AGENTS.md content, no preamble.`;

export default function Home() {
  const [url, setUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canGenerate = url.trim() && anthropicKey.trim() && !loading;

  async function handleGenerate() {
    if (!canGenerate) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setRepoName(null);
    setUsage(null);

    try {
      // Step 1: fetch repo context server-side (handles GitHub API, CORS, rate limits)
      setLoadingStage("Scanning repository…");
      const githubRes = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          token: githubToken.trim() || undefined,
        }),
      });
      const githubData = await githubRes.json();
      if (!githubRes.ok) {
        setError(githubData.error || "Failed to fetch repository");
        return;
      }

      // Step 2: call Anthropic Messages API directly from browser — no server key needed
      setLoadingStage("Generating AGENTS.md…");
      const prompt = PROMPT_TEMPLATE.replace("CONTEXT_PLACEHOLDER", githubData.context);
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3_000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!anthropicRes.ok) {
        const errData = await anthropicRes.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Anthropic API error ${anthropicRes.status}`);
      }

      const message = await anthropicRes.json();
      const agentsMd =
        message.content[0]?.type === "text" ? message.content[0].text : "";
      const lines = agentsMd.split("\n");
      const truncated = lines.length > 200 ? lines.slice(0, 200).join("\n") : agentsMd;

      setResult(truncated);
      setRepoName(githubData.repo);
      setUsage({
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingStage("");
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "AGENTS.md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const lineCount = result ? result.split("\n").length : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
              <span className="text-black font-mono font-bold text-sm">A</span>
            </div>
            <span className="font-mono text-sm text-neutral-400 tracking-widest uppercase">
              agents.md
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            Generate AGENTS.md for any repo
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed">
            Paste a GitHub URL. We&apos;ll scan the repo and produce a concise
            AGENTS.md your AI coding agent can actually use. Bring your own
            Anthropic key — it never leaves your browser.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-3 mb-6">
          {/* Repo URL */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-sm font-mono placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
          />

          {/* Anthropic key — always visible, required */}
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">
              Anthropic API key{" "}
              <span className="text-neutral-700">(required — stays in your browser)</span>
            </label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="sk-ant-..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-sm font-mono placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loadingStage || "Working…"}
              </span>
            ) : (
              "Generate AGENTS.md"
            )}
          </button>

          {/* GitHub token (optional, collapsed) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGithubToken(!showGithubToken)}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showGithubToken ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Private repo? Add GitHub token
            </button>
          </div>

          {showGithubToken && (
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-sm font-mono placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">
                  <span className="text-white font-mono">{repoName}</span>
                </span>
                <span className="text-xs text-neutral-600 font-mono">
                  {lineCount} / 200 lines
                </span>
                {usage && (
                  <span
                    className="text-xs text-neutral-700 font-mono"
                    title={`${usage.inputTokens} in / ${usage.outputTokens} out`}
                  >
                    ~${(((usage.inputTokens * 3) + (usage.outputTokens * 15)) / 1_000_000).toFixed(4)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 rounded-md transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full h-[60vh] bg-neutral-900 border border-neutral-700 rounded-lg px-5 py-4 text-sm font-mono text-neutral-200 leading-relaxed focus:outline-none focus:border-neutral-500 resize-none transition-colors"
              spellCheck={false}
            />
            <p className="text-xs text-neutral-600">
              Output is editable — tweak before copying or downloading.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div className="border border-dashed border-neutral-800 rounded-lg p-8 text-center">
            <p className="text-sm text-neutral-600 font-mono">
              AGENTS.md will appear here
            </p>
            <p className="text-xs text-neutral-700 mt-2">
              Install · Commands · Folder Structure · Testing · Linting · Deployment · PR rules
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-900 flex items-center justify-between">
          <span className="text-xs text-neutral-700">
            Powered by Claude Sonnet · Your key never touches our server
          </span>
          <span className="text-xs text-neutral-700">
            Max 200 lines · ~$0.07 ceiling
          </span>
        </footer>
      </div>
    </main>
  );
}
