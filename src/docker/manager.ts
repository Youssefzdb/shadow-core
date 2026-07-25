import { exec } from "node:child_process"
import { promisify } from "node:util"
import pc from "picocolors"
import type { DockerExecutionResult, ShannonDockerConfig } from "./types"
import { DOCKER_CONTAINER_NAME, DOCKER_IMAGE_NAME, DEFAULT_TIMEOUT } from "./constants"

const execAsync = promisify(exec)
const MAX_BUFFER = 50 * 1024 * 1024 // 50MB

// ============================================================
// Native Mode — runs tools directly on Kali Linux host
// No Docker required when SHANNON_NATIVE_MODE=true
// ============================================================
const NATIVE_MODE = process.env.SHANNON_NATIVE_MODE === "true" ||
  process.env.SHANNON_NATIVE_MODE === "1"

export class DockerManager {
  private static instance: DockerManager | null = null
  private containerRunning = false
  private readonly imageName: string
  private readonly containerName: string

  constructor(config?: Partial<ShannonDockerConfig>) {
    this.imageName = config?.imageName ?? DOCKER_IMAGE_NAME
    this.containerName = config?.containerName ?? DOCKER_CONTAINER_NAME
  }

  static getInstance(config?: Partial<ShannonDockerConfig>): DockerManager {
    if (!DockerManager.instance) {
      DockerManager.instance = new DockerManager(config)
    }
    return DockerManager.instance
  }

  static resetInstance(): void {
    DockerManager.instance = null
  }

  async ensureRunning(): Promise<void> {
    if (NATIVE_MODE) {
      // Native Kali — no container needed
      console.log(pc.red("[Shadow Core] Native Mode — running directly on Kali Linux host"))
      this.containerRunning = true
      return
    }

    if (this.containerRunning) {
      try {
        const { stdout } = await execAsync(
          `docker inspect -f '{{.State.Running}}' ${this.containerName}`
        )
        if (stdout.trim() === "true") return
      } catch {
        this.containerRunning = false
      }
    }

    try {
      await execAsync("docker --version")
    } catch {
      throw new Error(
        "[Shadow Core] Docker not found.\n" +
        "Run in Native Mode instead:\n" +
        "  export SHANNON_NATIVE_MODE=true\n" +
        "  shadow\n" +
        "This runs tools directly on your Kali Linux host."
      )
    }

    try {
      const { stdout } = await execAsync(
        `docker inspect -f '{{.State.Running}}' ${this.containerName} 2>/dev/null`
      )
      if (stdout.trim() === "true") {
        this.containerRunning = true
        return
      }
    } catch {
      // container doesn't exist yet
    }

    console.log(pc.yellow(`[Shadow Core] Starting Docker container...`))
    await execAsync(
      `docker run -d --name ${this.containerName} --rm \
       --network host \
       -v /tmp/shannon:/tmp/shannon \
       ${this.imageName} tail -f /dev/null`,
      { timeout: 30000 }
    )
    this.containerRunning = true
  }

  async exec(command: string, timeout = DEFAULT_TIMEOUT): Promise<DockerExecutionResult> {
    const start = Date.now()

    try {
      await this.ensureRunning()

      let fullCommand: string

      if (NATIVE_MODE) {
        // Execute directly on the host (Kali Native)
        fullCommand = command
      } else {
        // Execute inside Docker container
        const escaped = command.replace(/'/g, `'\\''`)
        fullCommand = `docker exec ${this.containerName} sh -c '${escaped}'`
      }

      const { stdout, stderr } = await execAsync(fullCommand, {
        timeout,
        maxBuffer: MAX_BUFFER,
      })

      return {
        success: true,
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        exitCode: 0,
        duration: Date.now() - start,
      }
    } catch (error: unknown) {
      const err = error as {
        stdout?: string
        stderr?: string
        code?: number
        message?: string
      }
      return {
        success: false,
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? err.message ?? "Unknown error",
        exitCode: err.code ?? 1,
        duration: Date.now() - start,
      }
    }
  }

  async cleanup(): Promise<void> {
    if (NATIVE_MODE) {
      console.log(pc.red("[Shadow Core] Native Mode — no container to clean up"))
      this.containerRunning = false
      return
    }
    try {
      await execAsync(`docker stop ${this.containerName} 2>/dev/null || true`)
    } catch {
      // ignore
    }
    this.containerRunning = false
  }

  isRunning(): boolean {
    return this.containerRunning
  }

  isNativeMode(): boolean {
    return NATIVE_MODE
  }

  getContainerName(): string {
    return NATIVE_MODE ? "native-kali-host" : this.containerName
  }

  getImageName(): string {
    return NATIVE_MODE ? "kali-linux-native" : this.imageName
  }

  async copyFromContainer(containerPath: string, hostPath: string): Promise<DockerExecutionResult> {
    const start = Date.now()
    if (NATIVE_MODE) {
      // في Native Mode — الملفات موجودة مباشرة على الـ host
      try {
        const { stdout, stderr } = await execAsync(`cp "${containerPath}" "${hostPath}" 2>&1 || true`)
        return { success: true, stdout, stderr: stderr ?? "", exitCode: 0, duration: Date.now() - start }
      } catch (e: unknown) {
        const err = e as { message?: string }
        return { success: false, stdout: "", stderr: err.message ?? "", exitCode: 1, duration: Date.now() - start }
      }
    }
    try {
      const { stdout, stderr } = await execAsync(
        `docker cp ${this.containerName}:${containerPath} ${hostPath}`
      )
      return { success: true, stdout, stderr: stderr ?? "", exitCode: 0, duration: Date.now() - start }
    } catch (e: unknown) {
      const err = e as { message?: string }
      return { success: false, stdout: "", stderr: err.message ?? "", exitCode: 1, duration: Date.now() - start }
    }
  }
}
