#!/bin/bash
# Shadow Core — Build Script (Self-Contained, CPU-compatible)
# يعمل بـ: curl -s URL | bash

set -e

RED='\033[1;31m'
RESET='\033[0m'
DIM='\033[2m'

echo -e "${RED}[Shadow Core]${RESET} Building patched opencode v1..."

# ────────── 1. تحديد معمارية الـ CPU ──────────
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    GO_ARCH="amd64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    GO_ARCH="arm64"
elif [[ "$ARCH" == arm* ]]; then
    GO_ARCH="arm"
else
    GO_ARCH="amd64"
fi

echo -e "${RED}[Shadow Core]${RESET} Detected architecture: ${ARCH} → Go target: ${GO_ARCH}"

# ────────── 2. تثبيت Go ──────────
install_go() {
    local VERSION="1.21.11"
    local URL="https://go.dev/dl/go${VERSION}.linux-${GO_ARCH}.tar.gz"
    local TMP="/tmp/go.tar.gz"

    echo -e "${RED}[Shadow Core]${RESET} Downloading Go ${VERSION} for ${GO_ARCH}..."
    curl -fsSL "$URL" -o "$TMP"

    echo -e "${RED}[Shadow Core]${RESET} Installing Go..."
    rm -rf /usr/local/go
    tar -C /usr/local -xzf "$TMP"
    rm "$TMP"
}

if command -v go &>/dev/null; then
    if go version &>/dev/null 2>&1; then
        echo -e "${RED}[Shadow Core]${RESET} Go already installed: $(go version)"
    else
        echo -e "${RED}[Shadow Core]${RESET} Existing Go is incompatible — reinstalling..."
        install_go
    fi
else
    install_go
fi

export PATH=$PATH:/usr/local/go/bin

if ! go version &>/dev/null 2>&1; then
    export GOAMD64=v1
    if ! go version &>/dev/null 2>&1; then
        echo -e "${RED}[Shadow Core]${RESET} FATAL: Cannot run Go on this system."
        exit 1
    fi
fi

echo -e "${RED}[Shadow Core]${RESET} $(go version)"

# ────────── 3. جلب source code ──────────
echo -e "${RED}[Shadow Core]${RESET} Cloning opencode source..."
cd /tmp
rm -rf opencode-v1
git clone --depth=1 https://github.com/opencode-ai/opencode.git opencode-v1
cd opencode-v1

# ────────── 4. تطبيق Shadow Core patches ──────────
echo -e "${RED}[Shadow Core]${RESET} Applying Shadow Core patches..."

cat > /tmp/opencode-v1/internal/tui/styles/icons.go << 'GOEOF'
package styles

const (
	OpenCodeIcon string = "🔴"
	CheckIcon    string = "✓"
	ErrorIcon    string = "✖"
	WarningIcon  string = "⚠"
	InfoIcon     string = ""
	HintIcon     string = "i"
	SpinnerIcon  string = "..."
	LoadingIcon  string = "⟳"
	DocumentIcon string = "🖼"
)
GOEOF

cat > /tmp/opencode-v1/internal/tui/components/chat/chat.go << 'GOEOF'
package chat

import (
	"fmt"
	"sort"

	"github.com/charmbracelet/lipgloss"
	"github.com/charmbracelet/x/ansi"
	"github.com/opencode-ai/opencode/internal/config"
	"github.com/opencode-ai/opencode/internal/message"
	"github.com/opencode-ai/opencode/internal/session"
	"github.com/opencode-ai/opencode/internal/tui/styles"
	"github.com/opencode-ai/opencode/internal/tui/theme"
	"github.com/opencode-ai/opencode/internal/version"
)

type SendMsg struct {
	Text        string
	Attachments []message.Attachment
}

type SessionSelectedMsg = session.Session
type SessionClearedMsg struct{}
type EditorFocusMsg bool

func header(width int) string {
	return lipgloss.JoinVertical(lipgloss.Top, logo(width), repo(width), "", cwd(width))
}

