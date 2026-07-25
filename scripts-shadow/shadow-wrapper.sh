#!/bin/bash
# Shadow Core — wrapper for opencode

SHADOW_CORE_LOGO='\033[1;31m
███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗     ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║    ██║     ██║   ██║██████╔╝█████╗  
╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║    ██║     ██║   ██║██╔══██╗██╔══╝  
███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝    ╚██████╗╚██████╔╝██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
\033[0;31m                    [ Autonomous Penetration Testing Engine v1.0 ]
                         [ Powered by Shannon AI — No Limits ]
\033[0m'

# للأوامر المتفاعلة (بدون args) — شغّل مباشرة مع الـ logo في ~/.bashrc
if [[ $# -eq 0 ]]; then
  echo -e "$SHADOW_CORE_LOGO"
  exec /root/.opencode/bin/opencode
fi

# --help
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
  echo -e "$SHADOW_CORE_LOGO"
  /root/.opencode/bin/opencode --help 2>&1 | grep -v '█\|▄\|▀\|opencode\.ai\|OpenCode includes'
  exit 0
fi

# --version
if [[ "$1" == "--version" ]] || [[ "$1" == "-v" ]]; then
  echo -e "\033[1;31mShadow Core\033[0m v1.0 \033[2m(opencode $(/root/.opencode/bin/opencode --version 2>&1))\033[0m"
  exit 0
fi

# باقي الأوامر — شغّلها مباشرة
exec /root/.opencode/bin/opencode "$@"
