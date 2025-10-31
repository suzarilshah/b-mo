import { query } from './client'
import type { User, Company, Role } from './schema'
import { initializeEssentialSchema } from './setup'

// Cache to avoid checking table existence on every call
let schemaInitialized = false

/**
 * Ensure schema is initialized before operations
 */
async function ensureSchemaInitialized(): Promise<void> {
  if (schemaInitialized) return
  
  try {
    // Quick check if users table exists
    await query('SELECT 1 FROM users LIMIT 1')
    schemaInitialized = true
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || ''
    // Check for various forms of "table does not exist" error
    if (
      errorMessage.includes('does not exist') ||
      (errorMessage.includes('relation') && errorMessage.includes('users')) ||
      (errorMessage.toLowerCase().includes('table') && errorMessage.includes('users'))
    ) {
      // Table doesn't exist, initialize it
      console.log('Users table not found. Initializing essential schema...')
      await initializeEssentialSchema()
      schemaInitialized = true
    } else {
      throw error
    }
  }
}

/**
 * Get user by Appwrite user ID
 */
export async function getUserByAppwriteId(appwriteUserId: string): Promise<User | null> {
  await ensureSchemaInitialized()
  
  const result = await query<User>(
    'SELECT * FROM users WHERE appwrite_user_id = $1 LIMIT 1',
    [appwriteUserId]
  )
  return result[0] || null
}

/**
 * Create or update user record in database
 */
export async function createOrUpdateUser(
  appwriteUserId: string,
  email: string,
  name: string,
  companyId?: string,
  roleId?: string
): Promise<User> {
  await ensureSchemaInitialized()
  
  // Check if user exists
  const existing = await getUserByAppwriteId(appwriteUserId)
  
  if (existing) {
    // Update existing user
    const result = await query<User>(
      `UPDATE users 
       SET email = $1, name = $2, company_id = COALESCE($3, company_id), 
           role_id = COALESCE($4, role_id), updated_at = CURRENT_TIMESTAMP
       WHERE appwrite_user_id = $5
       RETURNING *`,
      [email, name, companyId || null, roleId || null, appwriteUserId]
    )
    return result[0]
  } else {
    // Create new user
    const userId = crypto.randomUUID()
    const result = await query<User>(
      `INSERT INTO users (id, appwrite_user_id, email, name, company_id, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [userId, appwriteUserId, email, name, companyId || null, roleId || null]
    )
    return result[0]
  }
}

/**
 * Get user with role and company details
 */
export async function getUserWithDetails(appwriteUserId: string): Promise<{
  user: User
  role: Role | null
  company: Company | null
} | null> {
  const user = await getUserByAppwriteId(appwriteUserId)
  if (!user) return null

  let role: Role | null = null
  let company: Company | null = null

  if (user.role_id) {
    const roleResult = await query<Role>(
      'SELECT * FROM roles WHERE id = $1 LIMIT 1',
      [user.role_id]
    )
    role = roleResult[0] || null
  }

  if (user.company_id) {
    const companyResult = await query<Company>(
      'SELECT * FROM companies WHERE id = $1 LIMIT 1',
      [user.company_id]
    )
    company = companyResult[0] || null
  }

  return { user, role, company }
}

/**
 * Get all companies for a user (for multi-company support)
 */
export async function getUserCompanies(appwriteUserId: string): Promise<Company[]> {
  const user = await getUserByAppwriteId(appwriteUserId)
  if (!user) return []

  // For now, return the user's primary company
  // In the future, this could support multiple company memberships
  if (user.company_id) {
    const result = await query<Company>(
      'SELECT * FROM companies WHERE id = $1',
      [user.company_id]
    )
    return result
  }

  return []
}

/**
 * Update user's active company
 */
export async function updateUserCompany(
  appwriteUserId: string,
  companyId: string
): Promise<User> {
  const result = await query<User>(
    `UPDATE users SET company_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE appwrite_user_id = $2
     RETURNING *`,
    [companyId, appwriteUserId]
  )
  if (!result[0]) {
    throw new Error('User not found')
  }
  return result[0]
}

/**
 * Update user's role
 */
export async function updateUserRole(
  appwriteUserId: string,
  roleId: string
): Promise<User> {
  const result = await query<User>(
    `UPDATE users SET role_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE appwrite_user_id = $2
     RETURNING *`,
    [roleId, appwriteUserId]
  )
  if (!result[0]) {
    throw new Error('User not found')
  }
  return result[0]
}

/**
 * Update user's name
 */
export async function updateUserName(
  appwriteUserId: string,
  name: string
): Promise<User> {
  const result = await query<User>(
    `UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP
     WHERE appwrite_user_id = $2
     RETURNING *`,
    [name, appwriteUserId]
  )
  if (!result[0]) {
    throw new Error('User not found')
  }
  return result[0]
}

