#!/bin/bash
# ============================================================
# Shadow Core — Global Installer
# Installs `shadow` command + OpenCode config with 7 free models
# + Shadow Core custom TUI theme & plugin
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
echo -e "${RED}║   Shadow Core — Global Installer v1.1          ║${RESET}"
echo -e "${RED}║   7 Free Models + Custom TUI — No API Key       ║${RESET}"
echo -e "${RED}╚═══════════════════════════════════════════════╝${RESET}"
echo ""

# ─── 1. Check / Install OpenCode ───
echo -e "${YELLOW}[1/5]${RESET} Checking OpenCode..."

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
    if ! command -v opencode &>/dev/null; then
        ln -sf "$OPENCODE_FOUND" /usr/local/bin/opencode 2>/dev/null || true
        echo -e "  ${GREEN}✓${RESET} Symlinked to /usr/local/bin/opencode"
    fi
else
    echo -e "  ${YELLOW}OpenCode not found. Installing...${RESET}"
    if curl -fsSL https://opencode.ai/install | bash 2>/dev/null; then
        echo -e "  ${GREEN}✓${RESET} Installed via official installer"
        export PATH="$HOME/.opencode/bin:$HOME/.local/bin:$PATH"
    else
        echo -e "  ${YELLOW}Official installer failed. Trying npm...${RESET}"
        npm cache clean --force 2>/dev/null || true
        if npm install -g opencode-ai 2>/dev/null; then
            echo -e "  ${GREEN}✓${RESET} Installed via npm"
        elif command -v bun &>/dev/null; then
            bun install -g opencode-ai 2>/dev/null && echo -e "  ${GREEN}✓${RESET} Installed via bun"
        else
            echo -e "  ${RED}Install OpenCode manually:${RESET}"
            echo -e "  ${YELLOW}curl -fsSL https://opencode.ai/install | bash${RESET}"
            exit 1
        fi
    fi
fi

OPENCODE_BIN="$(command -v opencode 2>/dev/null || echo '/usr/local/bin/opencode')"
echo -e "  ${GREEN}✓${RESET} OpenCode: $($OPENCODE_BIN --version 2>&1 || echo 'unknown')"

# ─── 2. Install shadow wrapper ───
echo -e "${YELLOW}[2/5]${RESET} Installing shadow command..."
WRAPPER="$PROJECT_DIR/scripts-shadow/shadow-wrapper.sh"
chmod +x "$WRAPPER"
ln -sf "$WRAPPER" /usr/local/bin/shadow 2>/dev/null || \
    sudo ln -sf "$WRAPPER" /usr/local/bin/shadow 2>/dev/null || \
    (mkdir -p "$HOME/.local/bin" && ln -sf "$WRAPPER" "$HOME/.local/bin/shadow")
echo -e "  ${GREEN}✓${RESET} shadow → $(command -v shadow 2>/dev/null || echo "$WRAPPER")"

# ─── 3. Write OpenCode config ───
echo -e "${YELLOW}[3/5]${RESET} Writing OpenCode config with 7 free models..."
CONFIG_DIR="$HOME/.config/opencode"
CONFIG_FILE="$CONFIG_DIR/opencode.jsonc"
mkdir -p "$CONFIG_DIR"

if [[ -f "$CONFIG_FILE" && ! -f "$CONFIG_FILE.bak" ]]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"
    echo -e "  ${DIM}Backed up existing config${RESET}"
fi

