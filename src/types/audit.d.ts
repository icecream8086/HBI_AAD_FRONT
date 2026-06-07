interface AuditLog {
  id: string
  timestamp: number
  level: string
  facility: string
  message: string
  actorId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

interface AuditLogQuery {
  levelMin?: string
  levelMax?: string
  facility?: string
  search?: string
  since?: number
  until?: number
  page?: number
  limit?: number
}

interface AuditLogStats {
  total: number
  bufferSize: number
}
