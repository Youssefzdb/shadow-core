<div align="center">

```
███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗     ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║    ██║     ██║   ██║██████╔╝█████╗  
╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║    ██║     ██║   ██║██╔══██╗██╔══╝  
███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝    ╚██████╗╚██████╔╝██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

**Autonomous Penetration Testing Engine — No Limits**

*Powered by Shannon AI × OpenCode × 600+ Kali Linux Tools*

</div>

---

## What is Shadow Core?

Shadow Core is an autonomous, infinite-loop penetration testing engine built on top of [OpenCode](https://opencode.ai) and the Shannon Pentest Plugin. It operates like a senior red teamer — taking a target and continuously working until full compromise is achieved.

> No fixed step limit. No manual intervention. Just results.

## Features

- 🔄 **Infinite Loop Mode** — runs until full compromise or explicit stop
- 🧠 **AI-Driven** — powered by Claude, GPT, Gemini, or any LLM provider
- 🐳 **600+ Kali Tools** — all running in isolated Docker containers
- 🎯 **6 Pentest Phases** — Recon → Discovery → Browser → IDOR → Exploit → Report
- 📊 **Professional Reports** — CVE references, CVSS scores, remediation guidance
- 🕶️ **Stealth Mode** — slow, evasive scanning options

## Quick Start

```bash
# Install
git clone https://github.com/Youssefzdb/shadow-core
cd shadow-core
bun install && bun run build
docker build -t shannon-tools .

# Run (type 'shadow' in your terminal)
shadow
```

## Infinite Loop Usage

```bash
# Give it a target — it won't stop until it's done
./.agents/skills/infinite-pentest-loop.sh 192.168.1.10

# With specific model
./.agents/skills/infinite-pentest-loop.sh https://target.lab anthropic/claude-opus-4-8
```

## Commands

| Command | Description |
|---------|-------------|
| `shadow` | Open Shadow Core TUI |
| `shadow --help` | Show all commands |
| `/shannon-scan` | Full autonomous pentest |
| `/shannon-recon` | Reconnaissance only |
| `/shannon-report` | Generate professional report |

## ⚠️ Legal Notice

Shadow Core is designed for **authorized penetration testing only**. Always obtain written permission before testing any system. The authors are not responsible for misuse.

---

<div align="center">
<sub>Built for professionals. Used responsibly.</sub>
</div>
