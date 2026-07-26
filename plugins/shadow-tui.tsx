/** @jsxImportSource @opentui/solid */
import { useTerminalDimensions, type JSX } from "@opentui/solid"
import { createSignal, createMemo, onMount, onCleanup } from "solid-js"
import { useBindings, useKeymapSelector } from "@opentui/keymap/solid"
import { RGBA, VignetteEffect, type KeyEvent, type Renderable } from "@opentui/core"
import { createBindingLookup, type BindingConfig } from "@opentui/keymap/extras"
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiPluginModule, TuiSlotPlugin } from "@opencode-ai/plugin/tui"

// ════════════════════════════════════════════════════════════
// SHADOW CORE — Split Screen TUI (Design 4)
// Top: Logo + Shield | Left: Chat | Right: Pentest Feed | Bottom: Status Bar
// ════════════════════════════════════════════════════════════

// ─── Shadow Core ASCII Logo (large) ───
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
}

// Global reactive feed state — shared across all slot renders
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
})

// Feed event colors
function feedColor(level: string, skin: Skin): string {
  switch (level) {
    case "success": return skin.success
    case "warning": return skin.warning
    case "error": return skin.error
    default: return skin.info
  }
}

// Parse [FEED] lines from message output
function parseFeedLine(line: string): FeedEvent | null {
  const match = line.match(/\[FEED\]\s*(\d{2}:\d{2}:\d{2})\s*\|\s*(\w+)\s*\|\s*(.+?)\s*\|\s*(.+)/)
  if (!match) return null
  const [, time, phase, action, result] = match
  let level: FeedEvent["level"] = "info"
  const lower = (action + " " + result).toLowerCase()
  if (lower.includes("vulnerab") || lower.includes("found") || lower.includes("extracted") || lower.includes("compromise")) level = "success"
  else if (lower.includes("error") || lower.includes("fail") || lower.includes("critical")) level = "error"
  else if (lower.includes("warning") || lower.includes("suspicious")) level = "warning"
  return { time, phase: phase.toUpperCase(), action, result, level }
}

