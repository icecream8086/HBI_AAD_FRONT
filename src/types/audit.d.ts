interface AuditLog {
  id: string
  timestamp: number
  level: number
  facility: string
  priority?: number
  message: string
  actorId?: string
  requestId?: string
  metadata?: Record<string, unknown>
}

interface AuditLogQuery {
  levelMin?: number
  facility?: string
  search?: string
  requestId?: string
  since?: number
  until?: number
  page?: number
  limit?: number
}

interface AuditLogStats {
  total: number
  entryCount: number
  totalBytes: number
}
