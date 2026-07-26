/**
 * Feed Writer — writes [FEED] lines to a file for the TUI to read.
 * This bridges the agent process (main plugin) and the TUI process.
 * 
 * The TUI polls /tmp/shadow-core-feed.log to get live updates.
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from "fs"
import { dirname } from "path"

const FEED_FILE = "/tmp/shadow-core-feed.log"
const TARGET_FILE = "/tmp/shadow-core-target.txt"

export function writeFeedLine(time: string, phase: string, action: string, result: string): void {
  try {
    const line = `[FEED] ${time} | ${phase} | ${action} | ${result}\n`
    appendFileSync(FEED_FILE, line)
  } catch {
    // Ignore errors — feed is best-effort
  }
}

export function setFeedTarget(target: string): void {
  try {
    writeFileSync(TARGET_FILE, target)
    // Also write a feed line for target detection
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    writeFeedLine(time, "INIT", "target-set", target)
  } catch {
    // Ignore
  }
}

export function clearFeed(): void {
  try {
    writeFileSync(FEED_FILE, "")
    writeFileSync(TARGET_FILE, "")
  } catch {
    // Ignore
  }
}
