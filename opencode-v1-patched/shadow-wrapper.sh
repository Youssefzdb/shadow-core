#!/bin/bash
# Shadow Core — Smart Launcher
# يفتح Shadow Core بدون API key — يستخدم mock server كـ fallback

RED='\033[1;31m'
RESET='\033[0m'
DIM='\033[2m'
YELLOW='\033[1;33m'

MOCK_PORT=4444
MOCK_PID_FILE="/tmp/.shadow-mock.pid"
CONFIG_FILE="$HOME/.opencode.json"
MOCK_SERVER="/usr/local/lib/shadow-mock-server.py"

# ────────── version ──────────
if [[ "$1" == "--version" || "$1" == "-v" ]]; then
    echo -e "${RED}Shadow Core${RESET} v1.0 ${DIM}(shadow-core-1.18.5)${RESET} \033[0;31m[Kali Native]\033[0m"
    exit 0
fi

# ────────── تحقق من وجود provider حقيقي ──────────
has_real_provider() {
    [[ -n "$ANTHROPIC_API_KEY" ]] && return 0
    [[ -n "$OPENAI_API_KEY" ]] && return 0
    [[ -n "$GEMINI_API_KEY" ]] && return 0
    [[ -n "$GROQ_API_KEY" ]] && return 0
    [[ -n "$OPENROUTER_API_KEY" ]] && return 0
    [[ -n "$LOCAL_ENDPOINT" ]] && return 0

    # تحقق من GitHub Copilot token
    for f in \
        "$HOME/.config/github-copilot/hosts.json" \
        "$HOME/.config/github-copilot/apps.json" \
        "$HOME/AppData/Local/github-copilot/hosts.json"; do
        [[ -f "$f" ]] && return 0
    done

    # تحقق من config file
    if [[ -f "$CONFIG_FILE" ]]; then
        if python3 -c "
import json,sys
d=json.load(open('$CONFIG_FILE'))
p=d.get('providers',{})
for v in p.values():
    k=v.get('apiKey','')
    if k and k not in ('dummy','','placeholder'):
        sys.exit(0)
sys.exit(1)
" 2>/dev/null; then
            return 0
        fi
    fi

    return 1
}

# ────────── تشغيل mock server ──────────
start_mock() {
    # إيقاف أي mock قديم
    if [[ -f "$MOCK_PID_FILE" ]]; then
        kill "$(cat "$MOCK_PID_FILE")" 2>/dev/null
        rm -f "$MOCK_PID_FILE"
    fi

    # تشغيل mock server في الخلفية
    python3 "$MOCK_SERVER" &
    echo $! > "$MOCK_PID_FILE"
    sleep 0.5

    # كتابة config لـ local provider
    cat > "$CONFIG_FILE" << 'JSON'
{
  "providers": {
    "local": {
      "apiKey": "shadow-core-mock"
    }
  },
  "agents": {
    "coder": {
      "model": "local.shadow-core",
      "maxTokens": 4096
    },
    "summarizer": {
      "model": "local.shadow-core",
      "maxTokens": 2048
    },
    "task": {
      "model": "local.shadow-core",
      "maxTokens": 2048
    },
    "title": {
      "model": "local.shadow-core",
      "maxTokens": 80
    }
  }
}
JSON

    echo -e "${YELLOW}[Shadow Core]${RESET} Running in ${DIM}Mock Mode${RESET} — no API key configured"
    echo -e "${YELLOW}[Shadow Core]${RESET} To connect a real AI: ${RED}export ANTHROPIC_API_KEY=... && shadow${RESET}"
    echo ""
}

# ────────── إيقاف mock عند الخروج ──────────
cleanup() {
    if [[ -f "$MOCK_PID_FILE" ]]; then
        kill "$(cat "$MOCK_PID_FILE")" 2>/dev/null
        rm -f "$MOCK_PID_FILE"
    fi
}
trap cleanup EXIT

# ────────── الإطلاق ──────────
if has_real_provider; then
    echo -e "${RED}[Shadow Core]${RESET} Provider detected — launching..."
    exec /root/.opencode/bin/opencode "$@"
else
    # لا يوجد provider — نشغّل mock
    export LOCAL_ENDPOINT="http://127.0.0.1:$MOCK_PORT"
    start_mock
    /root/.opencode/bin/opencode "$@"
fi
