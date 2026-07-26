export const SHANNON_TOR_DESCRIPTION = `Tor proxy management for anti-rate-limiting.
Starts Tor SOCKS proxy, rotates IP circuits, routes HTTP traffic through Tor.

Actions:
- "start" — Start Tor service and SOCKS proxy (port 9050)
- "status" — Get current Tor IP and circuit info
- "rotate" — Rotate to a NEW IP (new Tor circuit)
- "stop" — Stop Tor service

Auto-rotation: When enabled, IP rotates before EVERY shannon tool call.

Usage:
- Call shannon_tor with action="start" BEFORE starting recon
- Call shannon_tor with action="rotate" to get a new IP
- All HTTP tools (curl, nmap, nikto, etc.) will use --proxy socks5://127.0.0.1:9050

Example:
  { "action": "start" }   → Tor started, IP: 185.220.101.1
  { "action": "rotate" }  → New IP: 91.219.236.7
  { "action": "status" }  → Current IP and circuit info`

export const TOR_SOCKS_PORT = 9050
export const TOR_CONTROL_PORT = 9051
export const TOR_PROXY = "socks5://127.0.0.1:9050"
export const TOR_HTTP_PROXY = "socks5h://127.0.0.1:9050"

// Tor auto-rotation state (module-level)
let _torEnabled = false
let _torAutoRotate = true
let _torRequestCount = 0
export const TOR_ROTATE_EVERY = 5

export function isTorEnabled() { return _torEnabled }
export function setTorEnabled(v: boolean) { _torEnabled = v }
export function isTorAutoRotate() { return _torAutoRotate }
export function setTorAutoRotate(v: boolean) { _torAutoRotate = v }
export function getTorRequestCount() { return _torRequestCount }
export function incrementTorRequests() { _torRequestCount++ }
export function resetTorRequests() { _torRequestCount = 0 }
