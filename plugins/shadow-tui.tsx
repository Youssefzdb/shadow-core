/** @jsxImportSource @opentui/solid */
import { useTerminalDimensions, type JSX } from "@opentui/solid"
import { createSignal, createMemo, onMount, onCleanup } from "solid-js"
import { useBindings, useKeymapSelector } from "@opentui/keymap/solid"
import { RGBA, VignetteEffect, type KeyEvent, type Renderable } from "@opentui/core"
import { createBindingLookup, type BindingConfig } from "@opentui/keymap/extras"
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiPluginModule, TuiSlotPlugin } from "@opencode-ai/plugin/tui"
import { readFileSync, statSync, existsSync } from "fs"

// ════════════════════════════════════════════════════════════
// SHADOW CORE — Split Screen TUI (Design 4) v2
// Top: Logo + Shield | Left: Chat | Right: Pentest Feed | Bottom: Status Bar
// v2: Fixed live feed — proper event listening + URL target detection
// ════════════════════════════════════════════════════════════

// ─── Shadow Core ASCII Logo ───
const LOGO = [
  "  ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗",
  "  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║",
  "  ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║",
  "  ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║",
  "  ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝",
  "  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝",
]

const SHIELD = [
  "     ████████╗",
  "    ██╔═══════╝",
  "    ██║██████╗",
  "    ██║╚════██║",
  "    ╚██████╔╝",
  "     ╚═════╝",
]

// ─── 7 Free Agents ───
const AGENTS = [
  { id: "shadow-mimo", name: "MiMo V2.5", color: "#FF8800" },
  { id: "shadow-pickle", name: "Big Pickle", color: "#00FF44" },
  { id: "shadow-deepseek", name: "DeepSeek V4", color: "#3399FF" },
  { id: "shadow-laguna", name: "Laguna S 2.1", color: "#00FFFF" },
  { id: "shadow-ling", name: "Ling 3.0", color: "#FFDD00" },
  { id: "shadow-nemotron", name: "Nemotron 3", color: "#88FF00" },
  { id: "shadow-north", name: "North Mini", color: "#CC44FF" },
]

// ─── Pentest Phases ───
const PHASES = ["Recon", "Discovery", "Browser", "IDOR", "Exploit", "Report"]

// ════════════════════════════════════════════════════════════
// LIVE FEED SYSTEM — Reactive, updates from session messages
// v2: Multiple event sources + URL detection + tool call tracking
// ════════════════════════════════════════════════════════════

type FeedEvent = {
  time: string
  phase: string
  action: string
  result: string
  level: "info" | "success" | "warning" | "error"
}

type FeedState = {
  target: string
  phase: string
  phaseIndex: number
  agent: string
  findings: number
  critical: number
  high: number
  medium: number
  low: number
  events: FeedEvent[]
  running: boolean
  torIP: string
  torActive: boolean
  memoryCount: number
}

const [feedState, setFeedState] = createSignal<FeedState>({
  target: "Not set",
  phase: "Idle",
  phaseIndex: -1,
  agent: "shadow-mimo",
  findings: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  events: [{ time: "--:--:--", phase: "IDLE", action: "Awaiting target", result: "...", level: "info" }],
  running: false,
  torIP: "OFF",
  torActive: false,
  memoryCount: 0,
})

function feedColor(level: string, skin: Skin): string {
  switch (level) {
    case "success": return skin.success
    case "warning": return skin.warning
    case "error": return skin.error
    default: return skin.info
  }
}

function nowTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
}

// Parse [FEED] lines from message output
function parseFeedLine(line: string): FeedEvent | null {
  const match = line.match(/\[FEED\]\s*(\d{2}:\d{2}:\d{2})\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(.+)/)
  if (!match) return null
  const [, time, phase, action, result] = match
  let level: FeedEvent["level"] = "info"
  const lower = (action + " " + result).toLowerCase()
  if (lower.includes("vulnerab") || lower.includes("found") || lower.includes("extracted") || lower.includes("compromise") || lower.includes("cracked") || lower.includes("dumped")) level = "success"
  else if (lower.includes("error") || lower.includes("fail") || lower.includes("critical")) level = "error"
  else if (lower.includes("warning") || lower.includes("suspicious")) level = "warning"
  return { time, phase: phase.toUpperCase(), action, result, level }
}

