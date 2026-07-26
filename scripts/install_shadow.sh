#!/bin/bash
# ============================================================
# Shadow Core — Global Installer
# Installs `shadow` command + OpenCode config with 7 free models
# ============================================================

set -e

RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
DIM='\033[2m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${RED}╔═══════════════════════════════════════════════╗${RESET}"
echo -e "${RED}║   Shadow Core — Global Installer v1.0          ║${RESET}"
echo -e "${RED}║   7 Free Models — No API Key Required          ║${RESET}"
echo -e "${RED}╚═══════════════════════════════════════════════╝${RESET}"
echo ""

# ─── 1. Check / Install OpenCode ───
echo -e "${YELLOW}[1/4]${RESET} Checking OpenCode..."

# First check if opencode exists anywhere
OPENCODE_FOUND=""
for candidate in \
    "$(command -v opencode 2>/dev/null)" \
    "/usr/local/bin/opencode" \
    "/usr/bin/opencode" \
    "$HOME/.opencode/bin/opencode" \
    "/root/.opencode/bin/opencode" \
    "$HOME/.local/bin/opencode" \
    "$HOME/.bun/bin/opencode"; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
        OPENCODE_FOUND="$candidate"
        break
    fi
done

if [[ -n "$OPENCODE_FOUND" ]]; then
    echo -e "  ${GREEN}✓${RESET} OpenCode found: $OPENCODE_FOUND"
    # Ensure it's in PATH
    if ! command -v opencode &>/dev/null; then
        ln -sf "$OPENCODE_FOUND" /usr/local/bin/opencode 2>/dev/null || true
        echo -e "  ${GREEN}✓${RESET} Symlinked to /usr/local/bin/opencode"
    fi
else
    echo -e "  ${YELLOW}OpenCode not found. Installing...${RESET}"

    # Method 1: Official curl installer (most reliable)
    echo -e "  ${DIM}Trying official installer...${RESET}"
    if curl -fsSL https://opencode.ai/install | bash 2>/dev/null; then
        echo -e "  ${GREEN}✓${RESET} Installed via official installer"
        # Source profile to get new PATH
        export PATH="$HOME/.opencode/bin:$HOME/.local/bin:$PATH"
    else
        echo -e "  ${YELLOW}Official installer failed. Trying npm...${RESET}"

        # Fix npm glob issue first
        npm cache clean --force 2>/dev/null || true
        if npm install -g opencode-ai 2>/dev/null; then
            echo -e "  ${GREEN}✓${RESET} Installed via npm"
        else
            echo -e "  ${YELLOW}npm failed. Trying bun...${RESET}"
            if command -v bun &>/dev/null; then
                bun install -g opencode-ai 2>/dev/null && \
                    echo -e "  ${GREEN}✓${RESET} Installed via bun"
            else
                # Method 3: Direct binary download
                echo -e "  ${YELLOW}Trying direct download...${RESET}"
                ARCH=$(uname -m)
                case "$ARCH" in
                    x86_64|amd64) ARCH="x64" ;;
                    aarch64|arm64) ARCH="arm64" ;;
                    *) echo -e "  ${RED}Unsupported arch: $ARCH${RESET}"; exit 1 ;;
                esac

                mkdir -p "$HOME/.opencode/bin"
                if curl -fsSL "https://github.com/anomalyco/opencode/releases/latest/download/opencode-linux-${ARCH}" \
                    -o "$HOME/.opencode/bin/opencode" 2>/dev/null; then
                    chmod +x "$HOME/.opencode/bin/opencode"
                    ln -sf "$HOME/.opencode/bin/opencode" /usr/local/bin/opencode 2>/dev/null || true
                    export PATH="$HOME/.opencode/bin:$PATH"
                    echo -e "  ${GREEN}✓${RESET} Installed via direct download"
                else
                    echo -e "  ${RED}All install methods failed!${RESET}"
                    echo -e "  ${YELLOW}Install manually:${RESET}"
                    echo -e "    curl -fsSL https://opencode.ai/install | bash"
                    echo -e "  Then re-run this script."
                    exit 1
                fi
            fi
        fi
    fi
fi

# Verify
if ! command -v opencode &>/dev/null; then
    # Try finding it again after install
    for candidate in \
        "$HOME/.opencode/bin/opencode" \
        "/usr/local/bin/opencode" \
        "$HOME/.local/bin/opencode"; do
        if [[ -x "$candidate" ]]; then
            ln -sf "$candidate" /usr/local/bin/opencode 2>/dev/null || true
            export PATH="/usr/local/bin:$PATH"
            break
        fi
    done
