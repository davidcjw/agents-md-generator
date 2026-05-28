"use client";

import { useState, useRef } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleGenerate() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setRepoName(null);
    setUsage(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), token: token.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data.agentsMd);
        setRepoName(data.repo);
        if (data.usage) setUsage(data.usage);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
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
            AGENTS.md your AI coding agent can actually use.
          </p>
        </div>

        {/* Input */}
        <div className="space-y-3 mb-6">
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-sm font-mono placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !url.trim()}
              className="px-5 py-3 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {/* Optional token */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showToken ? "rotate-90" : ""}`}
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

          {showToken && (
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
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
                  <span className="text-xs text-neutral-700 font-mono" title={`${usage.inputTokens} in / ${usage.outputTokens} out`}>
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

        {/* Empty state hint */}
        {!result && !loading && !error && (
          <div className="border border-dashed border-neutral-800 rounded-lg p-8 text-center">
            <p className="text-sm text-neutral-600 font-mono">
              AGENTS.md will appear here
            </p>
            <p className="text-xs text-neutral-700 mt-2">
              Sections generated: Install · Commands · Folder Structure · Testing · Linting · Deployment · PR rules
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-900 flex items-center justify-between">
          <span className="text-xs text-neutral-700">
            Powered by Claude Sonnet
          </span>
          <span className="text-xs text-neutral-700">
            Only relevant sections are included
          </span>
        </footer>
      </div>
    </main>
  );
}
