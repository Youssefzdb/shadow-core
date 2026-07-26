#!/bin/bash
# ============================================================
# Shadow Core — Terminal Wrapper for OpenCode
# 7 Free Models — No API Key Required
# ============================================================

export SHANNON_NATIVE_MODE=true

# ─── Colors ───
RED='\033[1;31m'
DARK_RED='\033[0;31m'
DIM='\033[2m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

# ─── Detect opencode binary ───
OPENCODE_BIN=""
# Try PATH first
if command -v opencode &>/dev/null; then
    OPENCODE_BIN="$(command -v opencode)"
# Try common install locations
elif [[ -f "/root/.opencode/bin/opencode" ]]; then
    OPENCODE_BIN="/root/.opencode/bin/opencode"
elif [[ -f "$HOME/.opencode/bin/opencode" ]]; then
    OPENCODE_BIN="$HOME/.opencode/bin/opencode"
elif [[ -f "/usr/local/bin/opencode" ]]; then
    OPENCODE_BIN="/usr/local/bin/opencode"
elif [[ -f "/usr/bin/opencode" ]]; then
    OPENCODE_BIN="/usr/bin/opencode"
else
    echo -e "${RED}[Shadow Core]${RESET} opencode not found!"
    echo -e "${YELLOW}Install with:${RESET} npm install -g opencode-ai"
    echo -e "${YELLOW}Or:${RESET} curl -fsSL https://opencode.ai/install | bash"
    exit 1
fi

# ─── Resolve script directory (for plugin path) ───
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ─── Logo ───
show_logo() {
  clear
  echo -e "${RED}"
  echo "  ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗"
  echo "  ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║"
  echo "  ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║"
  echo "  ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║"
  echo "  ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝"
  echo "  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝"
  echo ""
  echo -e "   ██████╗ ██████╗ ██████╗ ███████╗"
  echo -e "   ██╔════╝██╔═══██╗██╔══██╗██╔════╝"
  echo -e "   ██║     ██║   ██║██████╔╝█████╗  "
  echo -e "   ██║     ██║   ██║██╔══██║██╔══╝  "
  echo -e "   ╚██████╗╚██████╔╝██║  ██║███████╗"
  echo -e "    ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝"
  echo -e "${DARK_RED}"
  echo "        [ Autonomous Penetration Testing Engine v1.0 ]"
  echo "             [ Kali Native Mode — No Limits ]"
  echo -e "${DIM}              Powered by Shannon AI × OpenCode${RESET}"
  echo ""
  echo -e "  ${RED}●${RESET} Target: ${1:-'Not specified — use /shannon-scan <target>'}"
  echo -e "  ${RED}●${RESET} Mode:   Native Kali Linux"
  echo -e "  ${RED}●${RESET} Loop:   Autonomous Infinite"
  echo -e "  ${RED}●${RESET} Models: 7 Free Agents (No API Key)"
  echo ""
  echo -e "${DIM}  ──────────────────────────────────────────────────────${RESET}"
  echo ""
  echo -e "  ${GREEN}Available Agents (switch with Tab):${RESET}"
  echo -e "    ${YELLOW}shadow-mimo${RESET}      MiMo V2.5 (Xiaomi flagship)"
  echo -e "    ${YELLOW}shadow-pickle${RESET}    Big Pickle (stealth frontier)"
  echo -e "    ${YELLOW}shadow-deepseek${RESET}  DeepSeek V4 Flash"
  echo -e "    ${YELLOW}shadow-laguna${RESET}    Laguna S 2.1"
  echo -e "    ${YELLOW}shadow-ling${RESET}      Ling 3.0 Flash"
  echo -e "    ${YELLOW}shadow-nemotron${RESET}  NVIDIA Nemotron 3 Ultra"
  echo -e "    ${YELLOW}shadow-north${RESET}     North Mini Code"
  echo ""
  echo -e "${DIM}  ──────────────────────────────────────────────────────${RESET}"
  echo ""
}

