#!/bin/bash
# ============================================================
# Shadow Core — Terminal Wrapper for OpenCode
# يعرض Shadow Core logo ثم يشغّل opencode
# ============================================================

export SHANNON_NATIVE_MODE=true

# ألوان
RED='\033[1;31m'
DARK_RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

# دالة تمسح الشاشة وتعرض الـ logo
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
  echo "   ██╔════╝██╔═══██╗██╔══██╗██╔════╝"
  echo "   ██║     ██║   ██║██████╔╝█████╗  "
  echo "   ██║     ██║   ██║██╔══██╗██╔══╝  "
  echo "   ╚██████╗╚██████╔╝██║  ██║███████╗"
  echo "    ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝"
  echo -e "${DARK_RED}"
  echo "        [ Autonomous Penetration Testing Engine v1.0 ]"
  echo "             [ Kali Native Mode — No Limits ]"
  echo -e "${DIM}              Powered by Shannon AI × OpenCode${RESET}"
  echo ""
  echo -e "  ${RED}●${RESET} Target: ${1:-'Not specified — use /shannon-scan <target>'}"
  echo -e "  ${RED}●${RESET} Mode:   Native Kali Linux"
  echo -e "  ${RED}●${RESET} Loop:   Autonomous Infinite"
  echo ""
  echo -e "${DIM}  ──────────────────────────────────────────────────────${RESET}"
  echo ""
}

# ============================================================
# تشغيل بحسب الـ arguments
# ============================================================

case "$1" in
  --version|-v)
    echo -e "${RED}Shadow Core${RESET} v1.0 ${DIM}(opencode $(/root/.opencode/bin/opencode --version 2>&1))${RESET} ${DARK_RED}[Kali Native]${RESET}"
    ;;

  --help|-h)
    show_logo
    echo -e "${DARK_RED}Usage:${RESET}"
    echo "  shadow                      Open Shadow Core TUI"
    echo "  shadow run '<message>'      Run a single autonomous task"
    echo "  shadow --version            Show version"
    echo ""
    echo -e "${DARK_RED}Shannon Commands (inside TUI):${RESET}"
    echo "  /shannon-scan <target>      Full autonomous pentest"
    echo "  /shannon-recon <target>     Reconnaissance only"
    echo "  /shannon-report             Generate professional report"
    echo ""
    echo -e "${DARK_RED}Infinite Loop:${RESET}"
    echo "  /path/to/infinite-pentest-loop.sh <target> [model]"
    echo ""
    ;;

  "")
    # الوضع الافتراضي — اعرض الـ logo بشكل سريع ثم أطلق الـ TUI
    show_logo
    # تأخير قصير لإظهار الـ logo
    sleep 0.8
    # شغّل opencode — سيتولى الـ TUI من هنا
    exec /root/.opencode/bin/opencode
    ;;

  *)
    # أي argument آخر — مرّره مباشرة
    exec /root/.opencode/bin/opencode "$@"
    ;;
esac
