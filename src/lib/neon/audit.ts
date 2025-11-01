import { query } from './client'
import type { AuditLog } from './schema'

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  companyId: string,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog> {
  const logId = crypto.randomUUID()

  const result = await query<AuditLog>(
    `INSERT INTO audit_logs (
      id, company_id, user_id, action, resource_type, resource_id,
      old_values, new_values, ip_address, user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
    RETURNING *`,
    [
      logId,
      companyId,
      userId,
      action,
      resourceType,
      resourceId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null,
      userAgent || null,
    ]
  )

  return result[0]
}

/**
 * Get audit logs
 */
export async function getAuditLogs(
  companyId: string,
  filters?: {
    userId?: string
    resourceType?: string
    resourceId?: string
    action?: string
    startDate?: string
    endDate?: string
    limit?: number
    offset?: number
  }
): Promise<AuditLog[]> {
  let sql = 'SELECT * FROM audit_logs WHERE company_id = $1'
  const params: any[] = [companyId]
  let paramIndex = 2

  if (filters?.userId) {
    sql += ` AND user_id = $${paramIndex}`
    params.push(filters.userId)
    paramIndex++
  }
  if (filters?.resourceType) {
    sql += ` AND resource_type = $${paramIndex}`
    params.push(filters.resourceType)
    paramIndex++
  }
  if (filters?.resourceId) {
    sql += ` AND resource_id = $${paramIndex}`
    params.push(filters.resourceId)
    paramIndex++
  }
  if (filters?.action) {
    sql += ` AND action = $${paramIndex}`
    params.push(filters.action)
    paramIndex++
  }
  if (filters?.startDate) {
    sql += ` AND created_at >= $${paramIndex}`
    params.push(filters.startDate)
    paramIndex++
  }
  if (filters?.endDate) {
    sql += ` AND created_at <= $${paramIndex}`
    params.push(filters.endDate)
    paramIndex++
  }

  sql += ' ORDER BY created_at DESC'

  if (filters?.limit) {
    sql += ` LIMIT $${paramIndex}`
    params.push(filters.limit)
    paramIndex++
    if (filters.offset) {
      sql += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }
  }

  return await query<AuditLog>(sql, params)
}