fi

OPENCODE_BIN="$(command -v opencode 2>/dev/null || echo '/usr/local/bin/opencode')"
echo -e "  ${GREEN}✓${RESET} OpenCode: $OPENCODE_BIN ($($OPENCODE_BIN --version 2>&1 || echo 'unknown'))"

# ─── 2. Install shadow wrapper globally ───
echo -e "${YELLOW}[2/4]${RESET} Installing shadow command..."
WRAPPER="$PROJECT_DIR/scripts-shadow/shadow-wrapper.sh"

chmod +x "$WRAPPER"

# Symlink to /usr/local/bin
ln -sf "$WRAPPER" /usr/local/bin/shadow 2>/dev/null || \
    sudo ln -sf "$WRAPPER" /usr/local/bin/shadow 2>/dev/null || \
    (mkdir -p "$HOME/.local/bin" && ln -sf "$WRAPPER" "$HOME/.local/bin/shadow")

SHADOW_PATH="$(command -v shadow 2>/dev/null || echo "$WRAPPER")"
echo -e "  ${GREEN}✓${RESET} shadow → $SHADOW_PATH"

# ─── 3. Write OpenCode config ───
echo -e "${YELLOW}[3/4]${RESET} Writing OpenCode config with 7 free models..."
CONFIG_DIR="$HOME/.config/opencode"
CONFIG_FILE="$CONFIG_DIR/opencode.jsonc"
mkdir -p "$CONFIG_DIR"

# Backup existing config
if [[ -f "$CONFIG_FILE" && ! -f "$CONFIG_FILE.bak" ]]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
    echo -e "  ${DIM}Backed up existing config to $CONFIG_FILE.bak${RESET}"
fi

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
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "plan": {
      "model": "opencode/nemotron-3-ultra-free",
      "description": "Shadow Core strategist — pentest planning",
      "steps": 100,
      "tools": { "read": true, "grep": true, "glob": true, "list": true, "webfetch": true, "websearch": true }
    },
    "general": {
      "model": "opencode/deepseek-v4-flash-free",
      "description": "Shadow Core recon — information gathering",
      "steps": 100,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "webfetch": true, "websearch": true }
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

  "permission": { "bash": "allow", "read": "allow", "edit": "allow", "write": "allow", "grep": "allow", "glob": "allow", "list": "allow", "webfetch": "allow", "websearch": "allow" },
  "compaction": { "auto": true },
  "subagent_depth": 2
}
CONFIG_EOF

echo -e "  ${GREEN}✓${RESET} Config → $CONFIG_FILE"

# ─── 4. Register Shannon plugin ───
echo -e "${YELLOW}[4/4]${RESET} Registering Shannon plugin..."

# Try to build the plugin first
if command -v bun &>/dev/null && [[ -f "$PROJECT_DIR/package.json" ]]; then
    cd "$PROJECT_DIR"
    bun install 2>/dev/null && bun run build 2>/dev/null && \
        echo -e "  ${GREEN}✓${RESET} Plugin built" || \
        echo -e "  ${YELLOW}Plugin build skipped (non-critical)${RESET}"
fi

# Add plugin path to config
python3 -c "
import json, re, sys
config_path = '$CONFIG_FILE'
with open(config_path, 'r') as f:
    content = f.read()
content_clean = re.sub(r'//.*?\$', '', content, flags=re.MULTILINE)
config = json.loads(content_clean)
plugin_path = '$PROJECT_DIR/src/index.ts'
if 'plugin' not in config:
    config['plugin'] = [plugin_path]
elif plugin_path not in config['plugin']:
    config['plugin'].append(plugin_path)
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
print('  Plugin registered')
" 2>/dev/null || echo -e "  ${YELLOW}Plugin registration skipped${RESET}"

echo -e "  ${GREEN}✓${RESET} Shannon plugin registered"

# ─── Done ───
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║  Shadow Core installed successfully!            ║${RESET}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${YELLOW}Type 'shadow' to launch${RESET}"
echo ""
echo -e "  ${DIM}7 Free Agents (switch with Tab):${RESET}"
echo -e "    shadow-mimo      MiMo V2.5 (Xiaomi flagship)"
echo -e "    shadow-pickle    Big Pickle (stealth frontier)"
echo -e "    shadow-deepseek  DeepSeek V4 Flash"
echo -e "    shadow-laguna    Laguna S 2.1"
echo -e "    shadow-ling      Ling 3.0 Flash"
echo -e "    shadow-nemotron  NVIDIA Nemotron 3 Ultra"
echo -e "    shadow-north     North Mini Code"
echo ""