func lspsConfigured(width int) string {
	cfg := config.Get()
	title := ansi.Truncate("LSP Configuration", width, "…")
	t := theme.CurrentTheme()
	baseStyle := styles.BaseStyle()
	lsps := baseStyle.Width(width).Foreground(t.Primary()).Bold(true).Render(title)
	var lspNames []string
	for name := range cfg.LSP {
		lspNames = append(lspNames, name)
	}
	sort.Strings(lspNames)
	var lspViews []string
	for _, name := range lspNames {
		lsp := cfg.LSP[name]
		lspName := baseStyle.Foreground(t.Text()).Render(fmt.Sprintf("• %s", name))
		cmd := ansi.Truncate(lsp.Command, width-lipgloss.Width(lspName)-3, "…")
		lspPath := baseStyle.Foreground(t.TextMuted()).Render(fmt.Sprintf(" (%s)", cmd))
		lspViews = append(lspViews, baseStyle.Width(width).Render(lipgloss.JoinHorizontal(lipgloss.Left, lspName, lspPath)))
	}
	return baseStyle.Width(width).Render(lipgloss.JoinVertical(lipgloss.Left, lsps, lipgloss.JoinVertical(lipgloss.Left, lspViews...)))
}

func logo(width int) string {
	t := theme.CurrentTheme()
	baseStyle := styles.BaseStyle()
	versionText := baseStyle.Foreground(t.TextMuted()).Render(version.Version)
	return baseStyle.Bold(true).Width(width).Render(
		lipgloss.JoinHorizontal(lipgloss.Left, styles.OpenCodeIcon+" Shadow Core", " ", versionText),
	)
}

func repo(width int) string {
	return styles.BaseStyle().Foreground(theme.CurrentTheme().TextMuted()).Width(width).Render(
		"Shadow Core — Autonomous Penetration Testing Engine",
	)
}

func cwd(width int) string {
	return styles.BaseStyle().Foreground(theme.CurrentTheme().TextMuted()).Width(width).Render(
		fmt.Sprintf("cwd: %s", config.WorkingDirectory()),
	)
}
GOEOF

# ────────── 5. البناء ──────────
echo -e "${RED}[Shadow Core]${RESET} Building binary (~2-3 min)..."
mkdir -p /root/.opencode/bin

GOAMD64=v1 go build \
    -ldflags="-s -w -X github.com/opencode-ai/opencode/internal/version.Version=shadow-core-1.18.5" \
    -o /root/.opencode/bin/opencode \
    ./main.go

chmod +x /root/.opencode/bin/opencode

# ────────── 6. تثبيت mock server ──────────
echo -e "${RED}[Shadow Core]${RESET} Installing mock server..."

mkdir -p /usr/local/lib

