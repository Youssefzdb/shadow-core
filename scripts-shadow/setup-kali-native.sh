#!/bin/bash
# Shadow Core — Kali Native Setup
# No Docker needed — uses system tools directly

echo -e "\033[1;31m"
echo "███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗     ██████╗ ██████╗ ██████╗ ███████╗"
echo "╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝"
echo -e "\033[0;31m           [ Kali Native Mode — No Docker Required ]\033[0m"
echo ""

# 1. تثبيت opencode
echo "[1/4] Installing OpenCode..."
curl -fsSL https://opencode.ai/install | bash

# 2. تثبيت bun
echo "[2/4] Installing Bun..."
npm install -g bun 2>/dev/null || curl -fsSL https://bun.sh/install | bash

# 3. بناء Shadow Core plugin
echo "[3/4] Building Shadow Core plugin..."
cd ~/shadow-core 2>/dev/null || (git clone https://github.com/Youssefzdb/shadow-core ~/shadow-core && cd ~/shadow-core)
bun install && bun run build

# 4. تثبيت shadow command + Native Mode
echo "[4/4] Installing 'shadow' command (Native Mode)..."
cat > /usr/local/bin/shadow << 'WRAPPER'
#!/bin/bash
export SHANNON_NATIVE_MODE=true

SHADOW_CORE_LOGO='\033[1;31m
███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗     ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║    ██║     ██║   ██║██████╔╝█████╗  
╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║    ██║     ██║   ██║██╔══██╗██╔══╝  
███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝    ╚██████╗╚██████╔╝██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
\033[0;31m           [ Autonomous Pentesting — Kali Native Mode — No Limits ]
\033[0m'

if [[ $# -eq 0 ]]; then
  echo -e "$SHADOW_CORE_LOGO"
  exec /root/.opencode/bin/opencode
elif [[ "$1" == "--version" ]] || [[ "$1" == "-v" ]]; then
  echo -e "\033[1;31mShadow Core\033[0m v1.0 \033[2m[Kali Native]\033[0m"
elif [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  echo -e "$SHADOW_CORE_LOGO"
  /root/.opencode/bin/opencode --help 2>&1 | grep -v '█\|▄\|▀'
else
  exec /root/.opencode/bin/opencode "$@"
fi
WRAPPER
chmod +x /usr/local/bin/shadow

# تفعيل Native Mode دائماً
if ! grep -q "SHANNON_NATIVE_MODE" ~/.bashrc; then
  echo 'export SHANNON_NATIVE_MODE=true' >> ~/.bashrc
fi

echo ""
echo -e "\033[1;32m✅ Shadow Core ready on Kali Native!\033[0m"
echo -e "Run: \033[1;31mshadow\033[0m"
