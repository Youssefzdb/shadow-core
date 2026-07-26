/** @jsxImportSource @opentui/solid */
import { useTerminalDimensions, type JSX } from "@opentui/solid"
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

// ─── Mock Pentest Feed Events ───
const FEED_EVENTS = [
  { time: "--:--:--", event: "Awaiting target...", color: "muted" },
]

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
      <text fg={s.bg}>Agent: <b>shadow-mimo</b> | Phase: Idle | Target: Not set | Findings: 0</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: app_bottom — Global status bar (visible in all screens)
// ════════════════════════════════════════════════════════════
function appBottomSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
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
        <text fg={s.bg}>Agent: <b>shadow-mimo</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Phase: Recon</text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Target: <b>Not set</b></text>
        <text fg={s.bg}>|</text>
        <text fg={s.bg}>Findings: 0</text>
      </box>
      <text fg={s.bg}>7 Free Models ● Kali Native</text>
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
      <text fg={s.warning}><b>▰ PENTEST FEED ▰</b></text>
      <text fg={s.border}> ────────────────────</text>
      <text fg={s.muted}> </text>
      <text fg={s.muted}>[--:--:--] Awaiting target...</text>
      <text fg={s.muted}> </text>
      <text fg={s.border}> ────────────────────</text>
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
          <text fg={s.error}>  Critical:  0</text>
          <text fg={s.warning}>  High:      0</text>
          <text fg={s.info}>  Medium:    0</text>
          <text fg={s.success}>  Low:       0</text>
          <text fg={s.muted}>  Info:      0</text>
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
        <text fg={s.bg}>Agent: shadow-mimo | Phase: Idle | Target: Not set | Findings: 0</text>
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
