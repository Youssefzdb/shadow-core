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
    # نتحقق إنه يشتغل فعلاً (مش Illegal instruction)
    if go version &>/dev/null 2>&1; then
        echo -e "${RED}[Shadow Core]${RESET} Go already installed: $(go version)"
    else
        echo -e "${RED}[Shadow Core]${RESET} Existing Go is incompatible (Illegal instruction) — reinstalling..."
        install_go
    fi
else
    install_go
fi

export PATH=$PATH:/usr/local/go/bin

# تحقق نهائي
if ! go version &>/dev/null 2>&1; then
    echo -e "${RED}[Shadow Core]${RESET} ERROR: Go still not working. Trying GOAMD64=v1 workaround..."
    # نجرب v1 compatibility level
    export GOAMD64=v1
    if ! go version &>/dev/null 2>&1; then
        echo -e "${RED}[Shadow Core]${RESET} FATAL: Cannot run Go on this system."
        echo "Try running: apt-get install -y golang-go"
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

# --- Patch 1: icons.go ---
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

# --- Patch 2: chat.go ---
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
	return lipgloss.JoinVertical(
		lipgloss.Top,
		logo(width),
		repo(width),
		"",
		cwd(width),
	)
}

func lspsConfigured(width int) string {
	cfg := config.Get()
	title := "LSP Configuration"
	title = ansi.Truncate(title, width, "…")

	t := theme.CurrentTheme()
	baseStyle := styles.BaseStyle()

	lsps := baseStyle.
		Width(width).
		Foreground(t.Primary()).
		Bold(true).
		Render(title)

	var lspNames []string
	for name := range cfg.LSP {
		lspNames = append(lspNames, name)
	}
	sort.Strings(lspNames)

	var lspViews []string
	for _, name := range lspNames {
		lsp := cfg.LSP[name]
		lspName := baseStyle.
			Foreground(t.Text()).
			Render(fmt.Sprintf("• %s", name))

		cmd := lsp.Command
		cmd = ansi.Truncate(cmd, width-lipgloss.Width(lspName)-3, "…")

		lspPath := baseStyle.
			Foreground(t.TextMuted()).
			Render(fmt.Sprintf(" (%s)", cmd))

		lspViews = append(lspViews,
			baseStyle.
				Width(width).
				Render(
					lipgloss.JoinHorizontal(
						lipgloss.Left,
						lspName,
						lspPath,
					),
				),
		)
	}

	return baseStyle.
		Width(width).
		Render(
			lipgloss.JoinVertical(
				lipgloss.Left,
				lsps,
				lipgloss.JoinVertical(
					lipgloss.Left,
					lspViews...,
				),
			),
		)
}

func logo(width int) string {
	logo := fmt.Sprintf("%s %s", styles.OpenCodeIcon, "Shadow Core")
	t := theme.CurrentTheme()
	baseStyle := styles.BaseStyle()

	versionText := baseStyle.
		Foreground(t.TextMuted()).
		Render(version.Version)

	return baseStyle.
		Bold(true).
		Width(width).
		Render(
			lipgloss.JoinHorizontal(
				lipgloss.Left,
				logo,
				" ",
				versionText,
			),
		)
}

func repo(width int) string {
	repo := "Shadow Core — Autonomous Penetration Testing Engine"
	t := theme.CurrentTheme()

	return styles.BaseStyle().
		Foreground(t.TextMuted()).
		Width(width).
		Render(repo)
}

func cwd(width int) string {
	cwd := fmt.Sprintf("cwd: %s", config.WorkingDirectory())
	t := theme.CurrentTheme()

	return styles.BaseStyle().
		Foreground(t.TextMuted()).
		Width(width).
		Render(cwd)
}
GOEOF

# ────────── 5. البناء ──────────
echo -e "${RED}[Shadow Core]${RESET} Building binary (this may take ~2-3 min)..."
mkdir -p /root/.opencode/bin

# GOAMD64=v1 لضمان التوافق مع أي CPU x86_64
GOAMD64=v1 go build \
    -ldflags="-s -w -X github.com/opencode-ai/opencode/internal/version.Version=shadow-core-1.18.5" \
    -o /root/.opencode/bin/opencode \
    ./main.go

chmod +x /root/.opencode/bin/opencode

# ────────── 6. تثبيت الـ wrapper ──────────
echo -e "${RED}[Shadow Core]${RESET} Installing 'shadow' command..."

cat > /usr/local/bin/shadow << 'BASHEOF'
#!/bin/bash
RED='\033[1;31m'
RESET='\033[0m'
DIM='\033[2m'

if [[ "$1" == "--version" || "$1" == "-v" ]]; then
    echo -e "${RED}Shadow Core${RESET} v1.0 ${DIM}(shadow-core-1.18.5)${RESET} \033[0;31m[Kali Native]\033[0m"
    exit 0
fi

exec /root/.opencode/bin/opencode "$@"
BASHEOF

chmod +x /usr/local/bin/shadow

# ────────── 7. تنظيف ──────────
rm -rf /tmp/opencode-v1

echo ""
echo -e "${RED}╔══════════════════════════════════════════╗${RESET}"
echo -e "${RED}║   Shadow Core installed successfully!   ║${RESET}"
echo -e "${RED}╚══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Run:     ${RED}shadow${RESET}"
echo -e "  Version: $(shadow --version)"
echo ""
