import { query } from './client'
import type { Invitation, User } from './schema'

/**
 * Create user invitation
 */
export async function createInvitation(data: {
  email: string
  roleId: string
  companyId: string
  invitedBy: string
  expiresInDays?: number
}): Promise<Invitation> {
  const invitationId = crypto.randomUUID()
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7))

  const result = await query<Invitation>(
    `INSERT INTO invitations (id, email, role_id, company_id, invited_by, status, token, expires_at)
     VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
     RETURNING *`,
    [
      invitationId,
      data.email,
      data.roleId,
      data.companyId,
      data.invitedBy,
      token,
      expiresAt.toISOString(),
    ]
  )

  return result[0]
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const result = await query<Invitation>(
    `SELECT * FROM invitations WHERE token = $1 AND status = 'pending' AND expires_at > NOW() LIMIT 1`,
    [token]
  )
  return result[0] || null
}

/**
 * Get all invitations for a company
 */
export async function getInvitationsByCompany(companyId: string): Promise<Invitation[]> {
  return await query<Invitation>(
    `SELECT 
      i.*,
      r.name as role_name,
      u.name as inviter_name
     FROM invitations i
     LEFT JOIN roles r ON i.role_id = r.id
     LEFT JOIN users u ON i.invited_by = u.id
     WHERE i.company_id = $1
     ORDER BY i.created_at DESC`,
    [companyId]
  )
}

/**
 * Update invitation role
 */
export async function updateInvitationRole(
  invitationId: string,
  roleId: string
): Promise<Invitation> {
  const result = await query<Invitation>(
    `UPDATE invitations 
     SET role_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [roleId, invitationId]
  )

  if (!result[0]) {
    throw new Error('Invitation not found')
  }

  return result[0]
}

/**
 * Update user role (for active users)
 */
export async function updateUserRoleInCompany(
  userId: string,
  roleId: string
): Promise<User> {
  const result = await query<User>(
    `UPDATE users 
     SET role_id = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [roleId, userId]
  )

  if (!result[0]) {
    throw new Error('User not found')
  }

  return result[0]
}

/**
 * Delete invitation
 */
export async function deleteInvitation(invitationId: string): Promise<void> {
  await query(
    `DELETE FROM invitations WHERE id = $1`,
    [invitationId]
  )
}

/**
 * Get all active users for a company
 */
export async function getActiveUsersByCompany(companyId: string): Promise<Array<User & { role_name?: string }>> {
  return await query<Array<User & { role_name?: string }>>(
    `SELECT 
      u.*,
      r.name as role_name
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     WHERE u.company_id = $1 AND u.is_active = true
     ORDER BY u.created_at DESC`,
    [companyId]
  )
}

/**
 * Accept invitation
 */
export async function acceptInvitation(
  token: string,
  appwriteUserId: string,
  name: string
): Promise<User> {
  // Find and verify invitation
  const invitation = await getInvitationByToken(token)
  if (!invitation) {
    throw new Error('Invitation not found or expired')
  }

  // Update or create user record
  const existingUser = await query<User>(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [invitation.email]
  )

  let user: User

  if (existingUser[0]) {
    // Update existing user
    const result = await query<User>(
      `UPDATE users 
       SET appwrite_user_id = $1, name = $2, role_id = $3, company_id = $4, is_active = true, updated_at = CURRENT_TIMESTAMP
       WHERE email = $5
       RETURNING *`,
      [appwriteUserId, name, invitation.role_id, invitation.company_id, invitation.email]
    )
    user = result[0]
  } else {
    // Create new user
    const userId = crypto.randomUUID()
    const result = await query<User>(
      `INSERT INTO users (id, appwrite_user_id, email, name, role_id, company_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [userId, appwriteUserId, invitation.email, name, invitation.role_id, invitation.company_id]
    )
    user = result[0]
  }

  // Mark invitation as accepted
  await query(
    `UPDATE invitations SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [invitation.id]
  )

  return user
}

/**
 * Mark expired invitations
 */
export async function markExpiredInvitations(): Promise<number> {
  const result = await query<Array<{ count: string }>>(
    `WITH updated AS (
      UPDATE invitations 
      SET status = 'expired', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' AND expires_at < NOW()
      RETURNING id
    )
    SELECT COUNT(*)::text as count FROM updated`
  )
  return parseInt(result[0]?.count || '0', 10)
}