// Detect target URL/IP from any text
function detectTarget(text: string): string | null {
  // URL pattern
  const urlMatch = text.match(/https?:\/\/[^\s"'<>#]+/i)
  if (urlMatch) return urlMatch[0].slice(0, 50)
  // IP pattern
  const ipMatch = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/)
  if (ipMatch) return ipMatch[0]
  // Domain pattern
  const domainMatch = text.match(/\b[a-z0-9][-a-z0-9]*\.[a-z]{2,}(?:\.[a-z]{2,})?\b/i)
  if (domainMatch) return domainMatch[0]
  return null
}

// Detect phase from tool name
function detectPhaseFromTool(toolName: string): string | null {
  const lower = toolName.toLowerCase()
  if (lower.includes("recon")) return "RECON"
  if (lower.includes("vuln") || lower.includes("discovery")) return "DISCOVERY"
  if (lower.includes("browser")) return "BROWSER"
  if (lower.includes("idor")) return "IDOR"
  if (lower.includes("exploit")) return "EXPLOIT"
  if (lower.includes("report")) return "REPORT"
  if (lower.includes("docker_init")) return "INIT"
  return null
}

// Auto-generate feed event from tool call (when no [FEED] line is output by model)
function addToolFeedEvent(toolName: string, resultText: string) {
  const phase = detectPhaseFromTool(toolName)
  if (!phase) return
  
  const phaseMap: Record<string, number> = {
    INIT: -1, RECON: 0, DISCOVERY: 1, BROWSER: 2, IDOR: 3, EXPLOIT: 4, REPORT: 5
  }
  const phaseIdx = phaseMap[phase] ?? -1
  const phaseDisplay = phase === "INIT" ? "INIT" : PHASES[phaseIdx] || phase

  let level: FeedEvent["level"] = "info"
  const lower = resultText.toLowerCase()
  if (lower.includes("vulnerab") || lower.includes("found") || lower.includes("open") || lower.includes("extracted")) level = "success"
  else if (lower.includes("error") || lower.includes("fail") || lower.includes("critical")) level = "error"
  else if (lower.includes("warning") || lower.includes("suspicious")) level = "warning"

  const event: FeedEvent = {
    time: nowTime(),
    phase: phase,
    action: toolName.replace("shannon_", ""),
    result: resultText.slice(0, 60).replace(/\n/g, " ").trim() || "executed",
    level,
  }

  setFeedState(prev => {
    const allEvents = [...prev.events, event].slice(-15)
    const running = phase !== "REPORT"
    return {
      ...prev,
      events: allEvents,
      phase: phaseDisplay,
      phaseIndex: phaseIdx,
      running,
    }
  })
}

// Update feed from [FEED] lines in message content
function updateFeedFromContent(content: string) {
  const lines = content.split("\n")
  const feedLines = lines.filter(l => l.includes("[FEED]"))
  
  const newEvents: FeedEvent[] = []
  for (const line of feedLines) {
    const event = parseFeedLine(line)
    if (event) newEvents.push(event)
  }

  if (newEvents.length > 0) {
    setFeedState(prev => {
      const allEvents = [...prev.events, ...newEvents].slice(-15)
      let findings = prev.findings
      let critical = prev.critical
      let high = prev.high
      let medium = prev.medium
      let low = prev.low
      let phase = prev.phase
      let phaseIndex = prev.phaseIndex

      for (const evt of newEvents) {
        if (evt.result.toLowerCase().includes("found") || evt.result.toLowerCase().includes("vulnerab")) {
          findings++
          if (evt.level === "error") critical++
          else if (evt.level === "warning") high++
          else if (evt.level === "success") medium++
          else low++
        }
        const phaseMap: Record<string, number> = {
          RECON: 0, DISCOVERY: 1, BROWSER: 2, IDOR: 3, EXPLOIT: 4, REPORT: 5
        }
        if (phaseMap[evt.phase] !== undefined) {
          phaseIndex = phaseMap[evt.phase]
          phase = PHASES[phaseIndex]
        }
      }

      return { ...prev, events: allEvents, findings, critical, high, medium, low, phase, phaseIndex, running: true }
    })
  }
}

// ─── Skin helper ───
type Skin = {
  accent: string; primary: string; text: string; muted: string
  border: string; panel: string; bg: string; success: string
  warning: string; error: string; info: string; secondary: string
}

function look(theme: any): Skin {
  const t = theme || {}
  const get = (k: string, f: string) => {
    const v = t[k]; if (!v) return f
    if (typeof v === "string") return v
    return v.dark || v.light || f
  }
  return {
    accent: get("accent", "#FF3333"),
    primary: get("primary", "#FF0000"),
    secondary: get("secondary", "#CC0000"),
    text: get("text", "#FFFFFF"),
    muted: get("textMuted", "#C0C0C0"),
    border: get("border", "#2A2A2A"),
    panel: get("backgroundPanel", "#0A0A0A"),
    bg: get("background", "#000000"),
    success: get("success", "#00FF66"),
    warning: get("warning", "#FFDD00"),
    error: get("error", "#FF0000"),
    info: get("info", "#FF8800"),
  }
}

const tone = (api: TuiPluginApi) => look(api.theme.current)

// ════════════════════════════════════════════════════════════
// SLOT: home_logo
// ════════════════════════════════════════════════════════════
function homeLogoSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box flexDirection="row" gap={3} alignItems="center">
      <box flexDirection="column">
        {LOGO.map((line) => <text fg={s.accent}>{line}</text>)}
      </box>
      <box flexDirection="column" alignItems="center">
        {SHIELD.map((line) => <text fg={s.primary}>{line}</text>)}
      </box>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: home_bottom — Tagline + Agent bar + Commands
// ════════════════════════════════════════════════════════════
function homeBottomSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box width="100%" flexShrink={0} flexDirection="column" gap={0}>
      <box width="100%" alignItems="center" flexDirection="row" gap={2}>
        <text fg={s.accent}>  7 FREE MODELS</text>
        <text fg={s.muted}>—</text>
        <text fg={s.warning}>NO API KEY REQUIRED</text>
        <text fg={s.muted}>—</text>
        <text fg={s.success}>600+ KALI TOOLS</text>
        <text fg={s.muted}>—</text>
        <text fg={s.info}>INFINITE LOOP</text>
      </box>
      <box width="100%">
        <text fg={s.border}>  ────────────────────────────────────────────────────────────────────────────</text>
      </box>
      <box width="100%" flexDirection="row" gap={2} paddingLeft={2}>
        {AGENTS.map((agent) => (
          <text fg={agent.color}>●{agent.id}</text>
        ))}
      </box>
      <box width="100%" flexDirection="row" gap={3} paddingLeft={2} paddingTop={0}>
        <text fg={s.warning}><b>F1</b></text><text fg={s.muted}>shannon-scan</text>
        <text fg={s.warning}><b>F2</b></text><text fg={s.muted}>shannon-recon</text>
        <text fg={s.warning}><b>F3</b></text><text fg={s.muted}>shannon-report</text>
        <text fg={s.warning}><b>Ctrl+D</b></text><text fg={s.muted}>dashboard</text>
      </box>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: home_footer — Status bar
// ════════════════════════════════════════════════════════════
function homeFooterSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  const state = feedState()
  return (
    <box
      width="100%"
      flexDirection="row"
      justifyContent="space-between"
      backgroundColor={s.accent}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
    >
      <box flexDirection="row" gap={2}>
        <text fg={s.bg}><b>SHADOW CORE</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Agent: <b>{state.agent}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Phase: <b>{state.phase}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Target: <b>{state.target}</b></text>
      </box>
      <text fg={s.bg}>{state.running ? "● RUNNING" : "○ READY"} | 7 Free Models | Kali Native</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: app_bottom — Global status bar
// ════════════════════════════════════════════════════════════
function appBottomSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  const state = feedState()
  return (
    <box
      width="100%"
      flexDirection="row"
      justifyContent="space-between"
      backgroundColor={s.accent}
      paddingLeft={1}
      paddingRight={1}
      flexShrink={0}
    >
      <box flexDirection="row" gap={2}>
        <text fg={s.bg}><b>SHADOW CORE</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Agent: <b>{state.agent}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Phase: <b>{state.phase}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Target: <b>{state.target}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Findings: <b>{state.findings}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Tor: <b>{state.torActive ? state.torIP : "OFF"}</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Mem: <b>{state.memoryCount}</b></text>
      </box>
      <text fg={s.bg}>{state.running ? "● RUNNING" : "○ READY"} | 7 Free Models | Kali Native</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_title
// ════════════════════════════════════════════════════════════
function sidebarTitleSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box flexDirection="row" gap={1} alignItems="center">
      <text fg={s.accent}><b>SHADOW CORE</b></text>
      <text fg={s.muted}>v1.0</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_content (order 0) — Pentest Feed
// ════════════════════════════════════════════════════════════
function sidebarFeedSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  const sid = value?.session_id ? String(value.session_id).slice(0, 8) : "--------"
  const state = feedState()
  const events = state.events.slice(-8)
  return (
    <box
      border
      borderColor={s.warning}
      backgroundColor={s.panel}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      gap={0}
    >
      <box flexDirection="row" justifyContent="space-between">
        <text fg={s.warning}><b>▰ PENTEST FEED ▰</b></text>
        <text fg={state.running ? s.success : s.muted}>{state.running ? "● LIVE" : "○ IDLE"}</text>
      </box>
      <text fg={s.border}> ────────────────────</text>
      <text fg={s.muted}> </text>
      {events.map((evt) => (
        <box flexDirection="row" gap={1}>
          <text fg={s.muted}>[{evt.time}]</text>
          <text fg={feedColor(evt.level, s)}>{evt.phase}</text>
          <text fg={s.text}>{evt.action}</text>
        </box>
      ))}
      <text fg={s.muted}> </text>
      <text fg={s.border}> ────────────────────</text>
      <text fg={s.muted}> Target: <span style={{ fg: s.warning }}>{state.target}</span></text>
      <text fg={s.muted}> Phase: <span style={{ fg: s.accent }}>{state.phase}</span></text>
      <text fg={s.muted}> Findings: <span style={{ fg: s.error }}>{state.findings}</span></text>
      <text fg={s.muted}> Session: {sid}</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_content (order 200) — Agents list
// ════════════════════════════════════════════════════════════
function sidebarAgentsSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box
      border
      borderColor={s.border}
      backgroundColor={s.panel}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      gap={0}
    >
      <text fg={s.accent}><b>▰ 7 FREE AGENTS ▰</b></text>
      <text fg={s.border}> ────────────────────</text>
      <text fg={s.muted}> </text>
      {AGENTS.map((agent, i) => (
        <box flexDirection="row" gap={1}>
          <text fg={i === 0 ? s.accent : s.muted}>{i === 0 ? "▶" : " "}</text>
          <text fg={agent.color}>●</text>
          <text fg={s.text}>{agent.id}</text>
        </box>
      ))}
      <text fg={s.muted}> </text>
      <text fg={s.muted}> Tab to switch agent</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_content (order 700) — Phases (reactive)
// ════════════════════════════════════════════════════════════
function sidebarPhasesSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  const state = feedState()
  return (
    <box
      border
      borderColor={s.border}
      backgroundColor={s.panel}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={1}
      paddingRight={1}
      flexDirection="column"
      gap={0}
    >
      <text fg={s.info}><b>▰ PENTEST PHASES ▰</b></text>
      <text fg={s.border}> ────────────────────</text>
      <text fg={s.muted}> </text>
      {PHASES.map((phase, i) => {
        const isActive = state.phaseIndex === i
        const isDone = state.phaseIndex > i
        return (
          <box flexDirection="row" gap={1}>
            <text fg={isActive ? s.accent : (isDone ? s.success : s.muted)}>
              {isActive ? "▶" : isDone ? "✓" : "○"}
            </text>
            <text fg={isActive ? s.text : (isDone ? s.success : s.muted)}>{phase}</text>
            {isActive ? <text fg={s.accent}>◄</text> : null}
          </box>
        )
      })}
      <text fg={s.muted}> </text>
      <text fg={s.warning}> F1: Start full scan</text>
      <text fg={s.warning}> F2: Recon only</text>
      <text fg={s.warning}> F3: Report</text>
      <text fg={s.warning}> Ctrl+D: Dashboard</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_footer
// ════════════════════════════════════════════════════════════
function sidebarFooterSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box flexDirection="row" gap={1} justifyContent="center">
      <text fg={s.success}>●</text>
      <text fg={s.muted}>Kali Native Mode</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: home_prompt_right
// ════════════════════════════════════════════════════════════
function homePromptRightSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <text fg={s.muted}>
      <span style={{ fg: s.accent }}>●</span> 7 agents ready
    </text>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: session_prompt_right
// ════════════════════════════════════════════════════════════
function sessionPromptRightSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  const sid = value?.session_id ? String(value.session_id).slice(0, 8) : "--------"
  return (
    <text fg={s.muted}>
      <span style={{ fg: s.accent }}>SHADOW</span>:{sid}
    </text>
  )
}

// ════════════════════════════════════════════════════════════
// COMPONENT: Dashboard Route (Ctrl+D)
// ════════════════════════════════════════════════════════════
function Dashboard(props: { api: TuiPluginApi; meta: TuiPluginMeta }): JSX.Element {
  const dim = useTerminalDimensions()
  const s = tone(props.api)

  useBindings(() => ({
    enabled: () => props.api.route.current.name === "shadow.dashboard",
    commands: [
      { name: "shadow_home", run() { props.api.route.navigate("home") } },
    ],
    bindings: [
      { command: "shadow_home", keys: ["escape"] },
    ],
  }))

  return (
    <box width={dim().width} height={dim().height} backgroundColor={s.bg} flexDirection="column">
      <box width="100%" flexDirection="row" justifyContent="space-between"
        backgroundColor={s.panel} paddingLeft={2} paddingRight={2} paddingTop={1} paddingBottom={1}
        borderBottom borderColor={s.accent}>
        <box flexDirection="row" gap={2}>
          <text fg={s.accent}><b>SHADOW CORE</b></text>
          <text fg={s.muted}>v1.0</text>
          <text fg={s.muted}>|</text>
          <text fg={s.warning}>Dashboard</text>
        </box>
        <text fg={s.muted}>ESC: Back to chat</text>
      </box>

      <box flexDirection="row" flexGrow={1} paddingLeft={1} paddingRight={1} paddingTop={1} gap={1}>
        {/* Left: Agents */}
        <box width="28%" border borderColor={s.border} backgroundColor={s.panel}
          paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexDirection="column" gap={1}>
          <text fg={s.accent}><b>▰ 7 FREE AGENTS ▰</b></text>
          <text fg={s.border}>────────────────────</text>
          {AGENTS.map((agent, i) => (
            <box flexDirection="row" gap={1}>
              <text fg={i === 0 ? s.accent : s.muted}>{i === 0 ? "▶" : " "}</text>
              <text fg={agent.color}>●</text>
              <text fg={s.text}>{agent.id}</text>
              <text fg={s.muted}>—</text>
              <text fg={s.muted}>{agent.name}</text>
            </box>
          ))}
          <text fg={s.border}>────────────────────</text>
          <text fg={s.muted}> Tab to cycle agents</text>
        </box>

        {/* Center: Pentest Status */}
        <box flexGrow={1} border borderColor={s.border} backgroundColor={s.panel}
          paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexDirection="column" gap={1}>
          <text fg={s.warning}><b>▰ PENTEST STATUS ▰</b></text>
          <text fg={s.border}>────────────────────</text>
          <text fg={s.accent}><b>PHASES</b></text>
          {PHASES.map((phase, i) => {
            const isActive = feedState().phaseIndex === i
            const isDone = feedState().phaseIndex > i
            return (
              <box flexDirection="row" gap={1}>
                <text fg={isActive ? s.accent : (isDone ? s.success : s.muted)}>
                  {isActive ? "▶" : isDone ? "✓" : "○"}
                </text>
                <text fg={isActive ? s.text : (isDone ? s.success : s.muted)}>{phase}</text>
                {isActive ? <text fg={s.accent}>◄ ACTIVE</text> : null}
                {isDone ? <text fg={s.success}>✓ DONE</text> : null}
              </box>
            )
          })}
          <text fg={s.border}>────────────────────</text>
          <text fg={s.accent}><b>TARGET</b></text>
          <text fg={s.text}> Target: <span style={{ fg: s.warning }}>{feedState().target}</span></text>
          <text fg={s.text}> Mode:   <span style={{ fg: s.success }}>Kali Native</span></text>
          <text fg={s.text}> Loop:   <span style={{ fg: s.info }}>Infinite</span></text>
          <text fg={s.border}>────────────────────</text>
          <text fg={s.accent}><b>FINDINGS</b></text>
          <text fg={s.error}>  Critical:  {feedState().critical}</text>
          <text fg={s.warning}>  High:      {feedState().high}</text>
          <text fg={s.info}>  Medium:    {feedState().medium}</text>
          <text fg={s.success}>  Low:       {feedState().low}</text>
        </box>

        {/* Right: Shield + Commands */}
        <box width="28%" flexDirection="column" gap={1}>
          <box border borderColor={s.accent} backgroundColor={s.panel}
            alignItems="center" paddingTop={1} paddingBottom={1}>
            {SHIELD.map((line) => <text fg={s.accent}>{line}</text>)}
            <text fg={s.muted}> </text>
            <text fg={s.accent}><b>SHADOW CORE</b></text>
            <text fg={s.muted}>No Limits</text>
          </box>
          <box border borderColor={s.border} backgroundColor={s.panel}
            paddingTop={1} paddingBottom={1} paddingLeft={2} paddingRight={2} flexDirection="column" gap={1}>
            <text fg={s.accent}><b>QUICK COMMANDS</b></text>
            <text fg={s.border}>────────────────</text>
            <text fg={s.warning}><b>F1</b></text>
            <text fg={s.text}>  /shannon-scan</text>
            <text fg={s.muted}>  Full pentest</text>
            <text fg={s.muted}> </text>
            <text fg={s.warning}><b>F2</b></text>
            <text fg={s.text}>  /shannon-recon</text>
            <text fg={s.muted}>  Recon only</text>
            <text fg={s.muted}> </text>
            <text fg={s.warning}><b>F3</b></text>
            <text fg={s.text}>  /shannon-report</text>
            <text fg={s.muted}>  Report gen</text>
          </box>
        </box>
      </box>

      <box width="100%" flexDirection="row" justifyContent="space-between"
        backgroundColor={s.accent} paddingLeft={1} paddingRight={1}>
        <text fg={s.bg}><b>SHADOW CORE</b></text>
        <text fg={s.bg}>Agent: {feedState().agent} | Phase: {feedState().phase} | Target: {feedState().target} | Findings: {feedState().findings} | Tor: {feedState().torActive ? feedState().torIP : "OFF"} | Mem: {feedState().memoryCount}</text>
      </box>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// TUI PLUGIN ENTRY POINT
// v2: Robust event listening for live feed
// ════════════════════════════════════════════════════════════
const tui: TuiPlugin = async (api: TuiPluginApi, _options: any, meta: TuiPluginMeta) => {
  if (_options?.enabled === false) return

  // 1. Theme
  await api.theme.install("./themes/shadow-core.json")
  api.theme.set("shadow-core")

  // 2. Vignette
  const fx = new VignetteEffect(0.35)
  const post = fx.apply.bind(fx)
  api.renderer.addPostProcessFn(post)
  api.lifecycle.onDispose(() => { api.renderer.removePostProcessFn(post) })

  // 3. LIVE FEED — File-based polling (most reliable)
  // The main plugin writes [FEED] lines to /tmp/shadow-core-feed.log
  // and the target to /tmp/shadow-core-target.txt
  // The TUI polls these files every 2 seconds for live updates.
  const FEED_FILE = "/tmp/shadow-core-feed.log"
  const TARGET_FILE = "/tmp/shadow-core-target.txt"
  let lastFeedSize = 0
  let lastTarget = ""
  
  const pollInterval = setInterval(() => {
    try {
      // Check target file
      try {
        const target = readFileSync(TARGET_FILE, "utf-8").trim()
        if (target && target !== lastTarget) {
          lastTarget = target
          setFeedState(prev => ({ ...prev, target, running: true }))
        }
      } catch {}
      
      // Check feed file — only read new lines
      let stats
      try { stats = statSync(FEED_FILE) } catch { return }
      if (stats.size <= lastFeedSize) return
      
      const fullContent = readFileSync(FEED_FILE, "utf-8")
      const newContent = fullContent.slice(lastFeedSize)
      lastFeedSize = stats.size
      
      // Parse [FEED] lines from new content
      const lines = newContent.split("\n").filter(l => l.includes("[FEED]"))
      const newEvents: FeedEvent[] = []
      
      for (const line of lines) {
        const event = parseFeedLine(line)
        if (event) newEvents.push(event)
      }
      
      if (newEvents.length > 0) {
        setFeedState(prev => {
          const allEvents = [...prev.events, ...newEvents].slice(-15)
          let findings = prev.findings
          let critical = prev.critical
          let high = prev.high
          let medium = prev.medium
          let low = prev.low
          let phase = prev.phase
          let phaseIndex = prev.phaseIndex
          
          let torIP = prev.torIP
          let torActive = prev.torActive
          let memoryCount = prev.memoryCount

          for (const evt of newEvents) {
            // Detect Tor events
            if (evt.phase === "TOR") {
              if (evt.action.includes("tor-start") || evt.action.includes("ip-rotate")) {
                torActive = true
                const ipMatch = evt.result.match(/IP:\s*(.+)/)
                if (ipMatch) torIP = ipMatch[1]
              } else if (evt.action.includes("tor-stop")) {
                torActive = false
                torIP = "OFF"
              }
            }
            // Detect Memory events
            if (evt.phase === "MEMORY") {
              if (evt.action.includes("save")) memoryCount++
            }
            if (evt.result.toLowerCase().includes("finding") || evt.result.toLowerCase().includes("vulnerab") || evt.result.toLowerCase().includes("found")) {
              findings++
              if (evt.level === "error") critical++
              else if (evt.level === "warning") high++
              else if (evt.level === "success") medium++
              else low++
            }
            const phaseMap: Record<string, number> = {
              INIT: -1, RECON: 0, DISCOVERY: 1, BROWSER: 2, IDOR: 3, EXPLOIT: 4, REPORT: 5
            }
            if (phaseMap[evt.phase] !== undefined) {
              phaseIndex = phaseMap[evt.phase]
              phase = phaseIndex >= 0 ? PHASES[phaseIndex] : "Init"
            }
          }
          
          return { ...prev, events: allEvents, findings, critical, high, medium, low, phase, phaseIndex, running: true, torIP, torActive, memoryCount }
        })
      }
    } catch {}
  }, 2000) // Poll every 2 seconds
  
  api.lifecycle.onDispose(() => { clearInterval(pollInterval) })
  
  // 4. Dashboard route
  api.route.register([{
    name: "shadow.dashboard",
    render: () => <Dashboard api={api} meta={meta} />,
  }])

  // 5. Register all slots
  api.slots.register({ order: 0, slots: { home_logo: homeLogoSlot } })
  api.slots.register({ order: 0, slots: { home_bottom: homeBottomSlot } })
  api.slots.register({ order: 0, slots: { home_footer: homeFooterSlot } })
  api.slots.register({ order: 0, slots: { home_prompt_right: homePromptRightSlot } })
  api.slots.register({ order: 0, slots: { session_prompt_right: sessionPromptRightSlot } })
  api.slots.register({ order: 0, slots: { sidebar_title: sidebarTitleSlot } })
  api.slots.register({ order: 0, slots: { sidebar_content: sidebarFeedSlot } })
  api.slots.register({ order: 200, slots: { sidebar_content: sidebarAgentsSlot } })
  api.slots.register({ order: 700, slots: { sidebar_content: sidebarPhasesSlot } })
  api.slots.register({ order: 0, slots: { sidebar_footer: sidebarFooterSlot } })
  api.slots.register({ order: 0, slots: { app_bottom: appBottomSlot } })

  // 6. Keybindings
  const command = {
    dashboard: "shadow_dashboard",
    scan: "shadow_scan",
    recon: "shadow_recon",
    report: "shadow_report",
    home: "shadow_home",
  }
  api.keymap.registerLayer({
    commands: [
      { name: command.dashboard, title: "Shadow Core Dashboard", category: "Shadow Core", namespace: "palette", slashName: "shadow-dash",
        run() { api.route.navigate("shadow.dashboard") } },
      { name: command.scan, title: "Shannon Full Scan", category: "Shadow Core", namespace: "palette", slashName: "shannon-scan",
        run() { api.route.navigate("home") } },
      { name: command.recon, title: "Shannon Recon", category: "Shadow Core", namespace: "palette", slashName: "shannon-recon",
        run() { api.route.navigate("home") } },
      { name: command.report, title: "Shannon Report", category: "Shadow Core", namespace: "palette", slashName: "shannon-report",
        run() { api.route.navigate("home") } },
    ],
    bindings: [
      { command: command.dashboard, keys: ["ctrl+d"] },
      { command: command.scan, keys: ["f1"] },
      { command: command.recon, keys: ["f2"] },
      { command: command.report, keys: ["f3"] },
    ],
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: "shadow-core-tui",
  tui,
}

export default plugin
