interface TriggerEvent {
  type: string
  payload: unknown
}

interface EventLoopStatus {
  running: boolean
  tickInterval: number
  queueSize: number
  lastTick: number
}

interface EventLoopConfig {
  tickInterval?: number
  maxRetries?: number
}
