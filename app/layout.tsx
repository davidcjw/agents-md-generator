import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AGENTS.md Generator",
  description:
    "Generate a concise, evidence-based AGENTS.md file for any GitHub repository.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col df-surface-page">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
