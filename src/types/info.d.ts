interface ServerInfo {
  name: string
  version: string
  platform: string
  features: string[]
  uptime: number
  storeMetrics: Record<string, unknown>
}