// Update feed from message content
function updateFeedFromMessage(content: string) {
  const lines = content.split("\n")
  const feedLines = lines.filter(l => l.includes("[FEED]"))
  if (feedLines.length === 0) return

  const newEvents: FeedEvent[] = []
  for (const line of feedLines) {
    const event = parseFeedLine(line)
    if (event) newEvents.push(event)
  }
  if (newEvents.length === 0) return

  setFeedState(prev => {
    const allEvents = [...prev.events, ...newEvents].slice(-15) // Keep last 15
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
      // Update phase
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

// Auto-generate feed ticks when running (simulated activity)
let tickInterval: any = null
function startFeedTicker() {
  if (tickInterval) return
  tickInterval = setInterval(() => {
    setFeedState(prev => {
      if (!prev.running) return prev
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      const tickEvents: FeedEvent[] = [
        { time, phase: prev.phase.toUpperCase(), action: "scanning", result: "in progress...", level: "info" },
      ]
      return { ...prev, events: [...prev.events, ...tickEvents].slice(-15) }
    })
  }, 30000) // Every 30 seconds
}

function stopFeedTicker() {
  if (tickInterval) { clearInterval(tickInterval); tickInterval = null }
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
    primary: get("primary", "#CC0000"),
    secondary: get("secondary", "#8B0000"),
    text: get("text", "#E0E0E0"),
    muted: get("textMuted", "#A0A0A0"),
    border: get("border", "#333333"),
    panel: get("backgroundPanel", "#1A1A1A"),
    bg: get("background", "#0D0D0D"),
    success: get("success", "#00AA44"),
    warning: get("warning", "#FFAA00"),
    error: get("error", "#FF3333"),
    info: get("info", "#FF6B35"),
  }
}

const tone = (api: TuiPluginApi) => look(api.theme.current)

// ─── Commands ───
const command = {
  dashboard: "shadow_dashboard",
  scan: "shadow_scan",
  recon: "shadow_recon",
  report: "shadow_report",
  home: "shadow_home",
}

// ════════════════════════════════════════════════════════════
// SLOT: home_logo — Large logo + shield + tagline
// ════════════════════════════════════════════════════════════
function homeLogoSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box flexDirection="row" gap={3} alignItems="center">
      {/* Logo */}
      <box flexDirection="column">
        {LOGO.map((line) => <text fg={s.accent}>{line}</text>)}
      </box>
      {/* Shield */}
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
      {/* Tagline */}
      <box width="100%" alignItems="center" flexDirection="row" gap={2}>
        <text fg={s.accent}>  7 FREE MODELS</text>
        <text fg={s.muted}>—</text>
        <text fg={s.warning}>NO API KEY REQUIRED</text>
        <text fg={s.muted}>—</text>
        <text fg={s.success}>600+ KALI TOOLS</text>
        <text fg={s.muted}>—</text>
        <text fg={s.info}>INFINITE LOOP</text>
      </box>

      {/* Separator */}
      <box width="100%">
        <text fg={s.border}>  ────────────────────────────────────────────────────────────────────────────</text>
      </box>

      {/* Agent list */}
      <box width="100%" flexDirection="row" gap={2} paddingLeft={2}>
        {AGENTS.map((agent) => (
          <text fg={agent.color}>●{agent.id}</text>
        ))}
      </box>

      {/* Commands */}
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
// SLOT: home_footer — Status bar (thin red bar at bottom)
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
    >
      <text fg={s.bg}><b>SHADOW CORE</b></text>
      <text fg={s.bg}>Agent: {state.agent} | Phase: {state.phase} | Target: {state.target} | Findings: {state.findings}</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: app_bottom — Global status bar (visible in all screens)
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
      </box>
      <text fg={s.bg}>{state.running ? "● RUNNING" : "○ READY"} | 7 Free Models | Kali Native</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_title — Replace default title
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
// SLOT: sidebar_content (order 0) — Pentest Feed (top)
// ════════════════════════════════════════════════════════════
function sidebarFeedSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  const sid = value?.session_id ? String(value.session_id).slice(0, 8) : "--------"
  const state = feedState()
  const events = state.events.slice(-8) // Show last 8 in sidebar
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
// SLOT: sidebar_content (order 200) — Agents list (middle)
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
// SLOT: sidebar_content (order 700) — Phases (bottom)
// ════════════════════════════════════════════════════════════
function sidebarPhasesSlot(ctx: any, value: any): JSX.Element {
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
      <text fg={s.info}><b>▰ PENTEST PHASES ▰</b></text>
      <text fg={s.border}> ────────────────────</text>
      <text fg={s.muted}> </text>
      {PHASES.map((phase, i) => (
        <box flexDirection="row" gap={1}>
          <text fg={i === 0 ? s.accent : s.muted}>{i === 0 ? "▶" : "○"}</text>
          <text fg={i === 0 ? s.text : s.muted}>{phase}</text>
          {i === 0 ? <text fg={s.accent}>◄</text> : null}
        </box>
      ))}
      <text fg={s.muted}> </text>
      <text fg={s.warning}> F1: Start full scan</text>
      <text fg={s.warning}> F2: Recon only</text>
      <text fg={s.warning}> F3: Report</text>
      <text fg={s.warning}> Ctrl+D: Dashboard</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: sidebar_footer — Compact info
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
// SLOT: home_prompt_right — Agent indicator
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
// SLOT: session_prompt_right — Shadow indicator
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
      { name: command.home, run() { props.api.route.navigate("home") } },
    ],
    bindings: [
      { command: command.home, keys: ["escape"] },
    ],
  }))

  return (
    <box width={dim().width} height={dim().height} backgroundColor={s.bg} flexDirection="column">
      {/* Header */}
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

      {/* Body — 3 columns */}
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
          {PHASES.map((phase, i) => (
            <box flexDirection="row" gap={1}>
              <text fg={i === 0 ? s.accent : s.muted}>{i === 0 ? "▶" : "○"}</text>
              <text fg={i === 0 ? s.text : s.muted}>{phase}</text>
              {i === 0 ? <text fg={s.accent}>◄ ACTIVE</text> : null}
            </box>
          ))}
          <text fg={s.border}>────────────────────</text>
          <text fg={s.accent}><b>TARGET</b></text>
          <text fg={s.text}> Target: <span style={{ fg: s.warning }}>Not set</span></text>
          <text fg={s.text}> Mode:   <span style={{ fg: s.success }}>Kali Native</span></text>
          <text fg={s.text}> Loop:   <span style={{ fg: s.info }}>Infinite</span></text>
          <text fg={s.border}>────────────────────</text>
          <text fg={s.accent}><b>FINDINGS</b></text>
          <text fg={s.error}>  Critical:  {feedState().critical}</text>
          <text fg={s.warning}>  High:      {feedState().high}</text>
          <text fg={s.info}>  Medium:    {feedState().medium}</text>
          <text fg={s.success}>  Low:       {feedState().low}</text>
          <text fg={s.muted}>  Info:      {feedState().findings - feedState().critical - feedState().high - feedState().medium - feedState().low}</text>
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

      {/* Status bar */}
      <box width="100%" flexDirection="row" justifyContent="space-between"
        backgroundColor={s.accent} paddingLeft={1} paddingRight={1}>
        <text fg={s.bg}><b>SHADOW CORE</b></text>
        <text fg={s.bg}>Agent: {feedState().agent} | Phase: {feedState().phase} | Target: {feedState().target} | Findings: {feedState().findings}</text>
      </box>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// TUI PLUGIN ENTRY POINT
// ════════════════════════════════════════════════════════════
const tui: TuiPlugin = async (api: TuiPluginApi, _options: any, meta: TuiPluginMeta) => {
  if (_options?.enabled === false) return

  // 1. Theme
  await api.theme.install("./themes/shadow-core.json")
  api.theme.set("shadow-core")

  // 2. Vignette — cinematic dark edges
  const fx = new VignetteEffect(0.35)
  const post = fx.apply.bind(fx)
  api.renderer.addPostProcessFn(post)
  api.lifecycle.onDispose(() => { api.renderer.removePostProcessFn(post) })

  // 2b. Listen to session messages for live feed updates
  const eventBus = (api as any).event
  if (eventBus?.on) {
    const unsubMessage = eventBus.on("message.part", (event: any) => {
      try {
        const text = event?.properties?.text || event?.text || ""
        if (typeof text === "string" && text.includes("[FEED]")) {
          updateFeedFromMessage(text)
        }
        // Auto-detect target from first user message
        if (event?.type === "message.updated" || event?.properties?.type === "message.updated") {
          const content = JSON.stringify(event)
          const targetMatch = content.match(/(?:target|objectif|scope)[:\s]+(.+?)[\n\r"']/i)
          if (targetMatch) {
            setFeedState(prev => ({ ...prev, target: targetMatch[1].trim().slice(0, 40), running: true }))
            startFeedTicker()
          }
        }
      } catch {}
    })
    api.lifecycle.onDispose(() => { unsubMessage?.(); stopFeedTicker() })
  } else {
    // Fallback: start ticker anyway for visual feedback
    startFeedTicker()
    api.lifecycle.onDispose(() => stopFeedTicker())
  }

  // 3. Dashboard route
  api.route.register([{
    name: "shadow.dashboard",
    render: () => <Dashboard api={api} meta={meta} />,
  }])

  // 4. Register all slots
  // Home screen
  api.slots.register({ order: 0, slots: { home_logo: homeLogoSlot } })
  api.slots.register({ order: 0, slots: { home_bottom: homeBottomSlot } })
  api.slots.register({ order: 0, slots: { home_footer: homeFooterSlot } })
  api.slots.register({ order: 0, slots: { home_prompt_right: homePromptRightSlot } })

  // Session
  api.slots.register({ order: 0, slots: { session_prompt_right: sessionPromptRightSlot } })

  // Sidebar
  api.slots.register({ order: 0, slots: { sidebar_title: sidebarTitleSlot } })
  api.slots.register({ order: 0, slots: { sidebar_content: sidebarFeedSlot } })
  api.slots.register({ order: 200, slots: { sidebar_content: sidebarAgentsSlot } })
  api.slots.register({ order: 700, slots: { sidebar_content: sidebarPhasesSlot } })
  api.slots.register({ order: 0, slots: { sidebar_footer: sidebarFooterSlot } })

  // Global status bar (all screens)
  api.slots.register({ order: 0, slots: { app_bottom: appBottomSlot } })

  // 5. Keybindings
  api.keymap.registerLayer({
    commands: [
      {
        name: command.dashboard, title: "Shadow Core Dashboard",
        category: "Shadow Core", namespace: "palette", slashName: "shadow-dash",
        run() { api.route.navigate("shadow.dashboard") },
      },
      {
        name: command.scan, title: "Shannon Full Scan",
        category: "Shadow Core", namespace: "palette", slashName: "shannon-scan",
        run() { api.route.navigate("home") },
      },
      {
        name: command.recon, title: "Shannon Recon",
        category: "Shadow Core", namespace: "palette", slashName: "shannon-recon",
        run() { api.route.navigate("home") },
      },
      {
        name: command.report, title: "Shannon Report",
        category: "Shadow Core", namespace: "palette", slashName: "shannon-report",
        run() { api.route.navigate("home") },
      },
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