# ─── Ensure config exists ───
ensure_config() {
    local CONFIG_DIR="$HOME/.config/opencode"
    local CONFIG_FILE="$CONFIG_DIR/opencode.jsonc"

    mkdir -p "$CONFIG_DIR"

    # If config exists and has agents, skip
    if [[ -f "$CONFIG_FILE" ]]; then
        if grep -q "shadow-mimo" "$CONFIG_FILE" 2>/dev/null; then
            return 0
        fi
    fi

    # Write Shadow Core config with 7 free models
    cat > "$CONFIG_FILE" << 'CONFIG_EOF'
{
  "$schema": "https://opencode.ai/config.json",

  // Shadow Core — 7 Free Models, No API Key
  "model": "opencode/mimo-v2.5-free",
  "small_model": "opencode/ling-3.0-flash-free",
  "default_agent": "build",

  "agent": {
    "build": {
      "model": "opencode/mimo-v2.5-free",
      "description": "Shadow Core — autonomous penetration testing engine",
      "steps": 200,
      "tools": {
        "bash": true, "read": true, "edit": true, "grep": true,
        "glob": true, "list": true, "write": true,
        "webfetch": true, "websearch": true,
        "task": true, "todowrite": true, "skill": true
      }
    },
    "plan": {
      "model": "opencode/nemotron-3-ultra-free",
      "description": "Shadow Core strategist — pentest planning",
      "steps": 100,
      "tools": {
        "read": true, "grep": true, "glob": true, "list": true,
        "webfetch": true, "websearch": true
      }
    },
    "general": {
      "model": "opencode/deepseek-v4-flash-free",
      "description": "Shadow Core recon — information gathering",
      "steps": 100,
      "tools": {
        "bash": true, "read": true, "edit": true, "grep": true,
        "glob": true, "list": true,
        "webfetch": true, "websearch": true
      }
    },
    "shadow-mimo": {
      "model": "opencode/mimo-v2.5-free", "mode": "primary",
      "description": "MiMo V2.5 — Xiaomi flagship, comparable to Claude Sonnet 4.6",
      "color": "#FF6B35", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "shadow-pickle": {
      "model": "opencode/big-pickle", "mode": "primary",
      "description": "Big Pickle — stealth model, frontier coding",
      "color": "#7CB342", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "shadow-deepseek": {
      "model": "opencode/deepseek-v4-flash-free", "mode": "primary",
      "description": "DeepSeek V4 Flash — fast reasoning & code analysis",
      "color": "#42A5F5", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "shadow-laguna": {
      "model": "opencode/laguna-s-2.1-free", "mode": "primary",
      "description": "Laguna S 2.1 — deep analysis & vulnerability research",
      "color": "#26C6DA", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "shadow-ling": {
      "model": "opencode/ling-3.0-flash-free", "mode": "primary",
      "description": "Ling 3.0 Flash — ultra-fast scanning & quick recon",
      "color": "#FFCA28", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "shadow-nemotron": {
      "model": "opencode/nemotron-3-ultra-free", "mode": "primary",
      "description": "NVIDIA Nemotron 3 Ultra — heavy reasoning, exploit design",
      "color": "#76B900", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "shadow-north": {
      "model": "opencode/north-mini-code-free", "mode": "primary",
      "description": "North Mini Code — lightweight coding & script generation",
      "color": "#AB47BC", "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    }
  },

  "permission": {
    "bash": "allow", "read": "allow", "edit": "allow", "write": "allow",
    "grep": "allow", "glob": "allow", "list": "allow",
    "webfetch": "allow", "websearch": "allow"
  },

  "compaction": { "auto": true },
  "subagent_depth": 2
}
CONFIG_EOF

    echo -e "${GREEN}[Shadow Core]${RESET} Config written to $CONFIG_FILE"
}

# ─── Main ───
case "$1" in
  --version|-v)
    echo -e "${RED}Shadow Core${RESET} v1.0 ${DIM}(opencode $($OPENCODE_BIN --version 2>&1))${RESET} ${DARK_RED}[Kali Native]${RESET}"
    ;;

  --help|-h)
    show_logo
    echo -e "${DARK_RED}Usage:${RESET}"
    echo "  shadow                      Open Shadow Core TUI"
    echo "  shadow run '<message>'      Run a single autonomous task"
    echo "  shadow --version            Show version"
    echo "  shadow --help               Show this help"
    echo ""
    echo -e "${DARK_RED}Shannon Commands (inside TUI):${RESET}"
    echo "  /shannon-scan <target>      Full autonomous pentest"
    echo "  /shannon-recon <target>     Reconnaissance only"
    echo "  /shannon-report             Generate professional report"
    echo ""
    echo -e "${DARK_RED}Switch Agents (Tab key):${RESET}"
    echo "  shadow-mimo, shadow-pickle, shadow-deepseek,"
    echo "  shadow-laguna, shadow-ling, shadow-nemotron, shadow-north"
    echo ""
    ;;

  "")
    # Default — show logo, ensure config, launch TUI
    show_logo
    sleep 0.8
    ensure_config
    rm -f /tmp/shadow-core-feed.log /tmp/shadow-core-target.txt 2>/dev/null
    exec "$OPENCODE_BIN"
    ;;

  *)
    # Pass arguments to opencode
    ensure_config
    rm -f /tmp/shadow-core-feed.log /tmp/shadow-core-target.txt 2>/dev/null
    exec "$OPENCODE_BIN" "$@"
    ;;
esac