cat > /usr/local/lib/shadow-mock-server.py << 'PYEOF'
#!/usr/bin/env python3
"""Shadow Core Mock Server — OpenAI-compatible, no key needed"""
import json, sys
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 4444

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass

    def do_GET(self):
        if self.path == "/v1/models":
            self.send_response(200)
            self.send_header("Content-Type","application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"object":"list","data":[{
                "id":"shadow-core","object":"model","type":"llm",
                "max_context_length":128000,"loaded_context_length":128000
            }]}).encode())
        else:
            self.send_response(404); self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length",0))
        if n: self.rfile.read(n)
        if "/chat/completions" in self.path:
            self.send_response(200)
            self.send_header("Content-Type","text/event-stream")
            self.send_header("Cache-Control","no-cache")
            self.end_headers()
            msg = "⚠️  لم يتم تكوين AI provider. أضف API key ثم أعد تشغيل shadow."
            chunk = {"id":"sc-1","object":"chat.completion.chunk","model":"shadow-core",
                     "choices":[{"index":0,"delta":{"role":"assistant","content":msg},"finish_reason":None}]}
            self.wfile.write(f"data: {json.dumps(chunk)}\n\n".encode())
            done = {"id":"sc-1","object":"chat.completion.chunk","model":"shadow-core",
                    "choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}
            self.wfile.write(f"data: {json.dumps(done)}\n\ndata: [DONE]\n\n".encode())
        else:
            self.send_response(404); self.end_headers()

if __name__=="__main__":
    HTTPServer(("127.0.0.1", PORT), H).serve_forever()
PYEOF

chmod +x /usr/local/lib/shadow-mock-server.py

# ────────── 7. تثبيت shadow wrapper ──────────
echo -e "${RED}[Shadow Core]${RESET} Installing 'shadow' command..."

cat > /usr/local/bin/shadow << 'BASHEOF'
#!/bin/bash
RED='\033[1;31m'
RESET='\033[0m'
DIM='\033[2m'
YELLOW='\033[1;33m'
MOCK_PORT=4444
MOCK_PID_FILE="/tmp/.shadow-mock.pid"
CONFIG_FILE="$HOME/.opencode.json"

if [[ "$1" == "--version" || "$1" == "-v" ]]; then
    echo -e "${RED}Shadow Core${RESET} v1.0 ${DIM}(shadow-core-1.18.5)${RESET} \033[0;31m[Kali Native]\033[0m"
    exit 0
fi

has_real_provider() {
    [[ -n "$ANTHROPIC_API_KEY" ]] && return 0
    [[ -n "$OPENAI_API_KEY" ]] && return 0
    [[ -n "$GEMINI_API_KEY" ]] && return 0
    [[ -n "$GROQ_API_KEY" ]] && return 0
    [[ -n "$OPENROUTER_API_KEY" ]] && return 0
    [[ -n "$LOCAL_ENDPOINT" ]] && return 0
    for f in "$HOME/.config/github-copilot/hosts.json" "$HOME/.config/github-copilot/apps.json"; do
        [[ -f "$f" ]] && grep -q "oauth_token" "$f" 2>/dev/null && return 0
    done
    return 1
}

start_mock() {
    [[ -f "$MOCK_PID_FILE" ]] && kill "$(cat "$MOCK_PID_FILE")" 2>/dev/null; rm -f "$MOCK_PID_FILE"
    python3 /usr/local/lib/shadow-mock-server.py &
    echo $! > "$MOCK_PID_FILE"
    sleep 0.4
    cat > "$CONFIG_FILE" << 'JSON'
{
  "providers": { "local": { "apiKey": "shadow-core-mock" } },
  "agents": {
    "coder":      { "model": "local.shadow-core", "maxTokens": 4096 },
    "summarizer": { "model": "local.shadow-core", "maxTokens": 2048 },
    "task":       { "model": "local.shadow-core", "maxTokens": 2048 },
    "title":      { "model": "local.shadow-core", "maxTokens": 80   }
  }
}
JSON
    echo -e "${YELLOW}[Shadow Core]${RESET} ${DIM}Mock Mode${RESET} — no AI provider configured"
    echo -e "${YELLOW}[Shadow Core]${RESET} Add a key anytime: ${RED}export GEMINI_API_KEY=... && shadow${RESET}"
    echo ""
}

cleanup() {
    [[ -f "$MOCK_PID_FILE" ]] && kill "$(cat "$MOCK_PID_FILE")" 2>/dev/null; rm -f "$MOCK_PID_FILE"
}
trap cleanup EXIT

if has_real_provider; then
    exec /root/.opencode/bin/opencode "$@"
else
    export LOCAL_ENDPOINT="http://127.0.0.1:$MOCK_PORT"
    start_mock
    /root/.opencode/bin/opencode "$@"
fi
BASHEOF

chmod +x /usr/local/bin/shadow

# ────────── 8. تنظيف ──────────
rm -rf /tmp/opencode-v1

echo ""
echo -e "${RED}╔══════════════════════════════════════════╗${RESET}"
echo -e "${RED}║   Shadow Core installed successfully!   ║${RESET}"
echo -e "${RED}╚══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${RED}shadow${RESET}              — launch (any mode)"
echo -e "  ${RED}shadow --version${RESET}    — show version"
echo ""
shadow --version
