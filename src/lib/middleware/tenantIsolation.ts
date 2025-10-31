/**
 * Tenant isolation middleware utilities
 * Ensures all database queries are scoped to the user's company
 */

export interface TenantContext {
  companyId: string
  userId: string
  roleId?: string
}

/**
 * Add company_id filter to query
 * This should be used for all queries that need tenant isolation
 */
export function addTenantFilter(
  query: string,
  _companyId: string,
  tableAlias: string = ''
): string {
  const alias = tableAlias ? `${tableAlias}.` : ''
  const paramIndex = getParamCount(query) + 1
  const whereClause = query.includes('WHERE')
    ? `AND ${alias}company_id = $${paramIndex}`
    : `WHERE ${alias}company_id = $${paramIndex}`

  return `${query} ${whereClause}`
}

/**
 * Get parameter count from SQL query
 */
function getParamCount(query: string): number {
  const matches = query.match(/\$\d+/g)
  return matches ? matches.length : 0
}

/**
 * Validate tenant access
 * Throws error if user tries to access data from different company
 */
export function validateTenantAccess(
  resourceCompanyId: string,
  userCompanyId: string
): void {
  if (resourceCompanyId !== userCompanyId) {
    throw new Error('Access denied: Resource belongs to a different company')
  }
}

/**
 * Create tenant-scoped query builder helper
 */
export class TenantQueryBuilder {
  constructor(private companyId: string) {}

  /**
   * Add tenant filter to query
   */
  scope(query: string, tableAlias: string = ''): string {
    return addTenantFilter(query, this.companyId, tableAlias)
  }

  /**
   * Create query with tenant filter
   */
  query(sql: string, params: any[] = []): { sql: string; params: any[] } {
    const scopedSql = this.scope(sql)
    return {
      sql: scopedSql,
      params: [...params, this.companyId],
    }
  }
}

