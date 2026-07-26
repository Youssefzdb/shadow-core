/** @jsxImportSource @opentui/solid */
import { useTerminalDimensions, type JSX } from "@opentui/solid"
import { useBindings, useKeymapSelector } from "@opentui/keymap/solid"
import { RGBA, VignetteEffect, type KeyEvent, type Renderable } from "@opentui/core"
import { createBindingLookup, type BindingConfig } from "@opentui/keymap/extras"
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiPluginModule, TuiSlotPlugin } from "@opencode-ai/plugin/tui"

// ════════════════════════════════════════════════════════════
// Shadow Core TUI — Full Custom Interface
// ════════════════════════════════════════════════════════════

// ─── Shadow Core ASCII Art ───
const SHADOW_LOGO = [
  "  ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗",
  "  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║",
  "  ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║",
  "  ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║",
  "  ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝",
  "  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝",
]

const SHIELD = [
  "     ███████╗",
  "    ██╔══════╝",
  "    ██║██████╗",
  "    ██║╚════██║",
  "    ╚██████╔╝",
  "     ╚═════╝",
]

// ─── 7 Free Agents ───
const AGENTS = [
  { id: "shadow-mimo", name: "MiMo V2.5", desc: "Xiaomi flagship", color: "#FF6B35" },
  { id: "shadow-pickle", name: "Big Pickle", desc: "Stealth frontier", color: "#7CB342" },
  { id: "shadow-deepseek", name: "DeepSeek V4", desc: "Fast reasoning", color: "#42A5F5" },
  { id: "shadow-laguna", name: "Laguna S 2.1", desc: "Vuln research", color: "#26C6DA" },
  { id: "shadow-ling", name: "Ling 3.0", desc: "Quick recon", color: "#FFCA28" },
  { id: "shadow-nemotron", name: "Nemotron 3", desc: "Exploit design", color: "#76B900" },
  { id: "shadow-north", name: "North Mini", desc: "Script gen", color: "#AB47BC" },
]

// ─── Pentest Phases ───
const PHASES = [
  { name: "Recon", icon: "01", color: "#42A5F5" },
  { name: "Discovery", icon: "02", color: "#FFCA28" },
  { name: "Browser", icon: "03", color: "#FF6B35" },
  { name: "IDOR", icon: "04", color: "#AB47BC" },
  { name: "Exploit", icon: "05", color: "#CC0000" },
  { name: "Report", icon: "06", color: "#00AA44" },
]

// ─── Shannon Commands ───
const COMMANDS = [
  { cmd: "/shannon-scan", desc: "Full autonomous pentest", key: "F1" },
  { cmd: "/shannon-recon", desc: "Reconnaissance only", key: "F2" },
  { cmd: "/shannon-report", desc: "Generate report", key: "F3" },
  { cmd: "shadow-dash", desc: "Open dashboard", key: "F4" },
]

// ─── Skin helper — extract colors from theme ───
type Skin = {
  accent: string; primary: string; text: string; muted: string
  border: string; panel: string; bg: string; success: string
  warning: string; error: string; info: string; secondary: string
}

