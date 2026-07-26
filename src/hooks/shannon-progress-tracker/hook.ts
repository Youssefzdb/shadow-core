import type { PluginInput } from "@opencode-ai/plugin"
import { SHANNON_TOOLS, TOOL_PHASES, PROGRESS_PREFIX } from "./constants"
import type { ToolExecuteInput, ToolExecuteOutput, ProgressState } from "./types"
import { writeFeedLine, setFeedTarget, clearFeed } from "./feed-writer"

export function createShannonProgressTrackerHook(_ctx: PluginInput) {
  const sessionProgress = new Map<string, ProgressState>()

  function progressKey(sessionID: string, tool: string): string {
    return `${sessionID}:${tool}`
  }

  const toolExecuteBefore = async (
    input: ToolExecuteInput,
    _output: ToolExecuteOutput,
  ): Promise<void> => {
    const { tool, sessionID } = input

    if (!SHANNON_TOOLS.has(tool)) {
      return
    }

    const phase = TOOL_PHASES[tool] || "Unknown Phase"
    const state: ProgressState = {
      sessionID,
      tool,
      phase,
      startTime: Date.now(),
      lastUpdate: Date.now(),
    }

    sessionProgress.set(progressKey(sessionID, tool), state)

    // Write [FEED] line for tool start
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    const shortTool = tool.replace("shannon_", "").toUpperCase()
    const phaseTag = shortTool === "DOCKER_INIT" ? "INIT" : shortTool === "DOCKER_CLEANUP" ? "CLEANUP" : shortTool
    writeFeedLine(time, phaseTag, tool.replace("shannon_", ""), "started...")
  }

  const toolExecuteAfter = async (
    input: ToolExecuteInput,
    output: ToolExecuteOutput,
  ) => {
    const { tool, sessionID } = input

    if (!SHANNON_TOOLS.has(tool)) {
      return
    }

    const key = progressKey(sessionID, tool)
    const state = sessionProgress.get(key)
    if (!state) {
      return
    }

    const duration = Date.now() - state.startTime
    const durationSec = Math.floor(duration / 1000)

    // Write [FEED] line for tool completion
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    const shortTool = tool.replace("shannon_", "").toUpperCase()
    const phaseTag = shortTool === "DOCKER_INIT" ? "INIT" : shortTool === "DOCKER_CLEANUP" ? "CLEANUP" : shortTool

    // Extract result summary from output
    const outputText = typeof output.result === "string" ? output.result : JSON.stringify(output.result || output.output || "")
    const resultSummary = outputText.slice(0, 80).replace(/\n/g, " ").trim() || `completed in ${durationSec}s`
    
    // Detect findings
    let resultLine = resultSummary
    const lower = outputText.toLowerCase()
    if (lower.includes("vulnerab") || lower.includes("found") || lower.includes("open") || lower.includes("critical")) {
      resultLine = `FINDING: ${resultSummary}`
    } else {
      resultLine = `done (${durationSec}s)`
    }
    
    writeFeedLine(time, phaseTag, tool.replace("shannon_", ""), resultLine)

    output.output += `\n${PROGRESS_PREFIX}Phase "${state.phase}" completed in ${durationSec}s`

    output.instructions = output.instructions || []
    output.instructions.push(
      `TASK UPDATE: The security phase "${state.phase}" has completed. Update your todo list to reflect this progress.`
    )

    sessionProgress.delete(key)
  }

  const event = async (input: { event: { type: string; properties?: { sessionID?: string; text?: string; content?: string; role?: string } } }) => {
    const { type, properties } = input.event

    // Clear feed file on new session
    if (type === "session.created") {
      clearFeed()
    }

    if (type === "session.deleted" && properties?.sessionID) {
      for (const key of sessionProgress.keys()) {
        if (key.startsWith(`${properties.sessionID}:`)) {
          sessionProgress.delete(key)
        }
      }
    }

    // Detect target from user messages
    if (type === "message.created" || type === "message.updated") {
      const text = properties?.text || properties?.content || ""
      if (typeof text === "string" && properties?.role === "user") {
        // URL detection
        const urlMatch = text.match(/https?:\/\/[^\s"'<>#]+/i)
        if (urlMatch) {
          setFeedTarget(urlMatch[0].slice(0, 50))
        } else {
          // IP detection
          const ipMatch = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)
          if (ipMatch) setFeedTarget(ipMatch[0])
          else {
            // Domain detection
            const domainMatch = text.match(/\b[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\.[a-z]{2,})?\b/i)
            if (domainMatch) setFeedTarget(domainMatch[0])
          }
        }
      }
    }
  }

  return {
    "tool.execute.before": toolExecuteBefore,
    "tool.execute.after": toolExecuteAfter,
    event,
  }
}
