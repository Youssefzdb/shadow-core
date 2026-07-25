#!/bin/bash
# Shadow Core — Build Script
# يبني opencode v1 معدّل بـ Shadow Core branding

set -e

RED='\033[1;31m'
RESET='\033[0m'

echo -e "${RED}[Shadow Core]${RESET} Building patched opencode v1..."

# نثبت Go إذا مش موجود
if ! command -v go &>/dev/null; then
    echo "Installing Go..."
    curl -fsSL https://go.dev/dl/go1.22.4.linux-amd64.tar.gz -o /tmp/go.tar.gz
    tar -C /usr/local -xzf /tmp/go.tar.gz
    export PATH=$PATH:/usr/local/go/bin
fi

# نجيب الـ source
cd /tmp
rm -rf opencode-v1
git clone --depth=1 https://github.com/opencode-ai/opencode.git opencode-v1

# نطبّق الـ patches
cp "$(dirname "$0")/chat.go" /tmp/opencode-v1/internal/tui/components/chat/chat.go
cp "$(dirname "$0")/icons.go" /tmp/opencode-v1/internal/tui/styles/icons.go

# نبني
cd /tmp/opencode-v1
go build \
    -ldflags="-s -w -X github.com/opencode-ai/opencode/internal/version.Version=shadow-core-1.18.5" \
    -o /root/.opencode/bin/opencode \
    ./main.go

echo -e "${RED}[Shadow Core]${RESET} ✅ Binary installed at /root/.opencode/bin/opencode"
echo -e "${RED}[Shadow Core]${RESET} Run: ${RED}shadow${RESET}"
