import type { Plugin, PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import pc from "picocolors"

import { loadPluginConfig } from "./config"
import { createShannonTor } from "./tools/shannon-tor"
import { createShannonMemory, getMemorySummary } from "./tools/shannon-memory"
import {
  createShannonProgressTrackerHook,
  createShannonSessionManagerHook,
} from "./hooks"
import { SHANNON_SYSTEM_PROMPT } from "./system-prompt"
import { writeFeedLine, setFeedTarget, clearFeed } from "./hooks/shannon-progress-tracker/feed-writer"

const ShannonPlugin: Plugin = async (ctx: PluginInput) => {
  console.log(pc.cyan("[Shadow Core] Loading Shadow Core pentest plugin..."))

  const config = loadPluginConfig(ctx.directory)
  console.log(pc.green("[Shadow Core] Config loaded successfully"))

  // ── TOOLS ──────────────────────────────────────────────────
  // Shannon pentest tools REMOVED — AI uses bash directly on Kali Linux.
  // Kali has all tools built-in: nmap, nikto, sqlmap, gobuster, whatweb,
  // nuclei, hydra, dirb, ffuf, wpscan, searchsploit, etc.
  // The AI decides which tool to use based on the phase and target.
  //
  // Only utility tools remain:
  //   - shannon_tor:    Tor proxy management (anti-rate-limiting)
  //   - shannon_memory:  Persistent memory (long sessions)
  console.log(pc.cyan("[Shadow Core] Registering tools..."))
  const tools: Record<string, ToolDefinition> = {
    shannon_tor: createShannonTor(),
    shannon_memory: createShannonMemory(),
  }

  console.log(pc.cyan("[Shadow Core] Registering hooks..."))
  const progressTracker = createShannonProgressTrackerHook(ctx)
  const sessionManager = createShannonSessionManagerHook(ctx)

  console.log(pc.green("[Shadow Core] Shadow Core plugin loaded successfully"))
  console.log(pc.dim(`  - Tools: shannon_tor, shannon_memory (+ bash for Kali tools)`))
  console.log(pc.dim(`  - Hooks: progress-tracker, session-manager, system-prompt`))
  console.log(pc.dim(`  - Mode: Native Kali — AI uses bash directly`))

  return {
    tool: tools,
    "tool.execute.before": async (input: any, output: any) => {
      await progressTracker["tool.execute.before"]?.(input, output)
    },
    "tool.execute.after": async (input: any, output: any) => {
      await progressTracker["tool.execute.after"]?.(input, output)
    },
    event: async (input: any) => {
      await progressTracker.event?.(input)
      await sessionManager.event?.(input)
    },
    "experimental.chat.system.transform": async (input: any, output) => {
      // Inject Shadow Core system prompt FIRST (unshift = highest priority)
      output.system.unshift(SHANNON_SYSTEM_PROMPT)

      // Inject persistent memory into system prompt so model never forgets
      try {
        const memorySummary = getMemorySummary()
        if (memorySummary) {
          output.system.push(memorySummary)
        }
      } catch {}

      // Detect target from user message and write to feed file
      try {
        const userText = input?.info?.messages?.find((m: any) => m.role === "user")?.content || ""
        const text = typeof userText === "string" ? userText : JSON.stringify(userText)

        const urlMatch = text.match(/https?:\/\/[^\s"'<>#]+/i)
        if (urlMatch) {
          setFeedTarget(urlMatch[0].slice(0, 50))
        } else {
          const ipMatch = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)
          if (ipMatch) setFeedTarget(ipMatch[0])
          else {
            const domainMatch = text.match(/\b[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\.[a-z]{2,})?\b/i)
            if (domainMatch) setFeedTarget(domainMatch[0])
          }
        }
      } catch {}
    },

    // Strip [FEED] lines and status markers from model chat output
    "experimental.chat.output.transform": async (_input: any, output: any) => {
      try {
        if (output?.assistant) {
          let text = typeof output.assistant === "string" ? output.assistant : ""
          if (text) {
            text = text.replace(/\[FEED\][^\n]*\n?/g, "")
            text = text.replace(/\*{3,}[^*\n]*\*{3,}/g, "")
            output.assistant = text
          }
        }
      } catch {}
    },
  }
}

export default ShannonPlugin

export type { ShannonConfig } from "./config/schema"
