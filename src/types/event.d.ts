interface EventLoopStatus {
  running: boolean
  paused: boolean
  queueSize: number
  processedCount: number
  uptimeMs: number
  config: {
    intervalMs: number
    batchSize: number
    autoStart: boolean
    maxQueueSize: number
  }
}

interface EventLoopConfig {
  intervalMs: number
  batchSize: number
  autoStart: boolean
  maxQueueSize: number
}
