"use client";

import { useState, useRef } from "react";
import {
  Display,
  Text,
  MonoLabel,
  Button,
  Rule,
  SectionMarker,
} from "./ds";

const REPO_URL = "https://github.com/davidcjw/agents-md-generator";

function GitHubMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [repoName, setRepoName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleGenerate() {
    if (!url.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setRepoName(null);
    setUsage(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          token: githubToken.trim() || undefined,
        }),
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

  const fieldClass =
    "w-full bg-[var(--df-fill)] border border-[var(--df-line)] rounded-[var(--df-radius)] px-4 py-3 text-sm font-mono text-[var(--df-ink)] placeholder-[var(--df-muted)] focus:outline-none focus:border-[var(--df-accent)] transition-colors";

  return (
    <main className="flex-1 w-full">
      {/* top bar */}
      <header className="border-b border-[var(--df-line)]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="font-serif text-[var(--df-accent)] text-xl leading-none"
              aria-hidden="true"
            >
              A
            </span>
            <MonoLabel tone="ink">AGENTS.md</MonoLabel>
          </div>
          <Button
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            variant="outline"
          >
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <GitHubMark />
              Star on GitHub
            </span>
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 w-full">
        {/* hero */}
        <section className="pt-20 pb-12">
          <MonoLabel tone="accent" className="block mb-6">
            Generator
          </MonoLabel>
          <Display as="h1" size="h" className="mb-5 max-w-2xl">
            Generate <span className="text-[var(--df-accent)]">AGENTS.md</span>{" "}
            for any repo
          </Display>
          <Text
            as="p"
            face="sans"
            size="lead"
            tone="muted"
            className="max-w-xl"
          >
            Paste a GitHub URL and get a concise, evidence-based AGENTS.md your
            AI coding agent can actually use — install, commands, testing,
            linting and more.
          </Text>
        </section>

        {/* input */}
        <section className="space-y-3 pb-2">
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="https://github.com/owner/repo"
              className={`flex-1 ${fieldClass}`}
            />
            <Button
              as="button"
              variant="accent"
              onClick={handleGenerate}
              disabled={loading || !url.trim()}
              style={{
                opacity: loading || !url.trim() ? 0.4 : 1,
                cursor: loading || !url.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <svg
                    className="animate-spin h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Scanning
                </span>
              ) : (
                "Generate"
              )}
            </Button>
          </div>

          <button
            onClick={() => setShowGithubToken(!showGithubToken)}
            className="flex items-center gap-1.5 text-[var(--df-muted)] hover:text-[var(--df-ink)] transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showGithubToken ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <MonoLabel tone="inherit">Private repo? Add GitHub token</MonoLabel>
          </button>

          {showGithubToken && (
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className={fieldClass}
            />
          )}
        </section>

        {/* error */}
        {error && (
          <div className="mt-6 px-4 py-3 border border-[var(--df-accent)] rounded-[var(--df-radius)] bg-[rgba(250,76,20,0.08)]">
            <Text face="mono" size="micro" tone="accent" caps>
              {error}
            </Text>
          </div>
        )}

        {/* result */}
        {result && (
          <section className="mt-10">
            <SectionMarker number="02">Result</SectionMarker>
            <div className="flex items-center justify-between mt-6 mb-3">
              <div className="flex items-center gap-3">
                <Text face="mono" size="micro" tone="ink">
                  {repoName}
                </Text>
                <MonoLabel tone="muted">{lineCount} / 200 lines</MonoLabel>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  Download
                </Button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full h-[60vh] bg-[var(--df-fill)] border border-[var(--df-line)] rounded-[var(--df-radius)] px-5 py-4 text-sm text-[var(--df-ink)] leading-relaxed focus:outline-none focus:border-[var(--df-accent)] resize-none transition-colors font-mono"
              spellCheck={false}
            />
            <MonoLabel tone="muted" className="block mt-2">
              Output is editable — tweak before copying or downloading
              {usage
                ? ` · ${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out`
                : ""}
            </MonoLabel>
          </section>
        )}

        {/* empty state */}
        {!result && !loading && !error && (
          <div className="mt-8 border border-[var(--df-line)] rounded-[var(--df-radius)] p-10 text-center">
            <Text face="mono" size="micro" tone="muted" caps>
              AGENTS.md will appear here
            </Text>
            <MonoLabel tone="muted" className="block mt-3">
              Install · Commands · Structure · Testing · Linting · Deployment ·
              PR rules
            </MonoLabel>
          </div>
        )}

        {/* footer */}
        <footer className="mt-20 pt-6 pb-10">
          <Rule />
          <div className="flex items-center justify-between pt-6">
            <MonoLabel tone="muted">Powered by Claude Haiku</MonoLabel>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[var(--df-muted)] hover:text-[var(--df-accent)] transition-colors"
            >
              <GitHubMark />
              <MonoLabel tone="inherit">GitHub</MonoLabel>
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
