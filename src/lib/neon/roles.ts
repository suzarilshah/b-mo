import { query } from './client'
import type { Role } from './schema'

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<Role | null> {
  const result = await query<Role>(
    'SELECT * FROM roles WHERE id = $1 LIMIT 1',
    [roleId]
  )
  return result[0] || null
}

/**
 * Get role by name
 */
export async function getRoleByName(roleName: string): Promise<Role | null> {
  const result = await query<Role>(
    'SELECT * FROM roles WHERE name = $1 LIMIT 1',
    [roleName]
  )
  return result[0] || null
}

/**
 * List all roles
 */
export async function listRoles(): Promise<Role[]> {
  return await query<Role>('SELECT * FROM roles ORDER BY name')
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  roleId: string | null,
  permission: string
): Promise<boolean> {
  if (!roleId) return false

  const role = await getRoleById(roleId)
  if (!role) return false

  // Check for "all" permission
  if (role.permissions?.all === true) {
    return true
  }

  // Check specific permission
  return role.permissions?.[permission] === true
}

