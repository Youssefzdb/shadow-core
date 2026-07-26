/** @jsxImportSource @opentui/solid */
import type { JSX } from "@opentui/solid"
import type { TuiPlugin, TuiPluginApi, TuiPluginMeta, TuiPluginModule, TuiSlotPlugin } from "@opencode-ai/plugin/tui"

// ─── Shadow Core ASCII Art ───
const SHADOW_LOGO = [
  "  ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗",
  "  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║",
  "  ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║",
  "  ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║",
  "  ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝",
  "  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝",
]

const SHADOW_SUBTITLE = "Autonomous Penetration Testing Engine"

// ─── Skin helper ───
function skin(theme: any) {
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

// ─── Home Logo Slot ───
function homeLogo(ctx: any): JSX.Element {
  const s = skin(ctx.theme?.current)
  return (
    <box flexDirection="column" paddingTop={0} paddingBottom={0}>
      {SHADOW_LOGO.map((line: string) => (
        <text fg={s.accent}>{line}</text>
      ))}
      <text fg={s.muted}> </text>
      <text fg={s.info}>{SHADOW_SUBTITLE}</text>
      <text fg={s.muted}> Powered by Shannon AI × OpenCode × 7 Free Models</text>
    </box>
  )
}

// ─── Sidebar Content Slot ───
function sidebarContent(ctx: any, value: any): JSX.Element {
  const s = skin(ctx.theme?.current)
  const sessionId = value?.session_id ? String(value.session_id).slice(0, 8) : "--------"
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
      gap={1}
    >
      <text fg={s.accent}>
        <b>SHADOW CORE</b>
      </text>
      <text fg={s.muted}>v1.0 — Kali Native Mode</text>
      <text fg={s.text}> </text>
      <text fg={s.info}>
        <b>7 Free Agents:</b>
      </text>
      <text fg={s.text}>  shadow-mimo      MiMo V2.5</text>
      <text fg={s.text}>  shadow-pickle    Big Pickle</text>
      <text fg={s.text}>  shadow-deepseek  DeepSeek V4</text>
      <text fg={s.text}>  shadow-laguna    Laguna S 2.1</text>
      <text fg={s.text}>  shadow-ling      Ling 3.0</text>
      <text fg={s.text}>  shadow-nemotron  Nemotron 3</text>
      <text fg={s.text}>  shadow-north     North Mini</text>
      <text fg={s.text}> </text>
      <text fg={s.warning}>
        <b>Commands:</b>
      </text>
      <text fg={s.text}>  /shannon-scan    Full pentest</text>
      <text fg={s.text}>  /shannon-recon   Recon only</text>
      <text fg={s.text}>  /shannon-report  Report gen</text>
      <text fg={s.muted}> </text>
      <text fg={s.muted}>Session: {sessionId}</text>
    </box>
  )
}

// ─── TUI Plugin ───
const tui: TuiPlugin = async (api: TuiPluginApi, _options: any, _meta: TuiPluginMeta) => {
  // Install and set Shadow Core theme
  await api.theme.install("./themes/shadow-core.json")
  api.theme.set("shadow-core")

  // Register slots
  const homeSlot: TuiSlotPlugin = {
    order: 0,
    slots: {
      home_logo(ctx: any) {
        return homeLogo(ctx)
      },
    },
  }

  const sidebarSlot: TuiSlotPlugin = {
    order: 50,
    slots: {
      sidebar_content(ctx: any, value: any) {
        return sidebarContent(ctx, value)
      },
    },
  }

  api.slots.register(homeSlot)
  api.slots.register(sidebarSlot)
}

const plugin: TuiPluginModule & { id: string } = {
  id: "shadow-core-tui",
  tui,
}

export default plugin
