export interface ShannonTorArgs {
  action: "start" | "status" | "rotate" | "stop"
}

export interface TorState {
  running: boolean
  ip: string | null
  socksPort: number
  controlPort: number
  autoRotate: boolean
  requestCount: number
}
