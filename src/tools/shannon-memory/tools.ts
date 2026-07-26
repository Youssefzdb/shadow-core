import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { SHANNON_MEMORY_DESCRIPTION, MEMORY_FILE } from "./constants"
import { writeFileSync, readFileSync, existsSync } from "fs"
import { writeFeedLine } from "../../hooks/shannon-progress-tracker/feed-writer"

interface MemoryEntry {
  key: string
  value: string
  phase: string
  timestamp: string
}

function loadMemory(): MemoryEntry[] {
  try {
    if (!existsSync(MEMORY_FILE)) return []
    const data = readFileSync(MEMORY_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveMemory(entries: MemoryEntry[]): void {
  try {
    writeFileSync(MEMORY_FILE, JSON.stringify(entries, null, 2))
  } catch {}
}

export function getMemorySummary(): string {
  const entries = loadMemory()
  if (entries.length === 0) return ""
  let summary = `\n## PERSISTENT MEMORY (${entries.length} entries) — DO NOT FORGET THESE:\n`
  for (const e of entries) {
    summary += `- [${e.phase}] ${e.key}: ${e.value.slice(0, 200)}\n`
  }
  return summary
}

export function createShannonMemory(): ToolDefinition {
  return tool({
    description: SHANNON_MEMORY_DESCRIPTION,
    args: {
      action: tool.schema
        .string()
        .describe("Action: 'save', 'recall', 'summary', or 'clear'"),
      key: tool.schema
        .string()
        .optional()
        .describe("Memory key (required for 'save' action)"),
      value: tool.schema
        .string()
        .optional()
        .describe("Memory value (required for 'save' action)"),
      phase: tool.schema
        .string()
        .optional()
        .describe("Phase this finding belongs to (recon, discovery, exploit, etc.)"),
    },
    async execute(args) {
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`

      switch (args.action) {
        case "save": {
          if (!args.key || !args.value) {
            return "❌ 'save' requires both key and value."
          }
          const entries = loadMemory()
          const entry: MemoryEntry = {
            key: args.key,
            value: args.value,
            phase: args.phase || "general",
            timestamp: time,
          }
          // Replace if same key exists
          const existing = entries.findIndex(e => e.key === args.key)
          if (existing >= 0) entries[existing] = entry
          else entries.push(entry)
          saveMemory(entries)
          writeFeedLine(time, "MEMORY", "save", `${args.key}: ${args.value.slice(0, 60)}`)
          return `✅ Memory saved (${entries.length} total entries)\n  Key: ${args.key}\n  Phase: ${entry.phase}\n  Value: ${args.value.slice(0, 100)}${args.value.length > 100 ? "..." : ""}`
        }

        case "recall": {
          const entries = loadMemory()
          if (entries.length === 0) return "No memories stored yet."
          let output = `📋 Stored Memories (${entries.length} entries):\n\n`
          for (const e of entries) {
            output += `[${e.timestamp}] (${e.phase}) ${e.key}:\n  ${e.value}\n\n`
          }
          return output
        }

        case "summary": {
          const entries = loadMemory()
          if (entries.length === 0) return "No memories stored yet."
          let summary = `📊 Memory Summary (${entries.length} entries):\n`
          // Group by phase
          const phases: Record<string, MemoryEntry[]> = {}
          for (const e of entries) {
            if (!phases[e.phase]) phases[e.phase] = []
            phases[e.phase].push(e)
          }
          for (const [phase, items] of Object.entries(phases)) {
            summary += `\n${phase.toUpperCase()} (${items.length}):\n`
            for (const i of items) {
              summary += `  - ${i.key}: ${i.value.slice(0, 120)}\n`
            }
          }
          return summary
        }

        case "clear": {
          saveMemory([])
          return "✅ All memories cleared."
        }

        default:
          return `Unknown action: ${args.action}. Use: save, recall, summary, or clear.`
      }
    },
  })
}
