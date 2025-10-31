import { query } from './client'
import type { Company } from './schema'

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<Company | null> {
  const result = await query<Company>(
    'SELECT * FROM companies WHERE id = $1 LIMIT 1',
    [companyId]
  )
  return result[0] || null
}

/**
 * Create a new company
 */
export async function createCompany(data: {
  name: string
  legal_name?: string
  tax_id?: string
  address?: string
  phone?: string
  phone_country_code?: string
  email?: string
  website?: string
  currency_code?: string
}): Promise<Company> {
  const companyId = crypto.randomUUID()
  const result = await query<Company>(
    `INSERT INTO companies (
      id, name, legal_name, tax_id, address, phone, phone_country_code, email, website, 
      currency_code, fiscal_year_start, timezone, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL, 'UTC', true)
    RETURNING *`,
    [
      companyId,
      data.name,
      data.legal_name || null,
      data.tax_id || null,
      data.address || null,
      data.phone || null,
      data.phone_country_code || null,
      data.email || null,
      data.website || null,
      data.currency_code || 'USD',
    ]
  )
  return result[0]
}

/**
 * Update company
 */
export async function updateCompany(
  companyId: string,
  data: Partial<Pick<Company, 'name' | 'legal_name' | 'tax_id' | 'address' | 'phone' | 'email' | 'website' | 'currency_code' | 'is_active'>>
): Promise<Company> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  }

  if (updates.length === 0) {
    throw new Error('No fields to update')
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(companyId)

  const result = await query<Company>(
    `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )

  if (!result[0]) {
    throw new Error('Company not found')
  }

  return result[0]
}

/**
 * List all active companies (for admin use)
 */
export async function listCompanies(): Promise<Company[]> {
  return await query<Company>(
    'SELECT * FROM companies WHERE is_active = true ORDER BY name'
  )
}