function look(theme: any): Skin {
  const t = theme || {}
  const get = (key: string, fallback: string) => {
    const val = t[key]
    if (!val) return fallback
    if (typeof val === "string") return val
    return val.dark || val.light || fallback
  }
  return {
    accent: get("accent", "#FF3333"),
    primary: get("primary", "#CC0000"),
    secondary: get("secondary", "#8B0000"),
    text: get("text", "#E0E0E0"),
    muted: get("textMuted", "#8B95A7"),
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

// ─── Keymap ───
const command = {
  dashboard: "shadow_dashboard",
  scan: "shadow_scan",
  recon: "shadow_recon",
  report: "shadow_report",
  agent_cycle: "shadow_agent_cycle",
  home: "shadow_home",
}

const defaultKeymap: BindingConfig<Renderable, KeyEvent> = {
  [command.dashboard]: "ctrl+d",
  [command.scan]: "f1",
  [command.recon]: "f2",
  [command.report]: "f3",
  [command.agent_cycle]: "ctrl+a",
  [command.home]: "escape",
}

// ════════════════════════════════════════════════════════════
// COMPONENT: Agent Badge
// ════════════════════════════════════════════════════════════
function AgentBadge(skin: Skin, agent: typeof AGENTS[0], active: boolean): JSX.Element {
  return (
    <box flexDirection="row" gap={1}>
      <text fg={active ? skin.accent : skin.muted}>{active ? "▶" : " "}</text>
      <text fg={agent.color}>{agent.id}</text>
      <text fg={skin.muted}>{agent.desc}</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// COMPONENT: Phase Tracker
// ════════════════════════════════════════════════════════════
function PhaseTracker(skin: Skin, currentPhase: number): JSX.Element {
  return (
    <box flexDirection="column" gap={0}>
      <text fg={skin.warning}><b>PENTEST PHASES</b></text>
      <text fg={skin.muted}> </text>
      {PHASES.map((phase, i) => {
        const done = i < currentPhase
        const current = i === currentPhase
        const color = done ? skin.success : current ? phase.color : skin.muted
        return (
          <box flexDirection="row" gap={1}>
            <text fg={color}>
              {done ? "✓" : current ? "▶" : "○"} {phase.icon}
            </text>
            <text fg={color}>{phase.name}</text>
            {current ? <text fg={skin.accent}>◄ ACTIVE</text> : null}
          </box>
        )
      })}
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// COMPONENT: Status Bar
// ════════════════════════════════════════════════════════════
function StatusBar(skin: Skin, agent: string, target: string): JSX.Element {
  return (
    <box
      width="100%"
      flexDirection="row"
      justifyContent="space-between"
      backgroundColor={skin.panel}
      borderColor={skin.border}
      border={false}
      paddingTop={0}
      paddingBottom={0}
      paddingLeft={1}
      paddingRight={1}
    >
      <box flexDirection="row" gap={2}>
        <text fg={skin.accent}><b>SHADOW CORE</b></text>
        <text fg={skin.muted}>|</text>
        <text fg={skin.info}>Agent: <span style={{ fg: skin.accent }}>{agent}</span></text>
        <text fg={skin.muted}>|</text>
        <text fg={skin.warning}>Target: <span style={{ fg: skin.text }}>{target}</span></text>
      </box>
      <box flexDirection="row" gap={2}>
        <text fg={skin.muted}>7 Free Models</text>
        <text fg={skin.muted}>|</text>
        <text fg={skin.success}>● Kali Native</text>
      </box>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// COMPONENT: Dashboard Screen (full custom route)
// ════════════════════════════════════════════════════════════
function Dashboard(props: {
  api: TuiPluginApi
  meta: TuiPluginMeta
}): JSX.Element {
  const dim = useTerminalDimensions()
  const skin = tone(props.api)

  useBindings(() => ({
    enabled: () => props.api.route.current.name === "shadow.dashboard",
    commands: [
      {
        name: command.home,
        run() { props.api.route.navigate("home") },
      },
      {
        name: command.scan,
        run() { props.api.route.navigate("home"); },
      },
      {
        name: command.recon,
        run() { props.api.route.navigate("home"); },
      },
      {
        name: command.report,
        run() { props.api.route.navigate("home"); },
      },
    ],
    bindings: [
      { command: command.home, keys: ["escape"] },
      { command: command.scan, keys: ["f1"] },
      { command: command.recon, keys: ["f2"] },
      { command: command.report, keys: ["f3"] },
    ],
  }))

  return (
    <box
      width={dim().width}
      height={dim().height}
      backgroundColor={skin.bg}
      flexDirection="column"
    >
      {/* ─── Header ─── */}
      <box
        width="100%"
        flexDirection="row"
        justifyContent="space-between"
        backgroundColor={skin.panel}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        borderBottom
        borderColor={skin.accent}
      >
        <box flexDirection="row" gap={2}>
          <text fg={skin.accent}><b>SHADOW CORE</b></text>
          <text fg={skin.muted}>v1.0</text>
          <text fg={skin.muted}>|</text>
          <text fg={skin.warning}>Dashboard</text>
        </box>
        <box flexDirection="row" gap={2}>
          <text fg={skin.muted}>ESC: Home</text>
          <text fg={skin.muted}>|</text>
          <text fg={skin.success}>● ONLINE</text>
        </box>
      </box>

      {/* ─── Main Content ─── */}
      <box
        flexDirection="row"
        flexGrow={1}
        paddingLeft={1}
        paddingRight={1}
        paddingTop={1}
        gap={1}
      >
        {/* ── Left Panel: Agents ── */}
        <box
          width="30%"
          border
          borderColor={skin.border}
          backgroundColor={skin.panel}
          flexDirection="column"
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          gap={1}
        >
          <text fg={skin.accent}><b>═══ 7 FREE AGENTS ═══</b></text>
          <text fg={skin.muted}> </text>
          {AGENTS.map((agent, i) => (
            <box flexDirection="row" gap={1}>
              <text fg={i === 0 ? skin.accent : skin.muted}>{i === 0 ? "▶" : " "}</text>
              <text fg={agent.color}>{agent.id}</text>
              <text fg={skin.text}>—</text>
              <text fg={skin.muted}>{agent.name}</text>
            </box>
          ))}
          <text fg={skin.muted}> </text>
          <text fg={skin.muted}>Press <span style={{ fg: skin.accent }}>Ctrl+A</span> to cycle</text>
          <text fg={skin.muted}>Press <span style={{ fg: skin.accent }}>Tab</span> in chat</text>
        </box>

        {/* ── Center: Pentest Status ── */}
        <box
          flexGrow={1}
          border
          borderColor={skin.border}
          backgroundColor={skin.panel}
          flexDirection="column"
          paddingTop={1}
          paddingBottom={1}
          paddingLeft={2}
          paddingRight={2}
          gap={1}
        >
          <text fg={skin.warning}><b>═══ PENTEST STATUS ═══</b></text>
          <text fg={skin.muted}> </text>
          {PhaseTracker(skin, 0)}
          <text fg={skin.muted}> </text>
          <text fg={skin.accent}><b>═══ TARGET INFO ═══</b></text>
          <text fg={skin.muted}> </text>
          <text fg={skin.text}>Target: <span style={{ fg: skin.warning }}>Not specified</span></text>
          <text fg={skin.text}>Mode:   <span style={{ fg: skin.success }}>Kali Native</span></text>
          <text fg={skin.text}>Loop:   <span style={{ fg: skin.info }}>Autonomous Infinite</span></text>
          <text fg={skin.muted}> </text>
          <text fg={skin.accent}><b>═══ FINDINGS ═══</b></text>
          <text fg={skin.muted}> </text>
          <text fg={skin.error}>  Critical:  0</text>
          <text fg={skin.warning}>  High:      0</text>
          <text fg={skin.info}>  Medium:    0</text>
          <text fg={skin.success}>  Low:       0</text>
          <text fg={skin.muted}>  Info:      0</text>
        </box>

        {/* ── Right: Shield + Commands ── */}
        <box
          width="25%"
          flexDirection="column"
          gap={1}
        >
          {/* Shield logo */}
          <box
            border
            borderColor={skin.accent}
            backgroundColor={skin.panel}
            flexDirection="column"
            alignItems="center"
            paddingTop={1}
            paddingBottom={1}
          >
            {SHIELD.map((line) => (
              <text fg={skin.accent}>{line}</text>
            ))}
            <text fg={skin.muted}> </text>
            <text fg={skin.accent}><b>SHADOW CORE</b></text>
            <text fg={skin.muted}>No Limits</text>
          </box>

          {/* Commands */}
          <box
            border
            borderColor={skin.border}
            backgroundColor={skin.panel}
            flexDirection="column"
            paddingTop={1}
            paddingBottom={1}
            paddingLeft={2}
            paddingRight={2}
            gap={1}
          >
            <text fg={skin.accent}><b>QUICK COMMANDS</b></text>
            <text fg={skin.muted}> </text>
            <text fg={skin.warning}>F1</text>
            <text fg={skin.text}>  /shannon-scan</text>
            <text fg={skin.muted}>  Full pentest</text>
            <text fg={skin.muted}> </text>
            <text fg={skin.warning}>F2</text>
            <text fg={skin.text}>  /shannon-recon</text>
            <text fg={skin.muted}>  Recon only</text>
            <text fg={skin.muted}> </text>
            <text fg={skin.warning}>F3</text>
            <text fg={skin.text}>  /shannon-report</text>
            <text fg={skin.muted}>  Report gen</text>
            <text fg={skin.muted}> </text>
            <text fg={skin.warning}>F4 / Ctrl+D</text>
            <text fg={skin.text}>  This dashboard</text>
          </box>
        </box>
      </box>

      {/* ─── Footer ─── */}
      {StatusBar(skin, "shadow-mimo", "Not set")}
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: Home Logo — Shadow Core ASCII art
// ════════════════════════════════════════════════════════════
function homeLogoSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box flexDirection="column">
      {SHADOW_LOGO.map((line: string) => (
        <text fg={s.accent}>{line}</text>
      ))}
      <text fg={s.muted}> </text>
      <text fg={s.info}>  Autonomous Penetration Testing Engine v1.0</text>
      <text fg={s.muted}>  Powered by Shannon AI × OpenCode × 7 Free Models</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: Home Prompt Right — agent indicator
// ════════════════════════════════════════════════════════════
function homePromptRightSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <text fg={s.muted}>
      <span style={{ fg: s.accent }}>●</span> 7 agents ready
    </text>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: Session Prompt Right — active agent + target
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
// SLOT: Home Bottom — agent list + quick start
// ════════════════════════════════════════════════════════════
function homeBottomSlot(ctx: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box width="100%" flexShrink={0} gap={1} flexDirection="column">
      {/* Agent selector */}
      <box
        width="100%"
        border
        borderColor={s.border}
        backgroundColor={s.panel}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        gap={1}
      >
        <text fg={s.accent}><b>7 FREE AGENTS — No API Key Required</b></text>
        <box flexDirection="row" gap={2} flexWrap="wrap">
          {AGENTS.map((agent) => (
            <text fg={agent.color}>  {agent.id}</text>
          ))}
        </box>
        <text fg={s.muted}>  Switch with Tab key · Ctrl+D for dashboard</text>
      </box>

      {/* Commands */}
      <box
        width="100%"
        border
        borderColor={s.border}
        backgroundColor={s.panel}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        flexDirection="row"
        gap={3}
      >
        <text fg={s.warning}><b>F1</b></text><text fg={s.text}>/shannon-scan</text>
        <text fg={s.muted}>|</text>
        <text fg={s.warning}><b>F2</b></text><text fg={s.text}>/shannon-recon</text>
        <text fg={s.muted}>|</text>
        <text fg={s.warning}><b>F3</b></text><text fg={s.text}>/shannon-report</text>
        <text fg={s.muted}>|</text>
        <text fg={s.warning}><b>Ctrl+D</b></text><text fg={s.text}>Dashboard</text>
      </box>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// SLOT: Sidebar Content — Shadow Core branding + pentest info
// ════════════════════════════════════════════════════════════
function sidebarTopSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box
      border
      borderColor={s.accent}
      backgroundColor={s.panel}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      flexDirection="column"
      gap={1}
    >
      <text fg={s.accent}><b>SHADOW CORE</b></text>
      <text fg={s.muted}>v1.0 — Kali Native</text>
      <text fg={s.muted}> </text>
      <text fg={s.success}>● 7 Free Models</text>
      <text fg={s.success}>● 600+ Kali Tools</text>
      <text fg={s.success}>● Infinite Loop</text>
    </box>
  )
}

function sidebarAgentsSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box
      border
      borderColor={s.border}
      backgroundColor={s.panel}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      flexDirection="column"
      gap={0}
    >
      <text fg={s.warning}><b>AGENTS</b></text>
      <text fg={s.muted}> </text>
      {AGENTS.map((agent) => (
        <text fg={agent.color}>  {agent.id}</text>
      ))}
      <text fg={s.muted}> </text>
      <text fg={s.muted}>Tab to switch</text>
    </box>
  )
}

function sidebarCommandsSlot(ctx: any, value: any): JSX.Element {
  const s = look(ctx.theme?.current)
  return (
    <box
      border
      borderColor={s.border}
      backgroundColor={s.panel}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      paddingRight={2}
      flexDirection="column"
      gap={0}
    >
      <text fg={s.warning}><b>SHANNON CMDS</b></text>
      <text fg={s.muted}> </text>
      <text fg={s.text}>  /shannon-scan</text>
      <text fg={s.muted}>  Full pentest</text>
      <text fg={s.muted}> </text>
      <text fg={s.text}>  /shannon-recon</text>
      <text fg={s.muted}>  Recon only</text>
      <text fg={s.muted}> </text>
      <text fg={s.text}>  /shannon-report</text>
      <text fg={s.muted}>  Report gen</text>
    </box>
  )
}

// ════════════════════════════════════════════════════════════
// TUI PLUGIN ENTRY POINT
// ════════════════════════════════════════════════════════════
const tui: TuiPlugin = async (api: TuiPluginApi, _options: any, meta: TuiPluginMeta) => {
  if (_options?.enabled === false) return

  // ─── 1. Install & set Shadow Core theme ───
  await api.theme.install("./themes/shadow-core.json")
  api.theme.set("shadow-core")

  // ─── 2. Vignette effect — dark edges for cinematic feel ───
  const fx = new VignetteEffect(0.4)
  const post = fx.apply.bind(fx)
  api.renderer.addPostProcessFn(post)
  api.lifecycle.onDispose(() => {
    api.renderer.removePostProcessFn(post)
  })

  // ─── 3. Register Dashboard route ───
  api.route.register([
    {
      name: "shadow.dashboard",
      render: ({ params }) => <Dashboard api={api} meta={meta} />,
    },
  ])

  // ─── 4. Register slots ───
  // Home screen logo
  api.slots.register({
    order: 0,
    slots: { home_logo: homeLogoSlot },
  })

  // Home screen bottom — agent list + commands
  api.slots.register({
    order: 0,
    slots: { home_bottom: homeBottomSlot },
  })

  // Prompt right indicators
  api.slots.register({
    order: 0,
    slots: { home_prompt_right: homePromptRightSlot },
  })
  api.slots.register({
    order: 0,
    slots: { session_prompt_right: sessionPromptRightSlot },
  })

  // Sidebar — Shadow Core branding (top)
  api.slots.register({
    order: 0,
    slots: { sidebar_content: sidebarTopSlot },
  })

  // Sidebar — agents list (middle)
  api.slots.register({
    order: 200,
    slots: { sidebar_content: sidebarAgentsSlot },
  })

  // Sidebar — Shannon commands (bottom)
  api.slots.register({
    order: 700,
    slots: { sidebar_content: sidebarCommandsSlot },
  })

  // ─── 5. Register global keybindings ───
  api.keymap.registerLayer({
    commands: [
      {
        name: command.dashboard,
        title: "Shadow Core Dashboard",
        category: "Shadow Core",
        namespace: "palette",
        slashName: "shadow-dash",
        run() {
          api.route.navigate("shadow.dashboard")
        },
      },
      {
        name: command.scan,
        title: "Shannon Full Scan",
        category: "Shadow Core",
        namespace: "palette",
        slashName: "shannon-scan",
        run() {
          api.route.navigate("home")
        },
      },
      {
        name: command.recon,
        title: "Shannon Recon",
        category: "Shadow Core",
        namespace: "palette",
        slashName: "shannon-recon",
        run() {
          api.route.navigate("home")
        },
      },
      {
        name: command.report,
        title: "Shannon Report",
        category: "Shadow Core",
        namespace: "palette",
        slashName: "shannon-report",
        run() {
          api.route.navigate("home")
        },
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
