#!/bin/bash
# Shadow Core — Build Script (Self-Contained)
# يعمل بـ: curl -s URL | bash

set -e

RED='\033[1;31m'
RESET='\033[0m'

echo -e "${RED}[Shadow Core]${RESET} Building patched opencode v1..."

# ────────── 1. تثبيت Go ──────────
if ! command -v go &>/dev/null; then
    echo -e "${RED}[Shadow Core]${RESET} Installing Go 1.22.4..."
    curl -fsSL https://go.dev/dl/go1.22.4.linux-amd64.tar.gz -o /tmp/go.tar.gz
    tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz
    export PATH=$PATH:/usr/local/go/bin
else
    export PATH=$PATH:/usr/local/go/bin
fi

go version

# ────────── 2. جلب source code ──────────
echo -e "${RED}[Shadow Core]${RESET} Cloning opencode source..."
cd /tmp
rm -rf opencode-v1
git clone --depth=1 https://github.com/opencode-ai/opencode.git opencode-v1
cd opencode-v1

# ────────── 3. تطبيق Shadow Core patches ──────────
echo -e "${RED}[Shadow Core]${RESET} Applying Shadow Core patches..."

# --- Patch 1: icons.go (تغيير الأيقونة) ---
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

# --- Patch 2: chat.go (تغيير الـ logo والـ branding) ---
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

# ────────── 4. البناء ──────────
echo -e "${RED}[Shadow Core]${RESET} Building binary (this may take ~2 min)..."
mkdir -p /root/.opencode/bin

go build \
    -ldflags="-s -w -X github.com/opencode-ai/opencode/internal/version.Version=shadow-core-1.18.5" \
    -o /root/.opencode/bin/opencode \
    ./main.go

chmod +x /root/.opencode/bin/opencode

# ────────── 5. تثبيت الـ wrapper ──────────
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

# ────────── 6. تنظيف ──────────
rm -rf /tmp/opencode-v1

echo ""
echo -e "${RED}╔══════════════════════════════════════════╗${RESET}"
echo -e "${RED}║     Shadow Core installed successfully   ║${RESET}"
echo -e "${RED}╚══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  Run: ${RED}shadow${RESET}"
echo -e "  Version: $(shadow --version)"
echo ""
