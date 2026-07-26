import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { SHANNON_TOR_DESCRIPTION } from "./constants"
import { DockerManager } from "../../docker"
import { isTorEnabled, setTorEnabled, isTorAutoRotate, setTorAutoRotate, getTorRequestCount, incrementTorRequests, resetTorRequests, TOR_PROXY, TOR_SOCKS_PORT } from "./constants"
import { writeFeedLine } from "../../hooks/shannon-progress-tracker/feed-writer"
import pc from "picocolors"

export function createShannonTor(): ToolDefinition {
  return tool({
    description: SHANNON_TOR_DESCRIPTION,
    args: {
      action: tool.schema
        .string()
        .describe("Action: 'start', 'status', 'rotate', or 'stop'"),
    },
    async execute(args) {
      const docker = DockerManager.getInstance()
      const now = new Date()
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`

      try {
        switch (args.action) {
          // ─────────────── START ───────────────
          case "start": {
            await docker.ensureRunning()

            // Install tor if not present (silent)
            await docker.exec("which tor || (apt-get update -qq && apt-get install -y -qq tor torsocks 2>/dev/null)", 120000).catch(() => {})

            // Stop any existing tor
            await docker.exec("pkill tor 2>/dev/null; sleep 1", 5000).catch(() => {})

            // Configure tor with control port for circuit rotation
            const torrc = `
SocksPort ${TOR_SOCKS_PORT}
ControlPort 9051
CookieAuthentication 0
MaxCircuitDirtiness 30
NewCircuitPeriod 15
CircuitBuildTimeout 10
CircuitIdleTimeout 30
DataDirectory /tmp/tor-data
Log notice file /tmp/tor.log
`.trim()

            // Write torrc
            await docker.exec(`cat > /tmp/torrc << 'TORRC_EOF'
${torrc}
TORRC_EOF`, 5000).catch(() => {})

            // Start tor in background
            const startResult = await docker.exec("tor -f /tmp/torrc &", 30000).catch(() => ({ success: false, stdout: "", stderr: "tor start failed", exitCode: 1, duration: 0 }))

            // Wait for tor to bootstrap
            let bootstrapped = false
            for (let i = 0; i < 15; i++) {
              await new Promise(r => setTimeout(r, 2000))
              const check = await docker.exec("curl -s --socks5-hostname 127.0.0.1:" + TOR_SOCKS_PORT + " https://api.ipify.org 2>/dev/null || echo 'PENDING'", 10000).catch(() => ({ stdout: "PENDING" }))
              if (check.stdout && !check.stdout.includes("PENDING") && check.stdout.trim().length > 0) {
                bootstrapped = true
                break
              }
            }

            if (bootstrapped) {
              setTorEnabled(true)
              setTorAutoRotate(true)
              resetTorRequests()
              const ipResult = await docker.exec("curl -s --socks5-hostname 127.0.0.1:" + TOR_SOCKS_PORT + " https://api.ipify.org", 10000).catch(() => ({ stdout: "unknown" }))
              const ip = ipResult.stdout?.trim() || "unknown"
              writeFeedLine(time, "TOR", "tor-start", `IP: ${ip}`)
              return `✅ Tor started successfully!\n\nProxy: socks5://127.0.0.1:${TOR_SOCKS_PORT}\nCurrent IP: ${ip}\nAuto-rotate: ON (every 5 requests)\n\nAll shannon HTTP tools now route through Tor.\nUse action="rotate" to get a new IP.`
            } else {
              return `⚠️ Tor started but bootstrap is slow.\nProxy: socks5://127.0.0.1:${TOR_SOCKS_PORT}\nCheck /tmp/tor.log for details.\nYou can still proceed — some tools may take longer.`
            }
          }

          // ─────────────── STATUS ───────────────
          case "status": {
            const ipResult = await docker.exec("curl -s --socks5-hostname 127.0.0.1:" + TOR_SOCKS_PORT + " https://api.ipify.org 2>/dev/null", 10000).catch(() => ({ stdout: "unavailable" }))
            const ip = ipResult.stdout?.trim() || "unavailable"
            const enabled = isTorEnabled()
            const auto = isTorAutoRotate()
            const count = getTorRequestCount()
            return `Tor Status:\n  Running: ${enabled ? "YES" : "NO"}\n  IP: ${ip}\n  SOCKS Port: ${TOR_SOCKS_PORT}\n  Auto-rotate: ${auto ? "ON" : "OFF"}\n  Requests since last rotation: ${count}`
          }

          // ─────────────── ROTATE ───────────────
          case "rotate": {
            // Send NEWCIRCUIT signal via control port
            await docker.exec(`echo -e 'AUTHENTICATE ""\\nSIGNAL NEWNYM\\nQUIT' | nc 127.0.0.1 9051 2>/dev/null || (python3 -c "
import socket
s = socket.socket()
s.connect(('127.0.0.1', 9051))
s.send(b'AUTHENTICATE \\"\\"\\r\\n')
s.send(b'SIGNAL NEWNYM\\r\\n')
s.send(b'QUIT\\r\\n')
print(s.recv(1024).decode())
s.close()
" 2>/dev/null)`, 10000).catch(() => {})

            // Wait for new circuit
            await new Promise(r => setTimeout(r, 3000))

            // Get new IP
            const ipResult = await docker.exec("curl -s --socks5-hostname 127.0.0.1:" + TOR_SOCKS_PORT + " https://api.ipify.org", 10000).catch(() => ({ stdout: "unknown" }))
            const newIp = ipResult.stdout?.trim() || "unknown"
            resetTorRequests()
            writeFeedLine(time, "TOR", "ip-rotate", `New IP: ${newIp}`)
            return `✅ Tor circuit rotated!\nNew IP: ${newIp}\nRequests counter reset to 0.`
          }

          // ─────────────── STOP ───────────────
          case "stop": {
            await docker.exec("pkill tor 2>/dev/null", 5000).catch(() => {})
            setTorEnabled(false)
            writeFeedLine(time, "TOR", "tor-stop", "stopped")
            return `✅ Tor stopped. Traffic will use direct connection.`
          }

          default:
            return `Unknown action: ${args.action}. Use: start, status, rotate, or stop.`
        }
      } catch (error: any) {
        return `❌ Tor error: ${error.message || error}\nTry: shannon_tor action="start" first.`
      }
    },
  })
}