cat > "$CONFIG_FILE" << 'CONFIG_EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/mimo-v2.5-free",
  "small_model": "opencode/ling-3.0-flash-free",
  "default_agent": "build",
  "tui": {
    "plugin": [["./plugins/shadow-tui.tsx", {"enabled": true}]]
  },
  "agent": {
    "build": {
      "model": "opencode/mimo-v2.5-free",
      "description": "Shadow Core - autonomous penetration testing engine",
      "steps": 200,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true }
    },
    "plan": {
      "model": "opencode/nemotron-3-ultra-free",
      "description": "Shadow Core strategist - pentest planning",
      "steps": 100,
      "tools": { "read": true, "grep": true, "glob": true, "list": true, "webfetch": true, "websearch": true }
    },
    "general": {
      "model": "opencode/deepseek-v4-flash-free",
      "description": "Shadow Core recon - information gathering",
      "steps": 100,
      "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "webfetch": true, "websearch": true }
    },
    "shadow-mimo": { "model": "opencode/mimo-v2.5-free", "mode": "primary", "description": "MiMo V2.5 - Xiaomi flagship", "color": "#FF6B35", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } },
    "shadow-pickle": { "model": "opencode/big-pickle", "mode": "primary", "description": "Big Pickle - stealth frontier", "color": "#7CB342", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } },
    "shadow-deepseek": { "model": "opencode/deepseek-v4-flash-free", "mode": "primary", "description": "DeepSeek V4 Flash", "color": "#42A5F5", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } },
    "shadow-laguna": { "model": "opencode/laguna-s-2.1-free", "mode": "primary", "description": "Laguna S 2.1 - vulnerability research", "color": "#26C6DA", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } },
    "shadow-ling": { "model": "opencode/ling-3.0-flash-free", "mode": "primary", "description": "Ling 3.0 Flash - quick recon", "color": "#FFCA28", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } },
    "shadow-nemotron": { "model": "opencode/nemotron-3-ultra-free", "mode": "primary", "description": "NVIDIA Nemotron 3 Ultra - exploit design", "color": "#76B900", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } },
    "shadow-north": { "model": "opencode/north-mini-code-free", "mode": "primary", "description": "North Mini Code - script generation", "color": "#AB47BC", "steps": 200, "tools": { "bash": true, "read": true, "edit": true, "grep": true, "glob": true, "list": true, "write": true, "webfetch": true, "websearch": true, "task": true, "todowrite": true, "skill": true } }
  },
  "command": {
    "shannon-scan": { "template": "# Shannon Full Autonomous Pentest\n\nExecute a complete penetration test:\n1. shannon_docker_init\n2. shannon_recon <target>\n3. shannon_vuln_discovery <target>\n4. shannon_browser <target> (if web app)\n5. shannon_idor_test <target> (if API)\n6. shannon_exploit <target>\n7. shannon_report\n8. shannon_docker_cleanup", "description": "Full autonomous penetration test - recon to report" },
    "shannon-recon": { "template": "# Shannon Reconnaissance\n\n1. shannon_docker_init\n2. shannon_recon <target>\n3. shannon_docker_cleanup", "description": "Reconnaissance only - information gathering" },
    "shannon-report": { "template": "# Shannon Report Generation\n\nGenerate a professional pentest report with CVE references, CVSS scores, and remediation guidance.", "description": "Generate professional pentest report" }
  },
  "permission": { "bash": "allow", "read": "allow", "edit": "allow", "write": "allow", "grep": "allow", "glob": "allow", "list": "allow", "webfetch": "allow", "websearch": "allow" },
  "compaction": { "auto": true },
  "subagent_depth": 2
}
CONFIG_EOF

echo -e "  ${GREEN}✓${RESET} Config → $CONFIG_FILE"

# ─── 4. Copy theme + TUI plugin ───
echo -e "${YELLOW}[4/5]${RESET} Installing Shadow Core TUI theme & plugin..."

# Copy theme to config dir
mkdir -p "$CONFIG_DIR/themes"
cp "$PROJECT_DIR/themes/shadow-core.json" "$CONFIG_DIR/themes/shadow-core.json" 2>/dev/null || true

# Copy TUI plugin to config dir
mkdir -p "$CONFIG_DIR/plugins"
cp "$PROJECT_DIR/plugins/shadow-tui.tsx" "$CONFIG_DIR/plugins/shadow-tui.tsx" 2>/dev/null || true

# Also copy .opencode/tui.json
cp "$PROJECT_DIR/.opencode/tui.json" "$CONFIG_DIR/tui.json" 2>/dev/null || true

# Update config to point to correct TUI plugin path
python3 -c "
import json
config_path = '$CONFIG_FILE'
with open(config_path, 'r') as f:
    config = json.load(f)
# Set TUI plugin path relative to config dir
config['tui'] = {
    'plugin': [['./plugins/shadow-tui.tsx', {'enabled': True}]]
}
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
" 2>/dev/null || true

echo -e "  ${GREEN}✓${RESET} Theme: $CONFIG_DIR/themes/shadow-core.json"
echo -e "  ${GREEN}✓${RESET} TUI Plugin: $CONFIG_DIR/plugins/shadow-tui.tsx"
echo -e "  ${GREEN}✓${RESET} TUI Config: $CONFIG_DIR/tui.json"

# ─── 5. Build Shannon plugin ───
echo -e "${YELLOW}[5/5]${RESET} Building Shannon plugin..."
if command -v bun &>/dev/null && [[ -f "$PROJECT_DIR/package.json" ]]; then
    cd "$PROJECT_DIR"
    bun install 2>/dev/null && bun run build 2>/dev/null && \
        echo -e "  ${GREEN}✓${RESET} Plugin built" || \
        echo -e "  ${YELLOW}Build skipped (non-critical)${RESET}"
else
    echo -e "  ${YELLOW}Bun not found — Shannon plugin build skipped${RESET}"
    echo -e "  ${DIM}Install bun: curl -fsSL https://bun.sh | bash${RESET}"
fi

# ─── Done ───
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║  Shadow Core installed!                         ║${RESET}"
echo -e "${GREEN}║  Custom TUI + 7 Free Agents + Shannon Plugin     ║${RESET}"
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
echo -e "  ${RED}Custom TUI:${RESET} Shadow Core dark red theme + ASCII logo + sidebar"
echo ""
