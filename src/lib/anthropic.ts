/**
 * Returns a configured Anthropic client.
 * Falls back to reading .env.local directly if Next.js failed to load the key
 * (common on Windows with CRLF/.env.local parsing edge cases).
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

function resolveApiKey(): string {
  // 1. Standard env var (set by Next.js from .env.local)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2. Fallback: read .env.local directly
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const raw = fs.readFileSync(envPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("ANTHROPIC_API_KEY=")) {
        const key = trimmed.slice("ANTHROPIC_API_KEY=".length).trim();
        if (key) return key;
      }
    }
  } catch {
    // file not found or unreadable — fall through
  }

  throw new Error(
    "ANTHROPIC_API_KEY is not set. Add it to .env.local or your environment."
  );
}

export function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: resolveApiKey() });
}
