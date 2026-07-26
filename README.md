<div align="center">

```
███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗     ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║    ██║     ██║   ██║██████╔╝█████╗  
╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║    ██║     ██║   ██║██╔══██║██╔══╝  
███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝    ╚██████╗╚██████╔╝██║  ██║███████╗
╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝      ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
```

**Autonomous Penetration Testing Engine — No Limits**

*Powered by Shannon AI × OpenCode × 600+ Kali Linux Tools*

**7 Free AI Models — No API Key Required**

</div>

---

## What is Shadow Core?

Shadow Core is an autonomous, infinite-loop penetration testing engine built on top of [OpenCode](https://opencode.ai) and the Shannon Pentest Plugin. It operates like a senior red teamer — taking a target and continuously working until full compromise is achieved.

> No fixed step limit. No manual intervention. Just results.

## Features

- 🔄 **Infinite Loop Mode** — runs until full compromise or explicit stop
- 🧠 **7 Free AI Models** — no API key required, zero cost
- 🐳 **600+ Kali Tools** — all running in isolated Docker containers
- 🎯 **6 Pentest Phases** — Recon → Discovery → Browser → IDOR → Exploit → Report
- 📊 **Professional Reports** — CVE references, CVSS scores, remediation guidance
- 🕶️ **Stealth Mode** — slow, evasive scanning options

## 7 Free Agents (No API Key)

| Agent | Model | Best For |
|-------|-------|----------|
| `shadow-mimo` | MiMo V2.5 (Xiaomi) | Flagship — comparable to Claude Sonnet 4.6 |
| `shadow-pickle` | Big Pickle (stealth) | Frontier coding, unknown lab |
| `shadow-deepseek` | DeepSeek V4 Flash | Fast reasoning & code analysis |
| `shadow-laguna` | Laguna S 2.1 | Deep analysis & vulnerability research |
| `shadow-ling` | Ling 3.0 Flash | Ultra-fast scanning & quick recon |
| `shadow-nemotron` | NVIDIA Nemotron 3 Ultra | Heavy reasoning, exploit design |
| `shadow-north` | North Mini Code | Lightweight coding & script generation |

Switch agents inside the TUI with the **Tab** key.

## Quick Start

```bash
# Clone
git clone https://github.com/Youssefzdb/shadow-core
cd shadow-core

# Install dependencies
bun install && bun run build

# Install shadow command + 7 free models config
chmod +x scripts/install_shadow.sh
./scripts/install_shadow.sh

# (Optional) Build Docker image for Kali tools
docker build -t shannon-tools .

# Launch
shadow
```

## Usage

```bash
# Launch Shadow Core TUI
shadow

# Run a single task
shadow run 'scan 192.168.1.10'

# Show help
shadow --help
```

### Shannon Commands (inside TUI)

| Command | Description |
|---------|-------------|
| `/shannon-scan <target>` | Full autonomous pentest |
| `/shannon-recon <target>` | Reconnaissance only |
| `/shannon-report` | Generate professional report |

### Infinite Loop

```bash
# Give it a target — it won't stop until it's done
./scripts-shadow/infinite-pentest-loop.sh 192.168.1.10

# With specific free model
./scripts-shadow/infinite-pentest-loop.sh https://target.lab opencode/mimo-v2.5-free
```

## How It Works

```
shadow command
    ↓
shadow-wrapper.sh (logo + config)
    ↓
opencode (TUI) with 7 free agents
    ↓
Shannon Plugin (20+ pentest tools)
    ↓
Docker (600+ Kali Linux tools)
```

## ⚠️ Legal Notice

Shadow Core is designed for **authorized penetration testing only**. Always obtain written permission before testing any system. The authors are not responsible for misuse.

---

<div align="center">
<sub>Built for professionals. Used responsibly.</sub>
</div>
